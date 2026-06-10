import React, { useState, useEffect } from 'react';
import Button from './ui/Button';

export default function PaymentButton({ plan, onSuccess = () => {}, onError = () => {} }) {
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Configurable — override via window.__INVOICEKIT_API_URL or env var
  const API_BASE_URL = (typeof window !== 'undefined' && window.__INVOICEKIT_API_URL)
    || import.meta.env.VITE_API_URL
    || 'https://api.YOUR_DOMAIN.com';
  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const handlePayment = async () => {
    if (!sdkLoaded) {
      alert('Payment SDK loading, please wait...');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/payment/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paise: plan === 'annual' ? 99900 : 14900,
          currency: 'INR',
          plan
        })
      });
      const { order_id, amount, currency } = await res.json();

      if (!order_id) throw new Error('Failed to create order');

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'InvoiceKit',
        description: `InvoiceKit Pro ${plan === 'annual' ? 'Annual' : 'Monthly'} Plan`,
        order_id: order_id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/payment/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: 'user@example.com', // In real app, get from user profile
                plan: plan
              })
            });
            const { licenseKey, error } = await verifyRes.json();
            if (error) throw new Error(error);

                    const { saveLicense } = await import('../lib/license');
            saveLicense({
              licenseKey,
              plan,
              verifiedAt: Date.now(),
            });

            onSuccess();
          } catch (e) {
            onError(e.message);
          }
        },
        prefill: {
          email: 'user@example.com',
        },
        theme: { color: '#22c55e' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      onError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={loading} 
      className="w-full"
    >
      {loading ? 'Processing...' : 'Pay Now'}
    </Button>
  );
}
