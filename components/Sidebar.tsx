import React from 'react';
import { useLeaveContext } from '../context/LeaveContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface SidebarProps {
  currentPage: string;
  setPage: (page: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, mobileOpen, setMobileOpen }) => {
  const { currentUser, logout, permissions } = useLeaveContext();
  const { t, language, setLanguage } = useLanguage();

  if (!currentUser) return null;

  const userPerms = permissions[currentUser.role];

  const navItems = [];
  if (userPerms.VIEW_DASHBOARD) navItems.push({ id: 'dashboard', label: t('menu.dashboard'), icon: '📊' });
  if (userPerms.VIEW_CALENDAR) navItems.push({ id: 'calendar', label: t('menu.calendar'), icon: '📅' });
  if (userPerms.REQUEST_LEAVE) navItems.push({ id: 'myleave', label: t('menu.myleave'), icon: '📝' });
  if (userPerms.APPROVE_LEAVE) navItems.push({ id: 'approvals', label: t('menu.approvals'), icon: '✅' });
  if (userPerms.VIEW_REPORTS) navItems.push({ id: 'reports', label: t('menu.reports'), icon: '📑' });
  if (userPerms.MANAGE_SETTINGS) navItems.push({ id: 'settings', label: t('menu.settings'), icon: '⚙️' });

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-72 bg-slate-950 text-slate-300 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        border-r border-slate-800/50 shadow-2xl
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-xl">Z</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">ZenHR</h1>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Platform</p>
            </div>
          </div>
          <button 
            onClick={() => setLanguage(language === 'TH' ? 'EN' : 'TH')}
            className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl border border-slate-800 hover:bg-slate-800 transition-all group"
          >
            <span className="text-xs font-black text-slate-400 group-hover:text-white transition-colors">{language}</span>
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-1.5 overflow-y-auto h-[calc(100vh-220px)] custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group
                ${currentPage === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'}
              `}
            >
              <span className="text-xl opacity-80 group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {currentPage === item.id && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center space-x-4 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/50 mb-4">
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20 shadow-lg" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate uppercase">{currentUser.department}</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-3 bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 py-4 rounded-2xl text-xs font-black transition-all border border-slate-800/50 uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span>{t('login.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;