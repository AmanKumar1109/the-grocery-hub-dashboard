import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  MessageSquareWarning,
  Ticket,
  FileText,
  LogOut,
  Settings,
  Image,
  Star
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { orders, items, staff, complaints = [] } = useAdmin();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const currentOrdersCount = orders.filter(o => o.isCurrent).length;
  const pendingComplaintsCount = complaints.filter(c => c.status === 'pending' || !c.status).length;

  const navSections = [
    {
      title: 'NAVIGATION',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard
        }
      ]
    },
    {
      title: 'GROCERY CATALOG',
      items: [
        {
          name: 'Grocery Products',
          path: '/dashboard/items',
          icon: Package,
          badge: items.length
        },
        {
          name: 'Add New Product',
          path: '/dashboard/items/add',
          icon: PlusCircle
        }
      ]
    },
    {
      title: 'ORDER MANAGEMENT',
      items: [
        {
          name: 'Current Orders',
          path: '/dashboard/orders/current',
          icon: ShoppingBag,
          badge: currentOrdersCount,
          badgeColor: 'bg-emerald-100 text-emerald-700 font-bold'
        },
        {
          name: 'Order History',
          path: '/dashboard/orders/history',
          icon: History
        }
      ]
    },
    {
      title: 'CUSTOMER SUPPORT',
      items: [
        {
          name: 'Complaints & Help',
          path: '/dashboard/complaints',
          icon: MessageSquareWarning,
          badge: pendingComplaintsCount > 0 ? pendingComplaintsCount : undefined,
          badgeColor: 'bg-amber-500 text-white font-bold animate-pulse'
        }
      ]
    },
    {
      title: 'CUSTOMER DATA',
      items: [
        {
          name: 'All Users / Customers',
          path: '/dashboard/users',
          icon: Users,
          badge: undefined
        }
      ]
    },
    {
      title: 'MARKETING & CRM',
      items: [
        {
          name: 'Discount Coupons',
          path: '/dashboard/coupons',
          icon: Ticket
        },
        {
          name: 'Customer Reviews',
          path: '/dashboard/reviews',
          icon: Star
        }
      ]
    },
    {
      title: 'APP CUSTOMIZATION',
      items: [
        {
          name: 'Store Settings',
          path: '/dashboard/store-settings',
          icon: Settings
        }
      ]
    },
    {
      title: 'CONTENT MANAGEMENT',
      items: [
        {
          name: 'Privacy Policy',
          path: '/dashboard/privacy-policy',
          icon: FileText
        },
        {
          name: 'Terms and Conditions',
          path: '/dashboard/terms-of-service',
          icon: FileText
        },
        {
          name: 'Refund Policy',
          path: '/dashboard/refund-policy',
          icon: FileText
        },
        {
          name: 'Cancellation Policy',
          path: '/dashboard/cancellation-policy',
          icon: FileText
        },
        {
          name: 'Disclaimer',
          path: '/dashboard/disclaimer',
          icon: FileText
        },
        {
          name: 'Shipping & Delivery',
          path: '/dashboard/shipping-policy',
          icon: FileText
        },
        {
          name: 'About Us',
          path: '/dashboard/about-us',
          icon: FileText
        }
      ]
    },
    {
      title: 'STAFF & LOGISTICS',
      items: [
        {
          name: 'Delivery Persons',
          path: '/dashboard/staff',
          icon: Users,
          badge: staff.length
        },
        {
          name: 'Add Delivery Person',
          path: '/dashboard/staff/add',
          icon: UserPlus
        }
      ]
    },
    {
      title: 'SYSTEM & LOGS',
      items: [
        {
          name: 'Audit Logs',
          path: '/dashboard/audit-logs',
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
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              A
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">Admin</p>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Super Admin
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
