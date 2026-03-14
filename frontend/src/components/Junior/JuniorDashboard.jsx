import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BusinessCenter as BusinessCenterIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Campaign as CampaignIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import CompanyBrowser from './CompanyBrowser';
import JuniorDrives from './JuniorDrives';

const NAV_ITEMS = [
  { id: 'companies', icon: <BusinessCenterIcon fontSize="small" />, label: 'Browse Companies' },
  { id: 'drives', icon: <CampaignIcon fontSize="small" />, label: 'Drives' },
];

const PAGE_TITLES = {
  companies: 'Browse Companies',
  drives: 'Placement Drives',
};

const JuniorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('companies');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'companies': return <CompanyBrowser />;
      case 'drives': return <JuniorDrives />;
      default: return <CompanyBrowser />;
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'JR';

  return (
    <div className="min-h-screen font-sans bg-[#eef2f8]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 h-screen w-64 bg-white text-slate-700 flex flex-col z-40 shadow-2xl transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-200">
          <div className="w-9 h-9 bg-gradient-to-br from-[#6d5dfc] to-[#8a7dff] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            JR
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900">PlaceIQ</span>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Junior Portal</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto md:hidden text-slate-400 hover:text-slate-700"
            aria-label="Close menu"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(({ id, icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative
                  ${isActive
                    ? 'bg-[#ede9fe] text-[#4f46e5] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#6d5dfc] rounded-r-full" />
                )}
                <span className={`${isActive ? 'text-[#6d5dfc]' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
                  {icon}
                </span>
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-semibold transition-all duration-150"
          >
            <LogoutIcon fontSize="small" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-col min-h-screen md:ml-64">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Open menu"
            >
              <MenuIcon fontSize="small" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {PAGE_TITLES[activeTab]}
            </h2>
          </div>
          <p className="hidden sm:block text-xs text-slate-400">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <NotificationsIcon fontSize="small" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name || 'Junior'}</p>
                <p className="text-[11px] text-slate-400 capitalize">{user?.role || 'junior'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#8a7dff] flex items-center justify-center text-xs font-bold text-white shadow">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default JuniorDashboard;
