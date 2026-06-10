import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSettings, saveClient } from '../lib/db';
import { STATE_CODES } from '../lib/gst';
import InvoiceForm from '../components/invoice/InvoiceForm';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState({
    businessName: '',
    gstin: '',
    stateCode: '',
    address: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    nextInvoiceNumber: 1,
  });
  const [errors, setErrors] = useState({});

  const validateGSTIN = (gstin) => {
    const regex = /^[0-9]{2}[A-Z0-9]{10}[0-9]{1}Z[A-Z0-9]{1}$/;
    return regex.test(gstin);
  };

  const validateIFSC = (ifsc) => {
    const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return regex.test(ifsc);
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const nextStep = () => {
    if (step === 1) {
      const newErrors = {};
      if (!settings.businessName) newErrors.businessName = 'Business name is required';
      if (!validateGSTIN(settings.gstin)) newErrors.gstin = 'Invalid GSTIN format';
      if (!settings.stateCode) newErrors.stateCode = 'State is required';
      if (!settings.address) newErrors.address = 'Address is required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    if (step === 2) {
      if (settings.bankIfsc && !validateIFSC(settings.bankIfsc)) {
        setErrors({ bankIfsc: 'Invalid IFSC format' });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleFinalSubmit = async () => {
    try {
      // Save settings
      await saveSettings(settings);
      
      // Create sample client for first invoice
      await saveClient({
        name: 'Sample Client',
        gstin: '00AAAAA0000A1Z2',
        stateCode: '00',
        address: 'Sample Address, City, State',
        createdAt: Date.now()
      });

      navigate('/app/dashboard');
    } catch (e) {
      alert('Error completing onboarding: ' + e.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Set up your account</h1>
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-2 rounded-full ${step >= s ? 'bg-brand-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Setup</h2>
            <Input 
              label="Business Name" 
              value={settings.businessName} 
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              error={errors.businessName}
              placeholder="e.g. Acme Services Pvt Ltd"
            />
            <Input 
              label="GSTIN" 
              value={settings.gstin} 
              onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
              error={errors.gstin}
              placeholder="e.g. 07AAAAA0000A1Z5"
            />
            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-medium text-gray-700">State</label>
              <select 
                className={`px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-500 outline-none transition-all ${errors.stateCode ? 'border-red-500' : 'border-gray-300'}`}
                value={settings.stateCode}
                onChange={(e) => handleInputChange('stateCode', e.target.value)}
              >
                <option value="">Select State</option>
                {STATE_CODES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
              {errors.stateCode && <span className="text-red-500 text-xs">{errors.stateCode}</span>}
            </div>
            <Input 
              label="Address" 
              value={settings.address} 
              onChange={(e) => handleInputChange('address', e.target.value)}
              error={errors.address}
              placeholder="Full business address"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Details <span className="text-gray-400 font-normal text-sm">(Optional)</span></h2>
            <Input 
              label="Bank Name" 
              value={settings.bankName} 
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              placeholder="e.g. HDFC Bank"
            />
            <Input 
              label="Account Number" 
              value={settings.bankAccount} 
              onChange={(e) => handleInputChange('bankAccount', e.target.value)}
              placeholder="Enter account number"
            />
            <Input 
              label="IFSC Code" 
              value={settings.bankIfsc} 
              onChange={(e) => handleInputChange('bankIfsc', e.target.value.toUpperCase())}
              error={errors.bankIfsc}
              placeholder="e.g. HDFC0001234"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Your First Invoice</h2>
            <p className="text-gray-600 text-sm mb-6">We've set up a sample client to help you get started. Try adding some items to your first invoice!</p>
            <div className="border rounded-xl p-2 bg-gray-50">
              <InvoiceForm />
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          {step < 3 ? (
            <Button variant="primary" onClick={nextStep} className="ml-auto">Continue</Button>
          ) : (
            <Button variant="primary" onClick={handleFinalSubmit} className="ml-auto">Finish Setup</Button>
          )}
        </div>
      </div>
    </div>
  );
}
