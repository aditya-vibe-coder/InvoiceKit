import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';

// ── Icon Components ──────────────────────────────────────────────

function IconLightning() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Feature Card ─────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <IconLightning />,
    title: 'Automatic GST Calculation',
    desc: 'No more manual math. We automatically calculate CGST, SGST, and IGST based on your and your client\'s state codes.',
    accent: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: <IconLock />,
    title: 'Privacy First',
    desc: 'Your data never leaves your device. All invoices, clients, and financial records are stored in your browser\'s IndexedDB — completely offline.',
    accent: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: <IconChart />,
    title: 'GSTR-1 Reports',
    desc: 'Generate GSTR-1 summary reports and P&L statements in one click. Export everything for your CA directly.',
    accent: 'bg-amber-100 text-amber-600',
  },
  {
    icon: <IconUsers />,
    title: 'Client Management',
    desc: 'Keep all your client details organized — names, GSTINs, addresses, and state codes. Reuse them across invoices with one click.',
    accent: 'bg-sky-100 text-sky-600',
  },
  {
    icon: <IconWallet />,
    title: 'Expense Tracking',
    desc: 'Track business expenses alongside your invoices. Get a complete picture of your profitability with categorized expense entries.',
    accent: 'bg-rose-100 text-rose-600',
  },
  {
    icon: <IconDownload />,
    title: 'PDF Export & Share',
    desc: 'Download professional GST-compliant PDFs instantly. Share invoices via WhatsApp or email directly from the app.',
    accent: 'bg-violet-100 text-violet-600',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Freelance Graphic Designer',
    quote: 'InvoiceKit has been a game-changer for my freelancing business. I was spending hours creating invoices manually. Now it takes me under 2 minutes. The GST calculations are spot-on every time.',
    rating: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'Freelance Web Developer',
    quote: 'The fact that my data never leaves my device is exactly what I needed. I tried other invoicing tools but couldn\'t trust them with my client list. InvoiceKit is privacy-first and works offline!',
    rating: 5,
  },
  {
    name: 'Ananya Patel',
    role: 'Content Writer & Strategist',
    quote: 'The GSTR-1 reports alone are worth it. My CA used to charge me extra to compile my invoice data for filing. Now I just export the report and send it over. Massive time and money saver.',
    rating: 4,
  },
];

const FAQS = [
  {
    q: 'Is InvoiceKit Pro really free?',
    a: 'Yes. InvoiceKit Pro is free for up to 10 invoices with full GST features including CGST, SGST, IGST, and PDF export. The Pro plan unlocks unlimited invoices, GSTR-1 reports, and P&L statements.',
  },
  {
    q: 'Is my financial data safe?',
    a: 'Your data never leaves your device. InvoiceKit stores all invoices and business data in your browser\'s IndexedDB using Dexie.js. The server has zero access to your financial records. No cloud sync, no data mining, no privacy concerns.',
  },
  {
    q: 'Does it support HSN and SAC codes?',
    a: 'Yes. You can add HSN (Harmonized System of Nomenclature) codes and SAC (Service Accounting Codes) to every line item. We include a built-in HSN code database for quick lookup.',
  },
  {
    q: 'How does GST calculation work?',
    a: 'Based on your business state code and your client\'s state code, InvoiceKit automatically determines whether to apply CGST+SGST (intra-state) or IGST (inter-state). All standard Indian GST rates (0%, 5%, 12%, 18%, 28%) are supported.',
  },
  {
    q: 'Can I use it offline?',
    a: 'Absolutely. Since all data is stored locally on your device, InvoiceKit works fully offline once loaded. You can create invoices, manage clients, and track expenses without an internet connection.',
  },
  {
    q: 'How do I upgrade to Pro?',
    a: 'Click the "Upgrade to Pro" button on the pricing section or visit the Upgrade page from the app. You can pay via Razorpay using UPI, credit/debit card, net banking, or wallets. The annual plan is ₹999/year.',
  },
];

// ── Animated Counter ─────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const duration = 1500;
          const steps = 30;
          const increment = target / steps;
          let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current));
          }
        }, duration / steps);
        return () => clearInterval(timer);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString('en-IN')}{suffix}
    </span>
  );
}

// ── ScrollReveal wrapper ─────────────────────────────────────────

function ScrollReveal({ children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Dashboard Mockup SVG ─────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Browser chrome frame */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="ml-4 flex-1 max-w-md bg-white rounded-full px-4 py-1.5 text-xs text-gray-400 border border-gray-200 text-center">
            invoicekit.harmnix.com/app/dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-green-50 via-white to-emerald-50">
          {/* Header row */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Dashboard</h3>
              <p className="text-sm text-gray-500">Welcome back! Here&apos;s your overview.</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg shadow-sm">
                + New Invoice
              </div>
              <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm">
                IK
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Revenue</p>
              <p className="text-xl font-bold text-gray-900 mt-1">₹2,48,500</p>
              <p className="text-xs text-green-600 mt-1">+12.5% vs last month</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Invoices</p>
              <p className="text-xl font-bold text-gray-900 mt-1">42</p>
              <p className="text-xs text-green-600 mt-1">8 this month</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pending</p>
              <p className="text-xl font-bold text-amber-600 mt-1">₹42,300</p>
              <p className="text-xs text-gray-500 mt-1">3 unpaid invoices</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Expenses</p>
              <p className="text-xl font-bold text-gray-900 mt-1">₹38,200</p>
              <p className="text-xs text-green-600 mt-1">Within budget</p>
            </div>
          </div>

          {/* Bottom row: chart + recent invoices */}
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Mini bar chart */}
            <div className="sm:col-span-2 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-3">Revenue Trend</p>
              <div className="flex items-end gap-2 h-28">
                {[40, 55, 45, 70, 60, 85, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-green-400 to-green-300 rounded-t-md transition-all hover:from-green-500"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-gray-400">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent invoices mini-list */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-3">Recent Invoices</p>
              <div className="space-y-3">
                {[
                  { client: 'TechCorp', amount: '₹24,500', status: 'Paid' },
                  { client: 'DesignStudio', amount: '₹12,000', status: 'Pending' },
                  { client: 'Webify', amount: '₹31,200', status: 'Paid' },
                ].map((inv, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{inv.client}</p>
                      <p className="text-xs text-gray-400">{inv.amount}</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        inv.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -right-4 bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        100% Local & Private
      </div>
    </div>
  );
}

// ── Main Landing Page Component ──────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = useCallback((id) => (e) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Helmet>
        <title>InvoiceKit Pro — Free GST Invoice Generator for Indian Freelancers</title>
        <meta name="description" content="Create GST-compliant invoices in seconds. Privacy-first invoicing for Indian freelancers. CGST, SGST, IGST auto-calculated. GSTR-1 reports. Your data never leaves your device." />
        <link rel="canonical" href="https://invoicekit.harmnix.com/" />
        <meta property="og:url" content="https://invoicekit.harmnix.com/" />
        <meta property="og:title" content="InvoiceKit Pro — Free GST Invoice Generator" />
        <meta property="og:description" content="Privacy-first GST invoicing for Indian freelancers and small businesses. Free forever for basic use." />
        <meta property="og:image" content="https://invoicekit.harmnix.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="InvoiceKit Pro — Free GST Invoice Generator" />
        <meta name="twitter:description" content="Privacy-first GST invoicing for Indian freelancers. Data stays on your device." />
      </Helmet>

      {/* ── Sticky Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-gray-900">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span>InvoiceKit</span>
              <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Pro</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={scrollToSection(link.href.slice(1))}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/app/dashboard"
                className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Start Free
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={scrollToSection(link.href.slice(1))}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/app/dashboard"
                className="block px-3 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg text-center hover:bg-green-700 transition-colors mt-2"
                onClick={() => setMenuOpen(false)}
              >
                Start Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-24 sm:pt-36 sm:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-green-100/40 via-emerald-50/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-72 h-72 bg-indigo-100/30 rounded-full blur-3xl" />
          <div className="absolute top-60 left-0 w-72 h-72 bg-amber-100/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-green-700 mb-6">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Your data never leaves your device
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
              The Simple Way to Create{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                GST Invoices
              </span>{' '}
              for Indian Freelancers
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Stop wrestling with complex accounting software. Generate professional, GST-compliant invoices in seconds.
              Your financial data is stored locally on your device—never on our servers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/app/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl hover:shadow-green-200 text-center text-base sm:text-lg"
              >
                Start Invoicing Free
              </Link>
              <a
                href="#features"
                onClick={scrollToSection('features')}
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all text-center text-base sm:text-lg"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <ScrollReveal>
            <DashboardMockup />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <p className="text-3xl sm:text-4xl font-black">
                <AnimatedCounter target={10000} suffix="+" />
              </p>
              <p className="text-sm sm:text-base text-green-100 mt-1 font-medium">Invoices Generated</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black">
                <AnimatedCounter target={500} suffix="+" />
              </p>
              <p className="text-sm sm:text-base text-green-100 mt-1 font-medium">Active Freelancers</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black">
                <AnimatedCounter target={100} suffix="%" />
              </p>
              <p className="text-sm sm:text-base text-green-100 mt-1 font-medium">Local Data Privacy</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black">
                4.9<small className="text-lg align-top">★</small>
              </p>
              <p className="text-sm sm:text-base text-green-100 mt-1 font-medium">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
                Features
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything you need to get paid faster
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Built specifically for the Indian tax landscape, ensuring you are always compliant without the headache.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {FEATURES.map((feature, i) => (
              <ScrollReveal key={feature.title}>
                <div className="group p-6 sm:p-8 bg-white rounded-2xl border border-gray-200 hover:border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 ${feature.accent} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
                How It Works
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Get started in 3 simple steps
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                From zero to your first GST invoice in under 2 minutes.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Set Up Your Profile',
                desc: 'Add your business name, GSTIN, address, and bank details. This is a one-time setup — we save everything locally.',
                color: 'bg-green-100 text-green-600',
              },
              {
                step: '02',
                title: 'Create Your Invoice',
                desc: 'Select a client, add line items with HSN codes, and the GST is calculated automatically. Preview and tweak before exporting.',
                color: 'bg-indigo-100 text-indigo-600',
              },
              {
                step: '03',
                title: 'Share & Get Paid',
                desc: 'Download a professional PDF invoice or share via WhatsApp. Track which invoices are paid and which are pending — all in one place.',
                color: 'bg-amber-100 text-amber-600',
              },
            ].map((step, i) => (
              <ScrollReveal key={step.step}>
                <div className="text-center group">
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-black group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
                Testimonials
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Loved by freelancers across India
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={t.name}>
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <IconStar key={j} />
                    ))}
                    {Array.from({ length: 5 - t.rating }).map((_, j) => (
                      <svg key={`empty-${j}`} className="w-5 h-5 text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6 italic text-sm sm:text-base">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
                Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Start free. Upgrade when you outgrow it. No hidden fees, no surprises.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <ScrollReveal>
              <div className="p-8 bg-white border border-gray-200 rounded-3xl hover:shadow-lg transition-all duration-300">
                <h3 className="text-xl font-bold mb-2 text-gray-900">Free Plan</h3>
                <p className="text-4xl font-black mb-2 text-gray-900">
                  ₹0{' '}
                  <span className="text-lg font-normal text-gray-500">/forever</span>
                </p>
                <p className="text-sm text-gray-500 mb-8">Perfect for getting started</p>
                <ul className="space-y-4 mb-8">
                  {[
                    'Up to 10 Invoices',
                    'Full GST Support (CGST, SGST, IGST)',
                    'PDF Exports',
                    'Local Data Storage',
                    'Client Management',
                    'Expense Tracking',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                      <IconCheck />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/app/dashboard"
                  className="block w-full py-3 px-6 rounded-xl border-2 border-gray-200 font-semibold text-center text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Get Started Free
                </Link>
              </div>
            </ScrollReveal>

            {/* Pro Plan */}
            <ScrollReveal>
              <div className="p-8 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-3xl shadow-xl scale-105 hover:scale-110 transition-all duration-300 relative overflow-hidden">
                {/* Popular badge */}
                <div className="absolute top-6 right-0 bg-white/20 backdrop-blur-sm px-4 py-1 rounded-l-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
                <h3 className="text-xl font-bold mb-2">Pro Plan</h3>
                <p className="text-4xl font-black mb-2">
                  ₹999{' '}
                  <span className="text-lg font-normal opacity-80">/year</span>
                </p>
                <p className="text-sm text-green-100 mb-8">Save 44% vs monthly (₹149/mo)</p>
                <ul className="space-y-4 mb-8">
                  {[
                    'Unlimited Invoices',
                    'GSTR-1 Summary Reports',
                    'P&L Statements',
                    'Priority Support',
                    'Data Backup & Restore',
                    'Expense CSV Export',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm opacity-90">
                      <IconCheck />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/upgrade"
                  className="block w-full py-3 px-6 bg-white text-green-700 rounded-xl font-bold text-center hover:bg-gray-100 transition-all shadow-md"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={faq.q}>
                <FAQItem question={faq.q} answer={faq.a} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA Section ── */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to simplify your invoicing?
            </h2>
            <p className="text-lg text-green-100 mb-10 max-w-2xl mx-auto">
              Join hundreds of Indian freelancers who trust InvoiceKit for their GST invoicing.
              No credit card required — start free instantly.
            </p>
            <Link
              to="/app/dashboard"
              className="inline-block px-10 py-4 bg-white text-green-700 font-bold rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all shadow-xl text-lg"
            >
              Start Invoicing Free — It&apos;s ₹0
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 font-bold text-lg text-white mb-4">
                <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                InvoiceKit Pro
              </div>
              <p className="text-sm leading-relaxed">
                Privacy-first GST invoicing for Indian freelancers and small businesses. Built with ❤️ by Harmnix.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" onClick={scrollToSection('features')} className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" onClick={scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" onClick={scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link to="/upgrade" className="hover:text-white transition-colors">Upgrade</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-xs">
            <p>&copy; {new Date().getFullYear()} InvoiceKit Pro by Harmnix. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── FAQ Accordion Item ────────────────────────────────────────────

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 sm:py-5 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm sm:text-base font-semibold text-gray-900 pr-4">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-6 pb-4 sm:pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}
