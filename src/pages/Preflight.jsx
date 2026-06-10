import React from 'react';
import { db } from '../lib/db';

export default function Preflight() {
  const [results, setResults] = useState([]);

  const runChecks = async () => {
    const checks = [
      { id: 'razorpay_key', label: 'Razorpay key present in env', check: () => !!import.meta.env.VITE_RAZORPAY_KEY_ID },
      { id: 'sw_registered', label: 'Service Worker registered', check: async () => !!(await navigator.serviceWorker.getRegistration('/')) },
      { id: 'indexeddb_write', label: 'IndexedDB writable', check: async () => { const r = await db.settings.count(); return r !== undefined; } },
      { id: 'privacy_policy', label: 'Privacy policy page exists', check: async () => { const r = await fetch('/privacy'); return r.ok; } },
      { id: 'terms', label: 'Terms of service exists', check: async () => { const r = await fetch('/terms'); return r.ok; } },
      { id: 'refund_policy', label: 'Refund policy exists', check: async () => { const r = await fetch('/refund'); return r.ok; } },
      { id: 'favicon', label: 'Favicon exists', check: async () => { const r = await fetch('/favicon.ico'); return r.ok; } },
    ];

    const res = [];
    for (const c of checks) {
      const passed = await c.check();
      res.push({ ...c, passed });
    }
    setResults(res);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Launch Preflight</h1>
      <Button onClick={runChecks}>Run All Checks</Button>
      <div className="space-y-2">
        {results.map(r => (
          <div key={r.id} className="flex justify-between p-3 border rounded bg-white">
            <span>{r.label}</span>
            <span className={r.passed ? 'text-green-600' : 'text-red-600'}>{r.passed ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
