import React, { useState } from 'react';
import { db, saveExpense } from '../../lib/db';
import Input from '../ui/Input';
import Button from '../ui/Button';

export const EXPENSE_CATEGORIES = [
  'Software & Tools',
  'Hardware & Equipment',
  'Internet & Communication',
  'Office Supplies',
  'Professional Development',
  'Travel & Transport',
  'Marketing & Advertising',
  'Professional Services (CA, Legal)',
  'Rent & Utilities',
  'Bank Charges',
  'Other'
];

export default function ExpenseForm({ onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    gstPaid: '',
    description: '',
    receiptRef: '',
    ...(initialData || {})
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const expenseData = {
        ...formData,
        amount: Math.round(parseFloat(formData.amount) * 100),
        gstPaid: formData.gstPaid ? Math.round(parseFloat(formData.gstPaid) * 100) : 0,
        financialYear: '2024-25', // Simplified, should use getFinancialYear helper
        createdAt: Date.now()
      };
      
       const { success } = await saveExpense(expenseData);
      if (success) {
        onSave();
      }
    } catch (err) {
      alert('Failed to save expense: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Date" 
          type="date" 
          value={formData.date} 
          onChange={e => setFormData({ ...formData, date: e.target.value })}
          error={errors.date}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select 
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-500 outline-none border-gray-300"
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
          >
            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <Input 
          label="Amount (₹)" 
          type="text" 
          inputMode="decimal" 
          value={formData.amount} 
          onChange={e => setFormData({ ...formData, amount: e.target.value })}
          error={errors.amount}
          placeholder="0.00"
        />
        <Input 
          label="GST Paid (₹)" 
          type="text" 
          inputMode="decimal" 
          value={formData.gstPaid} 
          onChange={e => setFormData({ ...formData, gstPaid: e.target.value })}
          placeholder="0.00"
        />
        <Input 
          label="Description" 
          value={formData.description} 
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="What was this for?"
        />
        <Input 
          label="Receipt Reference" 
          value={formData.receiptRef} 
          onChange={e => setFormData({ ...formData, receiptRef: e.target.value })}
          placeholder="Bill # or Transaction ID"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => setFormData({
          date: new Date().toISOString().split('T')[0],
          category: EXPENSE_CATEGORIES[0],
          amount: '',
          gstPaid: '',
          description: '',
          receiptRef: '',
        })}>Clear</Button>
        <Button variant="primary" type="submit">Save Expense</Button>
      </div>
    </form>
  );
}
