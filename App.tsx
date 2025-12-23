import React, { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { LeaveProvider, useLeaveContext } from './context/LeaveContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { CalendarPage } from './pages/CalendarPage.tsx';
import { MyLeaves } from './pages/MyLeaves.tsx';
import { Approvals } from './pages/Approvals.tsx';
import { Reports } from './pages/Reports.tsx';
import { Settings } from './pages/Settings.tsx';
import { Login } from './pages/Login.tsx';

const AppContent = () => {
  const { isAuthenticated } = useLeaveContext();
  const [currentPage, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <CalendarPage />;
      case 'myleave': return <MyLeaves />;
      case 'approvals': return <Approvals />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentPage={currentPage} 
        setPage={setPage} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
          <span className="font-bold text-blue-600">ZenHR</span>
          <button onClick={() => setMobileOpen(true)} className="text-slate-600 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <LeaveProvider>
        <AppContent />
      </LeaveProvider>
    </LanguageProvider>
  );
}

export default App;