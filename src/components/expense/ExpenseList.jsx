import React, { useState, useEffect, useMemo } from 'react';
import { db, getExpenses, deleteExpense } from '../../lib/db';
import { formatINR } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from './ExpenseForm';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { useLicense } from '../../hooks/useLicense';

export default function ExpenseList({ onEdit }) {
  const { isPaid } = useLicense();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fyFilter, setFyFilter] = useState('2024-25');
  const [catFilter, setCatFilter] = useState('All');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    
    const loadExpenses = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getExpenses({ 
          financialYear: fyFilter, 
          category: catFilter === 'All' ? undefined : catFilter 
        });
        if (!cancelled) {
          setExpenses(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load expenses:', err);
        if (!cancelled) {
          setExpenses([]);
          setLoading(false);
          setError('Could not load expenses. Please refresh.');
        }
      }
    };

    loadExpenses();
    return () => { cancelled = true; };
  }, [fyFilter, catFilter]);

  const groupedExpenses = useMemo(() => {
    const groups = {};
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[month]) groups[month] = { items: [], total: 0 };
      groups[month].items.push(exp);
      groups[month].total += exp.amount;
    });
    return groups;
  }, [expenses]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Category', 'Amount', 'GST Paid', 'Description', 'Reference'];
    const rows = expenses.map(e => [
      e.date,
      e.category,
      (e.amount / 100).toFixed(2),
      (e.gstPaid / 100).toFixed(2),
      `"${e.description || ''}"`,
      `"${e.receiptRef || ''}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses-${fyFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      await deleteExpense(id);
      setLoading(true);
      const { data } = await db.getExpenses({ 
        financialYear: fyFilter, 
        category: catFilter === 'All' ? undefined : catFilter 
      });
      setExpenses(data || []);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Financial Year</label>
            <select 
              className="px-3 py-1.5 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={fyFilter}
              onChange={e => setFyFilter(e.target.value)}
            >
              <option value="2024-25">FY 2024-25</option>
              <option value="2023-24">FY 2023-24</option>
              <option value="2022-23">FY 2022-23</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Category</label>
            <select 
              className="px-3 py-1.5 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
        <button 
          disabled={!isPaid}
          onClick={isPaid ? handleExportCSV : () => window.location.href = '/upgrade'}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors
            ${isPaid 
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
              : 'border-gray-200 text-gray-400 cursor-pointer'}`}
        >
          {!isPaid && (
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
          Export CSV
          {!isPaid && <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">PRO</span>}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4.5 19.5h15a2.25 2.25 0 000-4.5H4.5a2.25 2.25 0 000 4.5z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-700">No expenses recorded</p>
            <p className="text-sm text-gray-400 mt-1">
              Log your software tools, internet bills, and professional costs for ITR deductions
            </p>
          </div>
          <Button 
            variant="primary"
            onClick={() => {
              if (onEdit) onEdit(null); 
            }}
          >
            + Log First Expense
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedExpenses).map(([month, group]) => (
            <div key={month} className="space-y-3">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-bold text-gray-700">{month}</h3>
                <span className="text-sm font-semibold text-gray-500">Total: {formatINR(group.total)}</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Category</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Description</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.items.map(exp => (
                      <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600">{exp.date}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{exp.category}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">{formatINR(exp.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">{exp.description}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button onClick={() => onEdit(exp)} className="text-brand-500 hover:text-brand-700 text-sm">Edit</button>
                          <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
