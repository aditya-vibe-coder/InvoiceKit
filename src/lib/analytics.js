export function trackEvent(name, properties = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    navigator.sendBeacon('/analytics/event', JSON.stringify({ 
      event: name, 
      plan: properties.plan || null,
      timestamp: Date.now()
    }));
  } catch(e) { 
    // Never crash the app for analytics 
  }
}
