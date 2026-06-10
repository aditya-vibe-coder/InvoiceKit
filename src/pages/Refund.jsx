import React from 'react';

export default function Refund() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6 text-gray-700 leading-relaxed">
      <h1 className="text-3xl font-bold text-gray-900">Refund Policy</h1>
      <p>Last updated: May 26, 2026</p>
      <section className="space-y-4">
        <p>
          We offer a 7-day full refund if InvoiceKit doesn't work on your device or if you are 
          unsatisfied with the Pro features.
        </p>
        <p>
          To request a refund, please email <strong>support@invoicekit.your-domain.com</strong> 
          with your payment ID and the email address used for the purchase.
        </p>
      </section>
    </div>
  );
}
