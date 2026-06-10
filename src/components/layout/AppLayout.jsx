import React from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useLicense } from '../../hooks/useLicense';

const navItems = [
  {
    to: '/app/dashboard',
    label: 'Dashboard',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-500'}`} 
           fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    to: '/app/invoices',
    label: 'Invoices',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-500'}`}
           fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    to: '/app/clients',
    label: 'Clients',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-500'}`}
           fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    to: '/app/expenses',
    label: 'Expenses',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-500'}`}
           fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  {
    to: '/app/reports',
    label: 'Reports',
    isPro: true,
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-500'}`}
           fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    to: '/app/settings',
    label: 'Settings',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-500'}`}
           fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

export function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPaid } = useLicense();

  const isDetailPage = location.pathname.includes('/new') || 
                       location.pathname.match(/\/app\/invoices\/\d+/);
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/invoices/new')) return 'New Invoice';
    if (path.includes('/invoices')) return 'Invoices';
    if (path.includes('/clients')) return 'Clients';
    if (path.includes('/expenses')) return 'Expenses';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/settings')) return 'Settings';
    return 'InvoiceKit';
  };

  const getParentPath = () => {
    const path = location.pathname;
    if (path.includes('/invoices/new')) return '/app/invoices';
    if (path.match(/\/app\/invoices\/\d+/)) return '/app/invoices';
    return '/app/dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">InvoiceKit</span>
          </div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                 ${isActive 
                   ? 'bg-green-50 text-green-700' 
                   : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                  {item.isPro && !isPaid && (
                    <span className="ml-auto text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                      PRO
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        {!isPaid && (
          <div className="p-3 border-t border-gray-100">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-3.5 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" />
                </svg>
                <span className="text-xs font-semibold text-green-800">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-green-700 mb-3 leading-relaxed">
                Unlimited invoices, P&L reports, GST summary & more.
              </p>
              <NavLink 
                to="/upgrade"
                className="block w-full bg-green-600 text-white text-xs font-semibold text-center py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ₹999/year — Get Pro
              </NavLink>
            </div>
          </div>
        )}
        {isPaid && (
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2 px-2 py-2 bg-green-50 rounded-lg">
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-green-800">Pro Plan</p>
                <p className="text-[10px] text-green-600">All features unlocked</p>
              </div>
            </div>
          </div>
        )}
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3.5 flex items-center gap-3 flex-shrink-0">
          {isDetailPage && (
            <button
              onClick={() => navigate(getParentPath())}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors mr-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
          )}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-base font-semibold text-gray-800 flex-1">{getPageTitle()}</h1>
          <div id="header-actions" />
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex">
          {navItems.slice(0, 5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors relative
                 ${isActive ? 'text-green-600' : 'text-gray-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                  {item.isPro && !isPaid && (
                    <div className="absolute top-1.5 right-1/4 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="h-safe-bottom bg-white pb-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
