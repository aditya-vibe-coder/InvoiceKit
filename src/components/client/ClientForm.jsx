import React, { useState } from 'react';
import { db, saveClient } from '../../lib/db';
import { STATE_CODES } from '../../lib/gst';
import { validateGSTIN } from '../../utils/validators';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function ClientForm({ onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    stateCode: '27', // Default to Maharashtra
    address: '',
    email: '',
    phone: '',
    ...(initialData || {})
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Client name is required';
    if (!formData.stateCode) newErrors.stateCode = 'State code is required';
    
    if (formData.gstin) {
      const { isValid, error } = validateGSTIN(formData.gstin);
      if (!isValid) {
        newErrors.gstin = error;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const { success, error } = await saveClient(formData);
      if (success) {
        onSave();
      } else {
        alert('Failed to save client: ' + error);
      }
    } catch (err) {
      alert('An unexpected error occurred: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Client / Business Name" 
          name="name" 
          value={formData.name} 
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="e.g. Global Tech Solutions"
        />
         <Input 
           label="GSTIN" 
           name="gstin" 
           value={formData.gstin} 
           onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
           error={errors.gstin}
           placeholder="e.g. 27AAAAA0000A1Z5"
         />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">State</label>
          <select 
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-500 outline-none border-gray-300"
            value={formData.stateCode}
            onChange={e => setFormData({ ...formData, stateCode: e.target.value })}
          >
            {STATE_CODES.map(s => (
              <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
        <Input 
          label="Email" 
          name="email" 
          type="email"
          value={formData.email} 
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          placeholder="client@example.com"
        />
        <Input 
          label="Phone" 
          name="phone" 
          type="tel"
          value={formData.phone} 
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+91 98765 43210"
        />
        <Input 
          label="Address" 
          name="address" 
          value={formData.address} 
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          placeholder="Full billing address"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => setFormData({
          name: '',
          gstin: '',
          stateCode: '27',
          address: '',
          email: '',
          phone: '',
        })}>Clear</Button>
        <Button variant="primary" type="submit">Save Client</Button>
      </div>
    </form>
  );
}
