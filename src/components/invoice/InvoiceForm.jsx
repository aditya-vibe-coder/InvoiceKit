import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { db, getSettings, getClients, saveInvoice, saveSettings } from '../../lib/db';
import { calculateInvoiceTotals, formatINR, STATE_CODES, getStateName } from '../../lib/gst';
import { isPaidUser, getTotalInvoiceCount } from '../../lib/license';
import { STORAGE_KEYS } from '../../lib/constants';
import { useLicense } from '../../hooks/useLicense';
import { useToast } from '../../components/ui/Toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const TAX_RATES = [0, 5, 12, 18, 28];

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-100 p-6 rounded-xl h-48" />
      <div className="bg-gray-100 rounded-xl h-64" />
    </div>
  );
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPaid } = useLicense();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [hsnSuggestions, setHsnSuggestions] = useState([]);
  
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [invoiceCount, setInvoiceCount] = useState(null);
  const [documentType, setDocumentType] = useState('invoice');

  useEffect(() => {
    let cancelled = false;
    db.settings.toArray().then(rows => {
      if (!cancelled) {
        setSettings(rows[0] || null);
        setSettingsLoading(false);
      }
    });
    db.invoices.count().then(count => {
      if (!cancelled) setInvoiceCount(count);
    });
    return () => { cancelled = true; };
  }, []);

  const [formData, setFormData] = useState({
    clientId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceNumber: '',
    irn: '',
    qrCode: '',
    lineItems: [{ id: Date.now(), description: '', hsn: '', qty: 1, rate: 0, gstRate: 18 }],
    notes: '',
    documentType: 'invoice',
  });

  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [hsnSearches, setHsnSearches] = useState({}); 
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      const { data: clientsData } = await getClients();
      if (cancelled) return;
      setClients(clientsData || []);

      try {
        const res = await fetch('/hsn-codes.json');
        const data = await res.json();
        if (!cancelled) setHsnSuggestions(data);
      } catch (e) {
        console.error('Failed to load HSN codes', e);
      }

      if (id) {
        const { data: invoice } = await db.invoices.get(parseInt(id));
        if (invoice && !cancelled) {
          const lineItems = await db.lineItems.where('invoiceId').equals(invoice.id).toArray();
          setFormData({
            ...invoice,
            lineItems: lineItems.length ? lineItems : [{ id: Date.now(), description: '', hsn: '', qty: 1, rate: 0, gstRate: 18 }],
          });
          setDocumentType(invoice.documentType || 'invoice');
        }
      } else {
        const savedDraft = sessionStorage.getItem(STORAGE_KEYS.INVOICE_DRAFT);
        if (savedDraft) {
          setFormData(JSON.parse(savedDraft));
        }
      }
    }
    loadInitialData();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) {
      sessionStorage.setItem(STORAGE_KEYS.INVOICE_DRAFT, JSON.stringify(formData));
    }
  }, [formData, id]);

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...formData.lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, lineItems: newItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { id: Date.now(), description: '', hsn: '', qty: 1, rate: 0, gstRate: 18 }]
    });
  };

  const removeLineItem = (index) => {
    if (formData.lineItems.length === 1) return;
    const newItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: newItems });
  };

  const currentTotals = useMemo(() => {
    if (!settings || !formData.clientId) return { subtotal: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0, grandTotal: 0 };
    
    const client = clients.find(c => c.id === parseInt(formData.clientId));
    if (!client) return { subtotal: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0, grandTotal: 0 };
    
    const parties = {
      supplierStateCode: settings.stateCode,
      recipientStateCode: client.stateCode,
    };
    
    const paiseItems = formData.lineItems.map(item => ({
      ...item,
      qty: parseFloat(item.qty || 0),
      rate: Math.round(parseFloat(item.rate || 0) * 100)
    }));
    
    return calculateInvoiceTotals(paiseItems, parties);
  }, [formData, settings, clients]);

  const validate = () => {
    const newErrors = {};
    if (!formData.clientId) newErrors.clientId = 'Please select a client';
    if (!formData.invoiceDate) newErrors.invoiceDate = 'Invoice date is required';
    
    formData.lineItems.forEach((item, idx) => {
      if (!item.description) newErrors[`item_${idx}_desc`] = 'Description required';
      if (!item.qty || item.qty <= 0) newErrors[`item_${idx}_qty`] = 'Invalid quantity';
      if (!item.rate || item.rate < 0) newErrors[`item_${idx}_rate`] = 'Invalid rate';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (!id) {
        const count = await getTotalInvoiceCount();
        if (!isPaid && count >= 10 && documentType === 'invoice') {
          setShowUpgradeModal(true);
          setIsSaving(false);
          return;
        }
      }

      const invoiceNumber = id ? (await db.invoices.get(parseInt(id))).invoiceNumber : `INV-${settings.nextInvoiceNumber}`;

      const invoiceData = {
        ...formData,
        clientId: parseInt(formData.clientId),
        invoiceNumber,
        total: currentTotals.grandTotal,
        status: 'Sent',
        financialYear: '2024-25',
        createdAt: Date.now(),
        documentType,
      };

      const paiseItems = formData.lineItems.map(item => ({
        ...item,
        rate: Math.round(parseFloat(item.rate || 0) * 100)
      }));

      const { success } = await saveInvoice(invoiceData, paiseItems);
      if (success) {
        if (!id && documentType === 'invoice') {
          sessionStorage.removeItem(STORAGE_KEYS.INVOICE_DRAFT);
        }
        addToast({ message: 'Invoice saved successfully', type: 'success' });
        navigate('/app/invoices');
      }
    } catch (e) {
      alert('Error saving invoice: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.gstin.toLowerCase().includes(clientSearch.toLowerCase())
  );

  if (settingsLoading) return <PageSkeleton />;

  if (!settings || !settings.businessName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl">⚙️</div>
        <h2 className="text-xl font-semibold text-gray-800">Set up your business first</h2>
        <p className="text-gray-500 text-center max-w-sm">
          Before creating invoices, add your business name and GSTIN in Business Settings.
        </p>
        <Link 
          to="/app/settings" 
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  if (!isPaid && invoiceCount !== null && invoiceCount >= 10 && !id && documentType === 'invoice') {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">You've used all 10 free invoices</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Your existing invoices are always accessible. Upgrade to Pro to create unlimited invoices — 
          that's ₹83/month for something your CA will thank you for.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-gray-700 mb-3">What you get with Pro:</p>
          {['Unlimited invoices — no monthly cap', 'P&L report for ITR filing', 'GST summary report', 'Data backup & restore'].map(item => (
            <div key={item} className="flex items-center gap-2 py-1">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-600">{item}</span>
            </div>
          ))}
        </div>
        <Link to="/upgrade" className="block w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors">
          Upgrade to Pro — ₹999/year
        </Link>
        <p className="text-xs text-gray-400 mt-2">7-day refund if it doesn't work for you.</p>
      </div>
    );
  }

    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {console.log('InvoiceForm Render', { formData, currentTotals })}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Invoice' : 'New Invoice'}</h1>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/app/invoices')}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Invoice'}
            </Button>
          </div>
        </div>


      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {[
          { value: 'invoice',   label: 'Tax Invoice',       sublabel: 'GST applies' },
          { value: 'proforma',  label: 'Proforma / Quote',  sublabel: 'No GST liability' },
          { value: 'credit_note', label: 'Credit Note',     sublabel: 'Refund/Adjustment' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setDocumentType(opt.value)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors text-left
              ${documentType === opt.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div>{opt.label}</div>
            <div className="text-xs font-normal text-gray-400">{opt.sublabel}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div className="relative">
            <Input 
              label="Client" 
              value={clientSearch || (clients.find(c => c.id === parseInt(formData.clientId))?.name || '')}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setIsClientDropdownOpen(true);
              }}
              onFocus={() => setIsClientDropdownOpen(true)}
              error={errors.clientId}
              placeholder="Search client name or GSTIN..."
            />
            {isClientDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.length > 0 ? filteredClients.map(c => (
                  <div 
                    key={c.id} 
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, clientId: c.id.toString() }));
                      setClientSearch(c.name);
                      setIsClientDropdownOpen(false);
                    }}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-gray-500 text-xs">{c.gstin} ({c.stateCode})</span>
                  </div>
                )) : <div className="px-3 py-2 text-gray-500 text-sm">No clients found</div>}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Invoice Date" 
              type="date" 
              value={formData.invoiceDate} 
              onChange={e => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
              error={errors.invoiceDate}
            />
            <Input 
              label="Due Date" 
              type="date" 
              value={formData.dueDate} 
              onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
        </div>
         <div className="space-y-4">
           <Input 
             label="Invoice Number" 
             value={formData.invoiceNumber} 
             onChange={e => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
           />
           <Input 
             label="IRN (Invoice Reference Number)" 
             value={formData.irn} 
             onChange={e => setFormData(prev => ({ ...prev, irn: e.target.value }))}
             placeholder="64-character alphanumeric IRN"
           />
           <Input 
             label="E-Invoice QR Data" 
             value={formData.qrCode} 
             onChange={e => setFormData(prev => ({ ...prev, qrCode: e.target.value }))}
             placeholder="Paste official QR data string"
           />
         </div>

      </div>

       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse min-w-[800px]">
             <thead className="bg-gray-50 border-b border-gray-200">
               <tr>
                 <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Description</th>
                 <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-32">HSN</th>
                 <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-24">Qty</th>
                 <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-32">Rate</th>
                 <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-24">GST%</th>
                 <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-32 text-right">Amount</th>
                 <th className="px-4 py-3 w-10"></th>
               </tr>
             </thead>
             <tbody>
               {formData.lineItems.map((item, index) => (
                 <tr key={item.id} className="border-b border-gray-100 last:border-0">
                   <td className="px-4 py-2">
                     <Input 
                       value={item.description} 
                       onChange={e => handleLineItemChange(index, 'description', e.target.value)}
                       error={errors[`item_${index}_desc`]}
                       className="h-9"
                     />
                   </td>
                   <td className="px-4 py-2 relative">
                     <Input 
                       value={item.hsn} 
                       onChange={e => {
                         handleLineItemChange(index, 'hsn', e.target.value);
                         setHsnSearches(prev => ({ ...prev, [item.id]: e.target.value }));
                       }}
                       className="h-9"
                     />
                     {hsnSearches[item.id] && (
                       <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                         {hsnSuggestions
                           .filter(h => h.code.includes(hsnSearches[item.id]) || h.description.toLowerCase().includes(hsnSearches[item.id].toLowerCase()))
                           .slice(0, 5)
                           .map(h => (
                             <div 
                               key={h.code} 
                               className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs"
                               onClick={() => {
                                 handleLineItemChange(index, 'hsn', h.code);
                                 setHsnSearches(prev => ({ ...prev, [item.id]: h.code }));
                               }}
                             >
                               <span className="font-bold">{h.code}</span> - {h.description}
                             </div>
                           ))}
                       </div>
                     )}
                   </td>
                   <td className="px-4 py-2">
                     <Input 
                       type="text" 
                       inputMode="decimal" 
                       value={item.qty} 
                       onChange={e => handleLineItemChange(index, 'qty', e.target.value)}
                       error={errors[`item_${index}_qty`]}
                       className="h-9"
                     />
                   </td>
                   <td className="px-4 py-2">
                     <Input 
                       type="text" 
                       inputMode="decimal" 
                       value={item.rate} 
                       onChange={e => handleLineItemChange(index, 'rate', e.target.value)}
                       error={errors[`item_${index}_rate`]}
                       className="h-9"
                     />
                   </td>
                   <td className="px-4 py-2">
                     <select 
                       className="w-full h-9 px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                       value={item.gstRate} 
                       onChange={e => handleLineItemChange(index, 'gstRate', parseInt(e.target.value))}
                     >
                       {TAX_RATES.map(rate => <option key={rate} value={rate}>{rate}%</option>)}
                     </select>
                   </td>
                   <td className="px-4 py-2 text-right font-medium">
                     {formatINR(Math.round(parseFloat(item.qty || 0) * parseFloat(item.rate || 0) * 100) + Math.round((Math.round(parseFloat(item.qty || 0) * parseFloat(item.rate || 0) * 100) * (item.gstRate || 0)) / 100))}
                   </td>
                   <td className="px-4 py-2 text-center">
                     <Button variant="ghost" className="text-red-500 hover:text-red-700 p-1" onClick={() => removeLineItem(index)}>&times;</Button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
         <div className="p-4 border-t border-gray-200">
           <Button variant="outline" onClick={addLineItem} className="w-full md:w-auto">+ Add Line Item</Button>
         </div>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <Input 
            label="Notes" 
            value={formData.notes} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Terms and conditions..."
            className="h-24"
          />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatINR(currentTotals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">CGST</span>
            <span>{formatINR(currentTotals.totalCGST)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">SGST</span>
            <span>{formatINR(currentTotals.totalSGST)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IGST</span>
            <span>{formatINR(currentTotals.totalIGST)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
            <span>Grand Total</span>
            <span>{formatINR(currentTotals.grandTotal)}</span>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        title="Free Tier Limit Reached"
      >
        <div className="text-center space-y-4">
          <p className="text-gray-600">You have reached the limit of 10 invoices for the free tier.</p>
          <Button variant="primary" onClick={() => navigate('/upgrade')}>Upgrade to Paid Plan</Button>
        </div>
      </Modal>
    </div>
  );
}
