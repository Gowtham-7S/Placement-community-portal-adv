import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = {
    admin: [
      { label: 'Dashboard', href: '/admin', icon: '📊' },
      { label: 'Companies', href: '/admin/companies', icon: '🏢' },
      { label: 'Drives', href: '/admin/drives', icon: '📢' },
      { label: 'Pending Approvals', href: '/admin/approvals', icon: '✅' },
      { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
    ],
    student: [
      { label: 'Dashboard', href: '/student', icon: '📊' },
      { label: 'Submit Experience', href: '/student/submit-experience', icon: '✍️' },
      { label: 'My Experiences', href: '/student/experiences', icon: '📝' },
    ],
    junior: [
      { label: 'Dashboard', href: '/junior', icon: '📊' },
      { label: 'Browse Companies', href: '/junior/companies', icon: '🔍' },
      { label: 'Preparation Roadmap', href: '/junior/roadmap', icon: '🎯' },
    ],
  };

  const items = navItems[user?.role] || [];

  return (
    <div className={`w-64 bg-white border-r border-slate-200 py-6 overflow-y-auto h-full fixed left-0 top-16 z-40 transform transition-transform duration-300 ease-in-out md:relative md:top-0 md:left-0 md:z-auto md:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${location.pathname === item.href ? 'bg-slate-50 text-primary border-primary' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'}`}
            onClick={onClose}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
