import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sparkles, RefreshCw, LogOut } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';

export default function Header({ title, subtitle }) {
  const { auditLogs } = useAdmin();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search orders, items..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Live System Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Live Operations</span>
        </div>

        {/* Action / Notification Icon */}
        <div className="relative">
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
          </button>
        </div>

        {/* Add Quick Action */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Admin Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-extrabold rounded-xl transition-all shadow-2xs cursor-pointer"
          title="Logout from Admin Panel"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
