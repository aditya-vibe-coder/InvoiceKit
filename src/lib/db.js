import Dexie from 'dexie';

export const db = new Dexie('InvoiceKit');

db.version(1).stores({
  settings:  '++id',
  clients:   '++id, name, gstin, stateCode, createdAt, deletedAt',
  invoices:  '++id, invoiceNumber, clientId, invoiceDate, dueDate, status, total, financialYear, createdAt',
  lineItems: '++id, invoiceId',
  payments:  '++id, invoiceId, date',
  expenses:  '++id, date, category, financialYear, createdAt'
});

db.version(2).upgrade(async () => {
  // No-op upgrade to maintain version sequence
});

db.version(4).stores({
  settings:  '++id',
  clients:   '++id, name, gstin, stateCode, createdAt, deletedAt',
  invoices:  '++id, invoiceNumber, clientId, invoiceDate, dueDate, status, total, financialYear, createdAt, documentType, irn',
  lineItems: '++id, invoiceId',
  payments:  '++id, invoiceId, date, hasTDS',
  expenses:  '++id, date, category, financialYear, createdAt'
});

/** 
 * @typedef {{ success: boolean, data: any, error: string|null }} DbResult 
 */

/**
 * Helper to wrap DB operations in a standard result shape
 * @param {Function} operation 
 * @returns {Promise<DbResult>}
 */
async function wrap(operation) {
  try {
    const data = await operation();
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Database Error:', error);
    return { 
      success: false, 
      data: null, 
      error: error instanceof Error ? error.message : 'An unexpected database error occurred' 
    };
  }
}

// ─── SETTINGS ─────────────────────────────────────────────────

/**
 * Get settings (singleton — always id=1)
 * @returns {Promise<DbResult>} data = settings object or null if not set
 */
export async function getSettings() {
  return wrap(async () => {
    return await db.settings.get(1);
  });
}

/**
 * Save or update settings
 * @param {Object} settings - { businessName, gstin, stateCode, stateIndex, address, bankName, bankAccount, bankIfsc, logoBase64, invoicePrefix, nextInvoiceNumber }
 * @returns {Promise<DbResult>}
 */
export async function saveSettings(settings) {
  return wrap(async () => {
    // Always use id: 1 for settings singleton
    const id = settings.id || 1;
    await db.settings.put({ ...settings, id });
    return { id };
  });
}

// ─── CLIENTS ──────────────────────────────────────────────────

export async function getClients() {
  return wrap(async () => {
    return await db.clients.filter(c => c.deletedAt === undefined).toArray();
  });
}

export async function getClient(id) {
  return wrap(async () => {
    return await db.clients.get(id);
  });
}

export async function saveClient(client) {
  return wrap(async () => {
    const id = await db.clients.put({ ...client, createdAt: client.createdAt || Date.now() });
    return { id };
  });
}

export async function deleteClient(id) {
  return wrap(async () => {
    await db.clients.update(id, { deletedAt: Date.now() });
    return { id };
  });
}

// ─── INVOICES ─────────────────────────────────────────────────

/**
 * Get all invoices with their line items and client name joined
 * @param {{ status?: string, financialYear?: string }} filters
 * @returns {Promise<DbResult>} data = array of invoice objects with lineItems[] and clientName
 */
export async function getInvoices(filters = {}) {
  return wrap(async () => {
    let query = db.invoices;

    if (filters.financialYear) {
      query = query.where('financialYear').equals(filters.financialYear);
    } else if (filters.status) {
      query = query.where('status').equals(filters.status);
    }

    const invoices = await query.toArray();
    
    // Join line items and client names
    const enrichedInvoices = await Promise.all(invoices.map(async (inv) => {
      const lineItems = await db.lineItems.where('invoiceId').equals(inv.id).toArray();
      const client = await db.clients.get(inv.clientId);
      return {
        ...inv,
        lineItems,
        clientName: client?.name || 'Unknown Client'
      };
    }));

    return enrichedInvoices;
  });
}

export async function getInvoice(id) {
  return wrap(async () => {
    const invoice = await db.invoices.get(id);
    if (!invoice) return null;

    const [lineItems, payments, client] = await Promise.all([
      db.lineItems.where('invoiceId').equals(id).toArray(),
      db.payments.where('invoiceId').equals(id).toArray(),
      db.clients.get(invoice.clientId)
    ]);

    return {
      ...invoice,
      lineItems,
      payments,
      client
    };
  });
}

export async function saveInvoice(invoice, lineItems) {
  return wrap(async () => {
    return await db.transaction('rw', db.invoices, db.lineItems, db.settings, async () => {
      const invId = await db.invoices.put({ ...invoice });
      
      // Increment invoice number if it's a new invoice
      if (!invoice.id) {
        const settings = await db.settings.get(1);
        if (settings) {
          await db.settings.update(1, { 
            nextInvoiceNumber: (parseInt(settings.nextInvoiceNumber) || 1) + 1 
          });
        }
      }
      
      // Save line items: delete old ones first if updating
      await db.lineItems.where('invoiceId').equals(invId).delete();
      
      const itemsToSave = lineItems.map((item, index) => ({
        ...item,
        invoiceId: invId,
        index
      }));
      
      await db.lineItems.bulkPut(itemsToSave);
      
      return { id: invId };
    });
  });
}

export async function deleteInvoice(id) {
  return wrap(async () => {
    await db.transaction('rw', db.invoices, db.lineItems, db.payments, async () => {
      await db.invoices.delete(id);
      await db.lineItems.where('invoiceId').equals(id).delete();
      await db.payments.where('invoiceId').equals(id).delete();
    });
    return { id };
  });
}

export async function markInvoicePaid(id, paymentDetails) {
  return wrap(async () => {
    return await db.transaction('rw', db.invoices, db.payments, async () => {
      const paymentId = await db.payments.put({
        ...paymentDetails,
        invoiceId: id,
        date: paymentDetails.date || Date.now()
      });
      
      await db.invoices.update(id, { status: 'Paid' });
      return { paymentId };
    });
  });
}

/**
 * Count total invoices ever created (used for free tier limit check)
 * We count ALL records in the table to prevent bypassing limits via deletion.
 * @returns {Promise<number>}
 */
export async function getTotalInvoiceCount() {
  try {
    return await db.invoices.count();
  } catch (error) {
    console.error('Error counting invoices:', error);
    return 0;
  }
}

// ─── EXPENSES ─────────────────────────────────────────────────

export async function getExpenses(filters = {}) {
  return wrap(async () => {
    let query = db.expenses;
    
    if (filters.financialYear) {
      query = query.where('financialYear').equals(filters.financialYear);
    }

    const expenses = await query.toArray();
    
    if (filters.category) {
      return expenses.filter(e => e.category === filters.category);
    }
    
    return expenses;
  });
}

export async function saveExpense(expense) {
  return wrap(async () => {
    const id = await db.expenses.put({ ...expense, createdAt: expense.createdAt || Date.now() });
    return { id };
  });
}

export async function deleteExpense(id) {
  return wrap(async () => {
    await db.expenses.delete(id);
    return { id };
  });
}

// ─── REPORTS ──────────────────────────────────────────────────

/**
 * Get P&L data for a financial year (e.g., "2024-25")
 * @param {string} financialYear
 * @returns {Promise<DbResult>} data = { revenue: number, expenses: number, profit: number, byMonth: Array }
 */
export async function getPLData(financialYear) {
  return wrap(async () => {
    const invoices = await db.invoices.where('financialYear').equals(financialYear).toArray();
    const expenses = await db.expenses.where('financialYear').equals(financialYear).toArray();

    const revenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const byMonth = Array(12).fill(0).map((_, i) => ({
      month: i,
      revenue: 0,
      expenses: 0
    }));

    invoices.forEach(inv => {
      const date = new Date(inv.invoiceDate);
      if (!isNaN(date)) {
        byMonth[date.getMonth()].revenue += (inv.total || 0);
      }
    });

    expenses.forEach(exp => {
      const date = new Date(exp.date);
      if (!isNaN(date)) {
        byMonth[date.getMonth()].expenses += (exp.amount || 0);
      }
    });

    return {
      revenue,
      expenses: totalExpenses,
      profit: revenue - totalExpenses,
      byMonth
    };
  });
}

/**
 * Get GST summary for a financial year
 * @returns {Promise<DbResult>} data = { totalCGST: number, totalSGST: number, totalIGST: number, byMonth: Array }
 */
export async function getGSTSummary(financialYear) {
  return wrap(async () => {
    const invoices = await db.invoices.where('financialYear').equals(financialYear).toArray();
    const invoiceIds = invoices.map(i => i.id);
    const lineItems = await db.lineItems.where('invoiceId').anyOf(invoiceIds).toArray();

    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const byMonth = Array(12).fill(0).map((_, i) => ({
      month: i,
      cgst: 0,
      sgst: 0,
      igst: 0
    }));

    // Map for fast lookup of invoice date by id
    const invoiceDateMap = new Map(invoices.map(i => [i.id, i.invoiceDate]));

    lineItems.forEach(item => {
      const cgst = item.cgst || 0;
      const sgst = item.sgst || 0;
      const igst = item.igst || 0;

      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;

      const dateStr = invoiceDateMap.get(item.invoiceId);
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
          const m = date.getMonth();
          byMonth[m].cgst += cgst;
          byMonth[m].sgst += sgst;
          byMonth[m].igst += igst;
        }
      }
    });

    return {
      totalCGST,
      totalSGST,
      totalIGST,
      byMonth
    };
  });
}

// ─── BACKUP / RESTORE ─────────────────────────────────────────

/**
 * Export all data as a JSON object for backup
 * @returns {Promise<DbResult>} data = { version: 1, exportedAt: ISO string, tables: { settings, clients, invoices, lineItems, payments, expenses } }
 */
export async function exportData() {
  return wrap(async () => {
    const tables = {
      settings: await db.settings.toArray(),
      clients: await db.clients.toArray(),
      invoices: await db.invoices.toArray(),
      lineItems: await db.lineItems.toArray(),
      payments: await db.payments.toArray(),
      expenses: await db.expenses.toArray()
    };

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      tables
    };
  });
}

/**
 * Restore from exported JSON. Atomic — either all succeeds or none.
 * Validates structure before writing. Merges by default (does not delete existing).
 * @param {Object} backupJson
 * @returns {Promise<DbResult>}
 */
export async function importData(backupJson) {
  return wrap(async () => {
    // Validation
    if (!backupJson || typeof backupJson !== 'object') {
      throw new Error('Invalid backup format: Backup must be a JSON object');
    }
    if (!backupJson.version) {
      throw new Error('Invalid backup format: Missing version');
    }
    if (!backupJson.tables || typeof backupJson.tables !== 'object') {
      throw new Error('Invalid backup format: Missing tables object');
    }

    const tableNames = ['settings', 'clients', 'invoices', 'lineItems', 'payments', 'expenses'];
    for (const name of tableNames) {
      const tableData = backupJson.tables[name];
      if (tableData && (!Array.isArray(tableData) || tableData.some(item => typeof item !== 'object'))) {
        throw new Error(`Invalid data in table ${name}: Expected an array of objects`);
      }
    }

    await db.transaction('rw', ...tableNames.map(name => db[name]), async () => {
      for (const name of tableNames) {
        const data = backupJson.tables[name];
        if (data && Array.isArray(data)) {
          await db[name].bulkPut(data);
        }
      }
    });

    return { success: true };
  });
}

/**
 * Storage usage estimate
 * @returns {Promise<{ usedMB: number, quotaMB: number, percentUsed: number }>}
 */
export async function getStorageStats() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      const usedMB = usage / (1024 * 1024);
      const quotaMB = quota / (1024 * 1024);
      return {
        usedMB: parseFloat(usedMB.toFixed(2)),
        quotaMB: parseFloat(quotaMB.toFixed(2)),
        percentUsed: parseFloat(((usage / quota) * 100).toFixed(2))
      };
    }
  } catch (error) {
    console.warn('Storage estimate failed:', error);
  }
  return { usedMB: 0, quotaMB: 0, percentUsed: 0 };
}
