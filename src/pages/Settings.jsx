import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, exportData, importData } from '../lib/db';
import { STATE_CODES } from '../lib/gst';
import { validateGSTIN } from '../utils/validators';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { PaidGate } from '../components/ui/PaidGate';

export default function Settings() {
  const [settings, setSettings] = useState({
    businessName: '',
     gstin: '',
    stateCode: '',
    stateIndex: 0,
    address: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    upiId: '',
    invoicePrefix: 'INV-',
    nextInvoiceNumber: 1
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      const { data } = await getSettings();
      if (!cancelled) {
        if (data) {
          setSettings(data);
        }
        setLoading(false);
      }
    }
    loadSettings();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    if (settings.gstin) {
      const { isValid, error } = validateGSTIN(settings.gstin);
      if (!isValid) {
        setMessage({ type: 'error', text: 'Invalid GSTIN: ' + error });
        setSaving(false);
        return;
      }
    }

    const { success, error } = await saveSettings(settings);
    if (success) {
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to save settings: ' + error });
    }
    setSaving(false);
  };

  if (loading) return <div className="max-w-4xl mx-auto p-6 text-center">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business settings</h1>
        <p className="text-gray-500">Configure your business profile and GST details for your invoices.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Business profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Business Name" 
                name="businessName" 
                value={settings.businessName} 
                onChange={handleChange} 
                placeholder="e.g. Acme Services" 
              />
              <Input 
                label="GSTIN" 
                name="gstin" 
                value={settings.gstin} 
                onChange={handleChange} 
                placeholder="e.g. 27AAAAA0000A1Z5" 
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">State</label>
                <select
                  name="stateCode"
                  value={settings.stateCode || ''}
                  onChange={handleChange}
                  className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-500 outline-none border-gray-300"
                >
                  <option value="">Select your state</option>
                  {STATE_CODES.map(s => (
                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <Input 
                label="Address" 
                name="address" 
                value={settings.address} 
                onChange={handleChange} 
                placeholder="Full business address" 
              />
            </div>
          </section>

          <section className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Bank details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="Bank Name" 
                name="bankName" 
                value={settings.bankName} 
                onChange={handleChange} 
                placeholder="e.g. HDFC Bank" 
              />
              <Input 
                label="Account Number" 
                name="bankAccount" 
                value={settings.bankAccount} 
                onChange={handleChange} 
                placeholder="Account number" 
              />
               <Input 
                 label="IFSC Code" 
                 name="bankIfsc" 
                 value={settings.bankIfsc} 
                 onChange={handleChange} 
                 placeholder="IFSC Code" 
               />
               <Input 
                 label="UPI ID" 
                 name="upiId" 
                 value={settings.upiId} 
                 onChange={handleChange} 
                 placeholder="e.g. name@bank" 
               />
             </div>

          </section>

          <section className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Invoice configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Invoice Prefix" 
                name="invoicePrefix" 
                value={settings.invoicePrefix} 
                onChange={handleChange} 
                placeholder="e.g. INV-" 
              />
              <Input 
                label="Next Invoice Number" 
                name="nextInvoiceNumber" 
                type="number"
                value={settings.nextInvoiceNumber} 
                onChange={handleChange} 
              />
            </div>
          </section>

          <section className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Data management</h2>
            <PaidGate
              feature="Data backup & restore"
              description="Export all your data as a JSON file and restore it on any device."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    const { data } = await exportData();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `invoicekit-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  }}
                >
                  Export Backup
                </Button>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    id="import-file" 
                    className="hidden" 
                    accept=".json"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const text = await file.text();
                      try {
                        const json = JSON.parse(text);
                        const { success } = await importData(json);
                        if (success) alert('Data restored successfully!');
                      } catch (err) {
                        alert('Invalid backup file');
                      }
                    }}
                  />
                  <Button variant="outline" onClick={() => document.getElementById('import-file').click()}>
                    Restore Backup
                  </Button>
                </div>
              </div>
            </PaidGate>
          </section>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          {message && (
            <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
