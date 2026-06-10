import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceForm from './components/invoice/InvoiceForm';
import Expenses from './pages/Expenses';
import Clients from './pages/Clients';
import Reports from './pages/Reports';
import Upgrade from './pages/Upgrade';
import Settings from './pages/Settings';
import OnboardingWizard from './pages/OnboardingWizard';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import Preflight from './pages/Preflight';
import LandingPage from './pages/LandingPage';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingWizard />} />
        
        <Route path="/app" element={<AppLayout><Outlet /></AppLayout>}>
          <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="invoices" element={<ErrorBoundary><Invoices /></ErrorBoundary>} />
          <Route path="invoices/new" element={<ErrorBoundary><InvoiceForm /></ErrorBoundary>} />
          <Route path="invoices/edit/:id" element={<ErrorBoundary><InvoiceForm /></ErrorBoundary>} />
          <Route path="clients" element={<ErrorBoundary><Clients /></ErrorBoundary>} />
          <Route path="expenses" element={<ErrorBoundary><Expenses /></ErrorBoundary>} />
          <Route path="reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        </Route>
        
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund" element={<Refund />} />
        {import.meta.env.DEV && <Route path="/admin/preflight" element={<Preflight />} />}
        <Route path="*" element={<div>404 Page - <a href="/">Go Home</a></div>} />
      </Routes>
    </Router>
  );
}

export default App;
