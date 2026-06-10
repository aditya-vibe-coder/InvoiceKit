import React from 'react';
import { Link } from 'react-router-dom';
import { useLicense } from '../../hooks/useLicense';

/**
 * Wraps a Pro feature. If not paid, renders an upgrade wall instead of the feature.
 * 
 * Props:
 * - feature: string — name of the locked feature (shown in the prompt)
 * - description: string — one sentence explaining what they'll get
 * - children: the actual Pro feature component
 * - inline: boolean — if true, renders a small inline lock badge instead of a full wall
 */
export function PaidGate({ feature, description, children, inline = false }) {
  const { isPaid } = useLicense();

  if (isPaid) return children;

  if (inline) {
    return (
      <Link to="/upgrade" className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Pro feature
      </Link>
    );
  }

  return (
    <div className="relative">
      {/* Blurred preview of the feature — renders children at 10% opacity with blur */}
      <div className="filter blur-sm opacity-10 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      
      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4 text-center">
          
          {/* Lock icon */}
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h3 className="text-base font-semibold text-gray-900 mb-1">{feature} is a Pro feature</h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">{description}</p>
          
          {/* What's included */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-left">
            <p className="text-xs font-semibold text-gray-700 mb-2">InvoiceKit Pro includes:</p>
            <ul className="space-y-1.5">
              {[
                'Unlimited invoices',
                'P&L report (for your CA)',
                'GST summary report',
                'Data backup & restore',
                'Expense CSV export',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <Link
            to="/upgrade"
            className="block w-full bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm"
          >
            Upgrade to Pro — ₹999/year
          </Link>
          <p className="text-xs text-gray-400 mt-2">Less than ₹84/month · 7-day refund guarantee</p>
        </div>
      </div>
    </div>
  );
}
