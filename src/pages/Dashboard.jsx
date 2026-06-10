import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { formatINR } from '../lib/gst';
import SkeletonRow from '../components/ui/SkeletonRow';
import { useLicense } from '../hooks/useLicense';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ label, value, sublabel, color, icon }) {
  const colors = {
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    red:   { bg: 'bg-red-50',   text: 'text-red-600',   border: 'border-red-100' },
    blue:  { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-100' },
  };
  const c = colors[color];
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {value === null ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-24 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-xl font-bold ${c.text} mb-0.5`}>{value}</p>
          <p className="text-xs text-gray-400">{sublabel}</p>
        </>
      )}
    </div>
  );
}

function InvoiceUsageMeter() {
  const { isPaid } = useLicense();
  const [count, setCount] = useState(0);
  const FREE_LIMIT = 10;

  useEffect(() => {
    let cancelled = false;
    db.invoices.count().then(count => {
      if (!cancelled) setCount(count);
    });
    return () => { cancelled = true; };
  }, []);

  if (isPaid) return null;

  const used = Math.min(count, FREE_LIMIT);
  const pct = (used / FREE_LIMIT) * 100;
  const remaining = Math.max(FREE_LIMIT - count, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">Free tier usage</span>
        <span className={`text-xs font-bold ${remaining <= 2 ? 'text-red-600' : 'text-gray-600'}`}>
          {used} / {FREE_LIMIT}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
        <div 
          className={`h-1.5 rounded-full transition-all ${
            pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-green-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mb-3">
        {remaining === 0 
          ? 'Invoice limit reached. Upgrade to create more.'
          : `${remaining} invoice${remaining !== 1 ? 's' : ''} remaining on free plan`
        }
      </p>
      <Link 
        to="/upgrade"
        className="block w-full bg-green-600 text-white text-xs font-semibold text-center py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        Upgrade — ₹999/year
      </Link>
    </div>
  );
}

export function InvoiceRow({ invoice, compact = false, onMarkPaid, onDownload, onDelete }) {
  const isOverdue = invoice.dueDate && 
                    new Date(invoice.dueDate) < new Date() && 
                    invoice.status !== 'paid';
  const effectiveStatus = isOverdue ? 'overdue' : invoice.status;

  return (
    <div className={`flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors ${compact ? 'py-3' : 'py-3.5'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{invoice.invoiceNumber}</span>
          <StatusBadge status={effectiveStatus} />
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
          {invoice.status !== 'paid' && (
            <button onClick={() => onMarkPaid?.(invoice)} title="Mark as paid"
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function StatusBadge({ status }) {
  const config = {
    draft:    { label: 'Draft',    classes: 'bg-gray-100 text-gray-600' },
    sent:     { label: 'Sent',     classes: 'bg-blue-100 text-blue-700' },
    paid:     { label: 'Paid',     classes: 'bg-green-100 text-green-700' },
    overdue:  { label: 'Overdue',  classes: 'bg-red-100 text-red-700' },
    partial:  { label: 'Partial',  classes: 'bg-amber-100 text-amber-700' },
  };
  const s = config[status?.toLowerCase()] || config.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.classes}`}>
      {s.label}
    </span>
  );
}

export default function Dashboard() {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [settingsRows, invoices, expenses] = await Promise.all([
          db.settings.toArray(),
          db.invoices.orderBy('createdAt').reverse().limit(200).toArray(),
          db.expenses.toArray(),
        ]);
        
        if (cancelled) return;

        const s = settingsRows[0] || null;
        setSettings(s);
        
        const paid = invoices.filter(i => i.status === 'paid');
        const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'draft');
        const totalRevenue = paid.reduce((sum, i) => sum + (i.total || 0), 0);
        const totalPending = unpaid.reduce((sum, i) => sum + (i.total || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        setStats({ totalRevenue, totalPending, totalExpenses, invoiceCount: invoices.length });
        setRecentInvoices(invoices.slice(0, 5));
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const businessName = settings?.businessName || null;
  const greeting = getGreeting();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}{businessName ? `, ${businessName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {!loading && !settings?.businessName && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Complete your business profile</p>
            <p className="text-xs text-amber-700 mt-0.5">Add your GSTIN and business details to start creating GST-compliant invoices.</p>
          </div>
          <Link to="/app/settings" className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline whitespace-nowrap">
            Set up now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total revenue"
          value={loading ? null : formatINR(stats?.totalRevenue || 0)}
          sublabel="from paid invoices"
          color="green"
        />
        <StatCard
          label="Pending"
          value={loading ? null : formatINR(stats?.totalPending || 0)}
          sublabel="awaiting payment"
          color="amber"
        />
        <StatCard
          label="Expenses"
          value={loading ? null : formatINR(stats?.totalExpenses || 0)}
          sublabel="this financial year"
          color="red"
        />
        <StatCard
          label="Invoices"
          value={loading ? null : String(stats?.invoiceCount || 0)}
          sublabel="total created"
          color="blue"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Recent invoices</h2>
            <Link to="/app/invoices" className="text-xs text-green-600 hover:text-green-700 font-medium">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="divide-y divide-gray-50">
              {[1,2,3].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">No invoices yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first invoice to start tracking revenue</p>
              <Link 
                to="/app/invoices/new"
                className="mt-4 bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                + Create first invoice
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentInvoices.map(invoice => (
                <InvoiceRow key={invoice.id} invoice={invoice} compact />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Quick actions</h2>
            <div className="space-y-2">
              <Link to="/app/invoices/new"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">New invoice</p>
                  <p className="text-xs text-gray-400">GST-compliant PDF</p>
                </div>
              </Link>
              <Link to="/app/clients"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Add client</p>
                  <p className="text-xs text-gray-400">Save billing details</p>
                </div>
              </Link>
              <Link to="/app/expenses"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Log expense</p>
                  <p className="text-xs text-gray-400">Track ITR deductions</p>
                </div>
              </Link>
            </div>
          </div>
          <InvoiceUsageMeter />
        </div>
      </div>
    </div>
  );
}
