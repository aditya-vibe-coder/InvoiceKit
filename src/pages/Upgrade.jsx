import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLicense } from '../hooks/useLicense';
import PaymentButton from '../components/PaymentButton';

export default function Upgrade() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const { isPaid, planDetails } = useLicense();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/app/dashboard');
    }
  };

  if (isPaid) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">You're on Pro</h2>
        <p className="text-gray-500 text-sm mb-2">All features unlocked. Thank you for supporting InvoiceKit.</p>
        {planDetails?.expiresAt && (
          <p className="text-xs text-gray-400">Your plan renews on {new Date(planDetails.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-gray-500 
                     hover:text-gray-800 transition-colors group"
        >
          <svg 
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
          Back to app
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to InvoiceKit Pro</h1>
        <p className="text-gray-500 text-sm">Everything you need to run your freelance finances — properly.</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPlan === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan('annual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedPlan === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annual
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">SAVE 44%</span>
          </button>
        </div>
      </div>

      <div className="max-w-sm mx-auto bg-white rounded-2xl border-2 border-green-500 shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pro</h2>
            <p className="text-xs text-gray-500">For serious freelancers</p>
          </div>
          <div className="text-right">
            {selectedPlan === 'annual' ? (
              <>
                <p className="text-2xl font-bold text-gray-900">₹999<span className="text-base font-normal text-gray-500">/yr</span></p>
                <p className="text-xs text-gray-400 line-through">₹1,788/yr</p>
              </>
            ) : (
              <p className="text-2xl font-bold text-gray-900">₹149<span className="text-base font-normal text-gray-500">/mo</span></p>
            )}
          </div>
        </div>

        <div className="space-y-2.5 mb-6">
          {[
            { label: 'Unlimited invoices', sublabel: 'No monthly cap, ever' },
            { label: 'P&L statement', sublabel: 'Send directly to your CA' },
            { label: 'GST summary report', sublabel: 'GSTR-1 preparation data' },
            { label: 'Data backup & restore', sublabel: 'Your data, your device, always' },
            { label: 'Expense CSV export', sublabel: 'For ITR documentation' },
            { label: 'Priority support', sublabel: 'Response within 24 hours' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sublabel}</p>
              </div>
            </div>
          ))}
        </div>

         <PaymentButton 
           plan={selectedPlan} 
           onSuccess={() => {
             // The useLicense hook will detect the change in storage and re-render
           }}
           onError={(msg) => alert(`Payment Error: ${msg}`)}
         />
        
        <p className="text-center text-xs text-gray-400 mt-3">
          7-day refund if it doesn't work for you. No questions asked.
        </p>
        
        <button
          onClick={handleBack}
          className="block w-full text-center text-xs text-gray-400 
                     hover:text-gray-600 transition-colors mt-2 py-1"
        >
          Maybe later
        </button>
      </div>

      <div className="flex justify-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your data never leaves your device
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Paid via Razorpay (India)
        </span>
      </div>
    </div>
  );
}
