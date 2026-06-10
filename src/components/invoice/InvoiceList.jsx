import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices, deleteInvoice, markInvoicePaid, saveInvoice, getSettings } from '../../lib/db';
import { generateInvoicePDF, downloadInvoicePDF } from '../../lib/pdf';
import { formatINR } from '../../lib/gst';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import SkeletonRow from '../ui/SkeletonRow';
import { useToast } from '../../components/ui/Toast';
import { useLicense } from '../../hooks/useLicense';
import { WhatsAppShareButton } from './WhatsAppShareButton';
import { Link } from 'react-router-dom';

export function StatusBadge({ status }) {
  const config = {
    draft:    { label: 'Draft',    classes: 'bg-gray-100 text-gray-600' },
    sent:     { label: 'Sent',     classes: 'bg-blue-100 text-blue-700' },
    paid:     { label: 'Paid',     classes: 'bg-green-100 text-green-700' },
    overdue:  { label: 'Overdue',  classes: 'bg-red-100 text-red-700' },
    partial:  { label: 'Partial',  classes: 'bg-amber-100 text-amber-700' },
    converted: { label: 'Converted', classes: 'bg-purple-100 text-purple-700' },
  };
  const s = config[status?.toLowerCase()] || config.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.classes}`}>
      {s.label}
    </span>
  );
}

export function InvoiceRow({ invoice, compact = false, onMarkPaid, onDownload, onDelete, onConvert, onIssueCreditNote }) {
  const isOverdue = invoice.dueDate && 
                    new Date(invoice.dueDate) < new Date() && 
                    invoice.status !== 'paid' && invoice.documentType !== 'proforma';
  const effectiveStatus = isOverdue ? 'overdue' : invoice.status;

  return (
    <div className={`flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors ${compact ? 'py-3' : 'py-3.5'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{invoice.invoiceNumber}</span>
          <StatusBadge status={effectiveStatus} />
          {invoice.documentType === 'proforma' && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">QUOTE</span>
          )}
          {invoice.documentType === 'credit_note' && (
            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">CREDIT</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{invoice.clientName}</p>
      </div>
      {!compact && (
        <div className="hidden sm:block text-xs text-gray-500 w-24 flex-shrink-0">
          {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      )}
      <div className="text-sm font-semibold text-gray-800 text-right flex-shrink-0 w-24">
        {formatINR(invoice.total || 0)}
      </div>
      {!compact && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onDownload?.(invoice)} title="Download PDF"
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <WhatsAppShareButton invoice={invoice} clientPhone={invoice.client?.phone} />
          {invoice.documentType === 'proforma' && invoice.status !== 'converted' && (
            <button onClick={() => onConvert?.(invoice)} title="Convert to Tax Invoice"
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </button>
          )}
          {invoice.status !== 'paid' && invoice.documentType === 'invoice' && (
            <button onClick={() => onMarkPaid?.(invoice)} title="Mark as paid"
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          {invoice.status === 'paid' && invoice.documentType === 'invoice' && (
            <button onClick={() => onIssueCreditNote?.(invoice)} title="Issue credit note"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3" />
              </svg>
            </button>
          )}
          <button onClick={() => onDelete?.(invoice.id)} title="Delete"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function InvoiceList() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isPaid } = useLicense();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [creditNoteItems, setCreditNoteItems] = useState([]);
  const [paymentData, setPaymentData] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    method: 'Bank Transfer',
    hasTDS: false,
    tdsAmount: '',
    tdsSection: '194J'
  });

  const tabs = ['All', 'Draft', 'Sent', 'Paid', 'Overdue'];

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    const { data } = await getInvoices();
    setInvoices(data || []);
    setLoading(false);
  }

  const filteredInvoices = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return invoices.filter(inv => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Draft') return inv.status === 'Draft';
      if (activeTab === 'Sent') return inv.status === 'Sent';
      if (activeTab === 'Paid') return inv.status === 'Paid';
      if (activeTab === 'Overdue') return inv.dueDate < today && inv.status !== 'Paid';
      return true;
    });
  }, [invoices, activeTab]);

  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'draft');

  const handleDownload = async (invoice) => {
    const { data: settings } = await getSettings();
    const { success, blob, error } = await generateInvoicePDF(invoice, settings);
    if (success && blob) {
      downloadInvoicePDF(blob, invoice.invoiceNumber);
    } else {
      alert('Error generating PDF: ' + error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice(id);
      loadInvoices();
    }
  };

  const handleMarkPaid = async (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaidModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedInvoice) return;
    
    const finalPaymentData = {
      ...paymentData,
      tdsAmount: paymentData.hasTDS ? Math.round(parseFloat(paymentData.tdsAmount || 0) * 100) : 0
    };

    await markInvoicePaid(selectedInvoice.id, finalPaymentData);
    setShowPaidModal(false);
    loadInvoices();
    addToast({ message: 'Payment recorded successfully', type: 'success' });
  };

  const handleConvertToInvoice = async (proforma) => {
    const { data: settings } = await getSettings();
    const invoiceNumber = `INV-${settings.nextInvoiceNumber}`;
    
    const invoiceData = {
      ...proforma,
      invoiceNumber,
      documentType: 'invoice',
      status: 'Sent',
      financialYear: '2024-25',
      createdAt: Date.now(),
    };

    const paiseItems = (proforma.lineItems || []).map(item => ({
      ...item,
      rate: Math.round(parseFloat(item.rate || 0) * 100)
    }));

    const { success } = await saveInvoice(invoiceData, paiseItems);
    if (success) {
      await db.invoices.update(proforma.id, { status: 'converted' });
      await saveSettings({ ...settings, nextInvoiceNumber: parseInt(settings.nextInvoiceNumber) + 1 });
      addToast({ message: `Tax invoice ${invoiceNumber} created from this quotation.`, type: 'success' });
      loadInvoices();
    }
  };

  const handleIssueCreditNote = (invoice) => {
    if (!isPaid) {
      addToast({ message: 'Credit notes are a Pro feature', type: 'info' });
      navigate('/upgrade');
      return;
    }
    setSelectedInvoice(invoice);
    setCreditNoteItems((invoice.lineItems || []).map(item => ({ ...item, selected: true })));
    setShowCreditNoteModal(true);
  };

  const confirmCreditNote = async () => {
    if (!selectedInvoice) return;
    
    const selectedItems = creditNoteItems.filter(i => i.selected);
    if (selectedItems.length === 0) {
      addToast({ message: 'Please select at least one item to credit', type: 'error' });
      return;
    }

    const cnNumber = `CN-${Math.floor(Math.random() * 10000)}`;
    
    const creditNoteData = {
      ...selectedInvoice,
      id: undefined,
      invoiceNumber: cnNumber,
      documentType: 'credit_note',
      referenceInvoiceNumber: selectedInvoice.invoiceNumber,
      status: 'Sent',
      financialYear: '2024-25',
      createdAt: Date.now(),
    };

    const negativeItems = selectedItems.map(item => ({
      ...item,
      rate: -Math.round(parseFloat(item.rate || 0) * 100)
    }));

    const { success } = await saveInvoice(creditNoteData, negativeItems);
    if (success) {
      addToast({ message: `Credit note ${cnNumber} issued successfully`, type: 'success' });
      setShowCreditNoteModal(false);
      loadInvoices();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Button variant="primary" onClick={() => navigate('/app/invoices/new')}>
          + New Invoice
        </Button>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'border-b-2 border-brand-500 text-brand-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <EmptyState 
          icon={<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl">📄</div>}
          title={`No ${activeTab.toLowerCase()} invoices`}
          description="Start by creating your first invoice to track your business revenue."
          action={<Button variant="primary" onClick={() => navigate('/app/invoices/new')}>Create Invoice</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filteredInvoices.map(inv => (
              <InvoiceRow 
                key={inv.id} 
                invoice={inv} 
                onDownload={handleDownload}
                onMarkPaid={handleMarkPaid}
                onDelete={handleDelete}
                onConvert={handleConvertToInvoice}
                onIssueCreditNote={handleIssueCreditNote}
              />
            ))}
          </div>
        </div>
      )}

      {!isPaid && unpaidInvoices.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm font-semibold text-amber-800">Invoice aging report</p>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">PRO</span>
            </div>
            <Link to="/upgrade" className="text-xs font-semibold text-amber-700 hover:underline">Unlock →</Link>
          </div>
          <p className="text-xs text-amber-700 mt-1 ml-6">
            See which clients owe you money and for how long — grouped by 1–30, 31–60, and 60+ days overdue.
          </p>
        </div>
      )}

      <Modal 
        isOpen={showPaidModal} 
        onClose={() => setShowPaidModal(false)} 
        title="Mark as Paid"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Payment Date</label>
              <input 
                type="date" 
                className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-500 outline-none border-gray-300"
                value={paymentData.date}
                onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Method</label>
              <select 
                className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-500 outline-none border-gray-300"
                value={paymentData.method}
                onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <input 
                type="checkbox" 
                id="tds-check"
                checked={paymentData.hasTDS}
                onChange={e => setPaymentData({ ...paymentData, hasTDS: e.target.checked })}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="tds-check" className="text-sm font-medium text-gray-700">
                Client deducted TDS
              </label>
              <span className="text-xs text-gray-400">(Section 194J — 10% for professional services)</span>
            </div>
            {paymentData.hasTDS && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">TDS amount deducted (₹)</label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={paymentData.tdsAmount}
                    onChange={e => setPaymentData({ ...paymentData, tdsAmount: e.target.value })}
                    placeholder="e.g. 1000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">TDS section</label>
                  <select 
                    value={paymentData.tdsSection}
                    onChange={e => setPaymentData({ ...paymentData, tdsSection: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="194J">Section 194J — Professional services (10%)</option>
                    <option value="194C">Section 194C — Contractors (1%/2%)</option>
                    <option value="194H">Section 194H — Commission (5%)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowPaidModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmPayment}>Confirm Payment</Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showCreditNoteModal} 
        onClose={() => setShowCreditNoteModal(false)} 
        title="Issue Credit Note"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">Select the items to be credited. Amounts will be reversed in the credit note.</p>
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            {selectedInvoice?.lineItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={creditNoteItems[idx]?.selected}
                  onChange={() => {
                    const newItems = [...creditNoteItems];
                    newItems[idx] = { ...newItems[idx], selected: !newItems[idx].selected };
                    setCreditNoteItems(newItems);
                  }}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.description}</p>
                  <p className="text-xs text-gray-500">{item.qty} x {formatINR(item.rate)}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700">{formatINR(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreditNoteModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmCreditNote}>Issue Credit Note</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
