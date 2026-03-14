import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Campaign as CampaignIcon,
  Article as ArticleIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  VpnKey as VpnKeyIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import AdminAnalytics from './AdminAnalytics';
import AdminAnalyticsPage from './AdminAnalyticsPage';
import AdminExperienceManagement from './AdminExperienceManagement';
import CompanyManagement from './CompanyManagement';
import DriveManagement from './DriveManagement';
import PendingApprovals from './PendingApprovals';
import AdminExperienceAccess from './AdminExperienceAccess';



const PAGE_TITLES = {
  dashboard: 'Dashboard Overview',
  companies: 'Company Management',
  drives: 'Placement Drives',
  experiences: 'Experiences',
  approvals: 'Pending Approvals',
  analytics: 'Analytics',
  experience_access: 'Experience Access',
};

const NAV_ITEMS = [
  { id: 'dashboard', icon: <DashboardIcon fontSize="small" />, label: 'Dashboard' },
  { id: 'companies', icon: <BusinessIcon fontSize="small" />, label: 'Companies' },
  { id: 'drives', icon: <CampaignIcon fontSize="small" />, label: 'Drives' },
  { id: 'experiences', icon: <ArticleIcon fontSize="small" />, label: 'Experiences' },
  { id: 'approvals', icon: <CheckCircleIcon fontSize="small" />, label: 'Approvals' },
  { id: 'analytics', icon: <BarChartIcon fontSize="small" />, label: 'Analytics' },
  { id: 'experience_access', icon: <VpnKeyIcon fontSize="small" />, label: 'Experience Access' },
];

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminAnalytics />;
      case 'companies': return <CompanyManagement />;
      case 'drives': return <DriveManagement />;
      case 'experiences': return <AdminExperienceManagement />;
      case 'approvals': return <PendingApprovals />;
      case 'analytics': return <AdminAnalyticsPage />;
      case 'experience_access': return <AdminExperienceAccess />;
      default: return <AdminAnalytics />;
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div
      className="min-h-screen flex bg-[#eef2f8]"
      style={{ fontFamily: '"Manrope", "Inter", "Segoe UI", Roboto, Arial, sans-serif' }}
    >
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white text-slate-700 flex flex-col fixed left-0 top-0 z-40 transform transition-all duration-300 ease-in-out h-full ${
        sidebarOpen 
          ? 'w-64' 
          : 'w-16'
      } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className={`px-6 py-5 flex items-center gap-3 border-b border-slate-200 transition-all duration-300 ${
          sidebarOpen ? 'justify-start' : 'justify-center px-4'
        }`}>
          <div className={`bg-gradient-to-br from-[#6d5dfc] to-[#8a7dff] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300 ${
            sidebarOpen ? 'w-9 h-9' : 'w-8 h-8'
          }`}>
            {sidebarOpen ? '🎓' : '📊'}
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <span className="text-lg font-bold tracking-tight text-slate-900">PlaceIQ</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Admin Console</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  // Don't close sidebar on desktop when clicking nav items
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-150 group relative
                  ${isActive
                    ? 'bg-[#ede9fe] text-[#4f46e5]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  } ${sidebarOpen ? '' : 'justify-center px-2'}`}
                title={!sidebarOpen ? label : ''}
              >
                {isActive && sidebarOpen && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#6d5dfc] rounded-r-full" />
                )}
                <span className={`${isActive ? 'text-[#6d5dfc]' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
                  {icon}
                </span>
                {sidebarOpen && (
                  <span className="truncate">{label}</span>
                )}
                {id === 'approvals' && sidebarOpen && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">!</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer — Logout and Toggle */}
        <div className="p-4 border-t border-slate-200">
          <div className={`flex ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-all duration-150 flex-1 mr-2"
              >
                <LogoutIcon fontSize="small" />
                Sign Out
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-150 ${
                sidebarOpen ? '' : 'mx-auto'
              }`}
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {sidebarOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        sidebarOpen ? 'md:ml-64' : 'md:ml-16'
      }`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Menu"
            >
              {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {PAGE_TITLES[activeTab]}
              </h2>
              <p className="text-sm text-slate-400">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors relative">
              <NotificationsIcon fontSize="small" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-base font-semibold text-slate-800 leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role || 'admin'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#8a7dff] flex items-center justify-center text-xs font-bold text-white shadow">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;




