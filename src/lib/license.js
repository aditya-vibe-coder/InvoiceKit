import { STORAGE_KEYS } from './constants';

const LICENSE_STORAGE_KEY = STORAGE_KEYS.LICENSE;

/**
 * Verify license with the backend worker.
 * Implements the 30-day caching strategy.
 * @returns {Promise<{ valid: boolean, plan: string, expiresAt: string|null, source: 'online'|'cache'|'none' }>}
 */
export async function verifyLicenseOnline() {
  const license = getLicenseFromStorage();
  if (!license || !license.licenseKey) {
    return { valid: false, plan: 'free', expiresAt: null, source: 'none' };
  }

  try {
    // Use the configurable worker URL (override via window.__INVOICEKIT_API_URL, or fall back to env/placeholder)
    const API_URL = (typeof window !== 'undefined' && window.__INVOICEKIT_API_URL) 
      || import.meta.env.VITE_API_URL 
      || 'https://api.YOUR_DOMAIN.com';
    const response = await fetch(`${API_URL}/license/verify?key=${license.licenseKey}`);
    const data = await response.json();

    if (data.valid) {
      saveLicense({
        ...license,
        plan: data.plan,
        expiresAt: data.expiresAt,
        verifiedAt: Date.now()
      });
      return { ...data, source: 'online' };
    } else {
      localStorage.removeItem(LICENSE_STORAGE_KEY);
      return { valid: false, plan: 'free', expiresAt: null, source: 'online' };
    }
  } catch (e) {
    if (license.verifiedAt && (Date.now() - license.verifiedAt < 30 * 24 * 60 * 60 * 1000)) {
      return { 
        valid: !isLicenseExpired(), 
        plan: license.plan, 
        expiresAt: license.expiresAt, 
        source: 'cache' 
      };
    }
    return { valid: false, plan: 'free', expiresAt: null, source: 'none' };
  }
}

export function getLicenseFromStorage() {
  try {
    const data = localStorage.getItem(LICENSE_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to parse license from storage:', e);
    return null;
  }
}

export function saveLicense(licenseData) {
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseData));
}

export function isPaidUser() {
  const license = getLicenseFromStorage();
  if (!license) return false;
  
  const isRecent = license.verifiedAt && (Date.now() - license.verifiedAt < 30 * 24 * 60 * 60 * 1000);
  if (!isRecent) return false;

  return !isLicenseExpired();
}

export function isLicenseExpired() {
  const license = getLicenseFromStorage();
  if (!license || !license.expiresAt) return false;
  return new Date(license.expiresAt).getTime() < Date.now();
}

export function planDetails() {
  const license = getLicenseFromStorage();
  if (!license) return { plan: 'free', expiresAt: null, daysRemaining: null, isExpired: false };
  
  const expiresAt = license.expiresAt ? new Date(license.expiresAt).getTime() : null;
  const isExpired = expiresAt && expiresAt < Date.now();
  
  let daysRemaining = null;
  if (expiresAt) {
    daysRemaining = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return {
    plan: license.plan || 'free',
    expiresAt: license.expiresAt,
    daysRemaining,
    isExpired
  };
}

export async function getTotalInvoiceCount() {
  const { db } = await import('./db');
  return await db.invoices.count();
}
