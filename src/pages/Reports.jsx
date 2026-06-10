import React, { useState, useEffect } from 'react';
import { PaidGate } from '../components/ui/PaidGate';
import { getPLData, getGSTSummary, db } from '../lib/db';
import { formatINR } from '../lib/gst';

function InvoiceAgingReport({ invoices }) {
  const today = new Date();
  
  const buckets = {
    current:   { label: 'Current (not yet due)',  invoices: [] },
    '1-30':    { label: '1–30 days overdue',      invoices: [] },
    '31-60':   { label: '31–60 days overdue',     invoices: [] },
    '61-90':   { label: '61–90 days overdue',     invoices: [] },
    '90plus':  { label: '90+ days overdue',       invoices: [] },
  };

  invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'draft')
    .forEach(inv => {
      if (!inv.dueDate) { buckets.current.invoices.push(inv); return; }
      const daysOverdue = Math.floor((today - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
      if (daysOverdue <= 0)  buckets.current.invoices.push(inv);
      else if (daysOverdue <= 30) buckets['1-30'].invoices.push(inv);
      else if (daysOverdue <= 60) buckets['31-60'].invoices.push(inv);
      else if (daysOverdue <= 90) buckets['61-90'].invoices.push(inv);
      else buckets['90plus'].invoices.push(inv);
    });

  return (
    <div className="space-y-4">
      {Object.entries(buckets).map(([key, bucket]) => {
        if (bucket.invoices.length === 0) return null;
        const total = bucket.invoices.reduce((sum, i) => sum + (i.total || 0), 0);
        const isUrgent = key === '61-90' || key === '90plus';
        
        return (
          <div key={key} className={`rounded-xl border p-4 ${isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${isUrgent ? 'text-red-700' : 'text-gray-700'}`}>
                {bucket.label}
              </h3>
              <span className={`text-sm font-bold ${isUrgent ? 'text-red-700' : 'text-gray-800'}`}>
                {formatINR(total)}
              </span>
            </div>
            <div className="space-y-2">
              {bucket.invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{inv.invoiceNumber}</span>
                    <span className="text-gray-400 ml-2">{inv.clientName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">{formatINR(inv.total)}</span>
                    {inv.dueDate && (
                      <span className={`text-xs ${isUrgent ? 'text-red-600' : 'text-gray-400'}`}>
                        Due: {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">Total outstanding</p>
        <p className="text-2xl font-bold text-gray-900">
          {formatINR(Object.values(buckets).flatMap(b => b.invoices).reduce((s, i) => s + (i.total || 0), 0))}
        </p>
        <p className="text-xs text-gray-400 mt-1">across {Object.values(buckets).flatMap(b => b.invoices).length} unpaid invoices</p>
      </div>
    </div>
  );
}

function TDSSummary({ financialYear }) {
  const [tdsData, setTdsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadTDS() {
      setLoading(true);
      try {
        const payments = await db.payments.toArray();
        const invoices = await db.invoices.toArray();
        const clients = await db.clients.toArray();

        if (cancelled) return;

        const filtered = payments.filter(p => {
          const inv = invoices.find(i => i.id === p.invoiceId);
          return p.hasTDS && inv?.financialYear === financialYear;
        }).map(p => {
          const inv = invoices.find(i => i.id === p.invoiceId);
          const client = clients.find(c => c.id === inv?.clientId);
          return {
            clientName: client?.name || 'Unknown',
            invoiceNumber: inv?.invoiceNumber,
            grossAmount: inv?.total || 0,
            tdsAmount: p.tdsAmount || 0,
            tdsSection: p.tdsSection,
            netReceived: (inv?.total || 0) - (p.tdsAmount || 0)
          };
        });
        setTdsData(filtered);
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadTDS();
    return () => { cancelled = true; };
  }, [financialYear]);

  if (loading) return <div className="animate-pulse space-y-2">
    {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}
  </div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">TDS Tracking</h2>
        <span className="text-xs text-gray-400 italic">Reconcile with Form 26AS</span>
      </div>
      
      {tdsData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No TDS deductions recorded for this year.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Client</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Invoice</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Gross</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">TDS</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Section</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tdsData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.clientName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatINR(row.grossAmount)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatINR(row.tdsAmount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{row.tdsSection}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatINR(row.netReceived)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportsContent() {
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [plData, setPlData] = useState(null);
  const [gstData, setGstData] = useState(null);
  const [agingInvoices, setAgingInvoices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function loadReports() {
      try {
        const [plRes, gstRes, invoices] = await Promise.all([
          getPLData(financialYear),
          getGSTSummary(financialYear),
          db.invoices.toArray()
        ]);
        if (!cancelled) {
          setPlData(plRes.data);
          setGstData(gstRes.data);
          setAgingInvoices(invoices);
        }
      } catch (error) {
        if (!cancelled) console.error('Failed to load reports:', error);
      }
    }
    loadReports();
    return () => { cancelled = true; };
  }, [financialYear]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business reports</h1>
          <p className="text-gray-500">Analyze your revenue, expenses, and tax liabilities.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Financial year</label>
          <select 
            value={financialYear} 
            onChange={e => setFinancialYear(e.target.value)}
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-500 outline-none border-gray-300"
          >
            <option value="2023-24">2023-24</option>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard 
          title="Total revenue" 
          value={formatINR(plData?.revenue || 0)} 
          color="text-green-600" 
        />
        <ReportCard 
          title="Total expenses" 
          value={formatINR(plData?.expenses || 0)} 
          color="text-red-600" 
        />
        <ReportCard 
          title="Net profit" 
          value={formatINR(plData?.profit || 0)} 
          color={plData?.profit >= 0 ? 'text-green-600' : 'text-red-600'} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">GST liability</h2>
          <div className="space-y-4">
            <GSTRow label="CGST" value={formatINR(gstData?.totalCGST || 0)} />
            <GSTRow label="SGST" value={formatINR(gstData?.totalSGST || 0)} />
            <GSTRow label="IGST" value={formatINR(gstData?.totalIGST || 0)} />
            <div className="pt-4 border-t border-gray-200 flex justify-between items-center font-bold text-lg">
              <span>Total tax</span>
              <span>{formatINR((gstData?.totalCGST || 0) + (gstData?.totalSGST || 0) + (gstData?.totalIGST || 0))}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly performance</h2>
          <div className="space-y-3">
            {plData?.byMonth.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{new Date(2024, i).toLocaleString('default', { month: 'long' })}</span>
                <div className="flex gap-4">
                  <span className="text-green-600 font-medium">{formatINR(m.revenue)}</span>
                  <span className="text-red-600 font-medium">{formatINR(m.expenses)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-200 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Invoice aging report</h2>
          <InvoiceAgingReport invoices={agingInvoices} />
        </div>
        <div>
          <TDSSummary financialYear={financialYear} />
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, value, color }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function GSTRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function Reports() {
  return (
    <PaidGate
      feature="P&L and GST reports"
      description="Generate a profit & loss statement and GST summary for your CA — computed from your invoice and expense data."
    >
      <ReportsContent />
    </PaidGate>
  );
}
