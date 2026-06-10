import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6 text-gray-700 leading-relaxed">
      <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p>Last updated: May 26, 2026</p>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Disclaimer</h2>
        <p>
          InvoiceKit is provided "as-is" without any warranties. While we strive for GST compliance, 
          the user is solely responsible for verifying the accuracy of their invoices and tax calculations.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Liability</h2>
        <p>
          InvoiceKit is not liable for any tax penalties, legal notices, or financial losses 
          resulting from the use of this software.
        </p>
      </section>
    </div>
  );
}
