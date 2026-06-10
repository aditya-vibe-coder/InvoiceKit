import React, { useState } from 'react';
import ExpenseList from '../components/expense/ExpenseList';
import ExpenseForm from '../components/expense/ExpenseForm';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingExpense(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <Button variant="primary" onClick={() => { setEditingExpense(null); setShowForm(true); }}>
          + Log Expense
        </Button>
      </div>
      
      <ExpenseList key={refreshKey} onEdit={handleEdit} />

      <Modal 
        isOpen={showForm} 
        onClose={() => { setShowForm(false); setEditingExpense(null); }} 
        title={editingExpense ? 'Edit Expense' : 'Log New Expense'}
      >
        <ExpenseForm 
          initialData={editingExpense} 
          onSave={handleSave} 
        />
      </Modal>
    </div>
  );
}
