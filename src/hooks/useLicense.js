import { useState, useEffect } from 'react';
import { isPaidUser, planDetails, verifyLicenseOnline } from '../lib/license';

/**
 * Hook to manage and provide license state across the application.
 * Handles initial verification and provides a reactive state for "Paid" status.
 */
export function useLicense() {
  const [licenseState, setLicenseState] = useState({
    isPaid: isPaidUser(),
    plan: planDetails().plan,
    expiresAt: planDetails().expiresAt,
    loading: false
  });

  const refreshLicense = async (signal) => {
    setLicenseState(prev => ({ ...prev, loading: true }));
    try {
      const result = await verifyLicenseOnline();
      if (signal?.aborted) return;
      setLicenseState({
        isPaid: result.valid,
        plan: result.plan,
        expiresAt: result.expiresAt,
        loading: false
      });
    } catch (e) {
      if (signal?.aborted) return;
      console.error('License verification failed:', e);
      setLicenseState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    refreshLicense(controller.signal);
    return () => controller.abort();
  }, []);

  return {
    ...licenseState,
    refreshLicense
  };
}
