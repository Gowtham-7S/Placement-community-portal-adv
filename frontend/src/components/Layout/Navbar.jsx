import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          onClick={onToggleSidebar}
          title="Toggle Menu"
        >
          <span className="text-xl">☰</span>
        </button>
        <span className="text-2xl">📊</span>
        <span className="text-lg font-bold text-primary">Placement Portal</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <div className="text-sm font-semibold text-slate-900">
            {user?.first_name} {user?.last_name}
          </div>
          <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
