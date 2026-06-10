import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6 text-gray-700 leading-relaxed">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p>Last updated: May 26, 2026</p>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Data Storage</h2>
        <p>
          InvoiceKit is a privacy-first application. All your invoice data, client details, and expense records 
          are stored exclusively in your browser's local storage (IndexedDB). 
          <strong>We never transmit this data to any server.</strong>
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Payments</h2>
        <p>
          Payment information is processed by Razorpay (for India) or Paddle (for international users). 
          We do not store your credit card or payment details on our servers.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Analytics & Monitoring</h2>
        <p>
          We use Cloudflare Web Analytics for anonymous page view counting and Sentry for anonymous error reporting. 
          No personal or financial data is ever sent to these services.
        </p>
      </section>
    </div>
  );
}
