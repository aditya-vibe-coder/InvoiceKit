import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  beforeSend(event) {
    if (event.extra) delete event.extra;
    if (event.user) delete event.user;
    if (event.breadcrumbs) {
      event.breadcrumbs.values = event.breadcrumbs.values?.filter(b => 
        !b.message?.includes('license') && !b.message?.includes('invoice')
      ) || [];
    }
    return event;
  },
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
