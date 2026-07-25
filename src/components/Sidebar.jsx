import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  History,
  Users,
  UserPlus,
  ClipboardList,
  ShieldCheck,
  Package,
  LogOut
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders, items, staff } = useAdmin();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const currentOrdersCount = orders.filter(o => o.isCurrent).length;

  const navSections = [
    {
      title: 'NAVIGATION',
      items: [
        {
          name: 'Dashboard',
          path: '/',
          icon: LayoutDashboard
        }
      ]
    },
    {
      title: 'GROCERY CATALOG',
      items: [
        {
          name: 'Grocery Products',
          path: '/items',
          icon: Package,
          badge: items.length
        },
        {
          name: 'Add New Product',
          path: '/items/add',
          icon: PlusCircle
        }
      ]
    },
    {
      title: 'ORDER MANAGEMENT',
      items: [
        {
          name: 'Current Orders',
          path: '/orders/current',
          icon: ShoppingBag,
          badge: currentOrdersCount,
          badgeColor: 'bg-emerald-100 text-emerald-700 font-bold'
        },
        {
          name: 'Order History',
          path: '/orders/history',
          icon: History
        }
      ]
    },
    {
      title: 'STAFF & LOGISTICS',
      items: [
        {
          name: 'Delivery Personnel',
          path: '/staff',
          icon: Users,
          badge: staff.length
        },
        {
          name: 'Add Delivery Person',
          path: '/staff/add',
          icon: UserPlus
        }
      ]
    },
    {
      title: 'SYSTEM & LOGS',
      items: [
        {
          name: 'Audit Logs',
          path: '/audit-logs',
          icon: ClipboardList
        }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white h-screen border-r border-slate-200 flex flex-col sticky top-0 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-800 tracking-tight text-base leading-tight">
            Grocery<span className="text-emerald-600">Hub</span>
          </h1>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Admin Panel</span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-thin">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                      <span>{item.name}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.badgeColor || (isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Admin Status Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              {currentUser?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.email || 'Admin'}</p>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Super Admin
            </p>
          </div>
        </div>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
