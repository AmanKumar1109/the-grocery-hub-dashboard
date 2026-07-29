import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  Search,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Clock,
  CreditCard,
  UserCheck,
  UserX,
  ChevronDown,
  ArrowUpDown,
  Package,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
  Bookmark,
  Heart,
  Loader2,
  Download,
  Tag,
  ShieldAlert,
  ShieldCheck,
  StickyNote,
  BarChart2,
  Save
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import gsap from 'gsap';

export default function UsersView() {
  const { users, orders, items, getUserSavedProducts, toggleUserBlockStatus, updateUserAdminNote } = useAdmin();
  const containerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedUser, setSelectedUser] = useState(null);
  const [savedProducts, setSavedProducts] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Build enriched user profiles by merging Firestore users + orders data
  const enrichedUsers = useMemo(() => {
    // Build a map of users from the 'users' collection
    const userMap = new Map();

    users.forEach(u => {
      const key = (u.phone || u.email || u.id).toLowerCase();
      userMap.set(key, {
        id: u.id,
        name: u.name || u.displayName || 'Unknown',
        email: u.email || '',
        phone: u.phone || u.phoneNumber || '',
        address: u.address || u.defaultAddress || '',
        createdAt: u.createdAt || u.registeredAt || u.joinedDate || '',
        profileImage: u.profileImage || u.photoURL || '',
        isBlocked: u.isBlocked || false,
        adminNote: u.adminNote || '',
        // Will be enriched from orders
        totalOrders: 0,
        totalSpent: 0,
        totalSavings: 0,
        lastOrderDate: '',
        lastOrderStatus: '',
        ordersList: [],
        isFromFirestore: true,
        // Saved products from user document fields
        savedFromDoc: u.savedProducts || u.wishlist || u.favorites || u.savedItems || []
      });
    });

    // Enrich from orders — also discover users who aren't in the users collection
    orders.forEach(order => {
      const phone = (order.customerPhone || '').toLowerCase();
      const name = order.customerName || 'Unknown';
      const key = phone || name.toLowerCase();

      if (!key || key === 'unknown') return;

      let user = userMap.get(key);
      if (!user) {
        // User found from orders but not in users collection
        user = {
          id: `ord-${key}`,
          name: name,
          email: order.customerEmail || '',
          phone: order.customerPhone || '',
          address: typeof order.address === 'string' ? order.address :
                   (typeof order.deliveryAddress === 'string' ? order.deliveryAddress :
                   (order.deliveryAddress ? [order.deliveryAddress.street, order.deliveryAddress.city].filter(Boolean).join(', ') : '')),
          createdAt: order.orderTime || order.createdAt || '',
          profileImage: '',
          totalOrders: 0,
          totalSpent: 0,
          totalSavings: 0,
          lastOrderDate: '',
          lastOrderStatus: '',
          ordersList: [],
          isFromFirestore: false,
          isBlocked: false,
          savedFromDoc: []
        };
        userMap.set(key, user);
      }

      user.totalOrders += 1;
      const amt = parseFloat(order.totalAmount) || 0;
      user.totalSpent += amt;

      // Calculate savings from items
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const qty = item.qty || item.quantity || 1;
          const mrp = parseFloat(item.sellingPrice || item.mrp) || 0;
          const salePrice = parseFloat(item.price) || 0;
          if (mrp > salePrice && salePrice > 0) {
            user.totalSavings += (mrp - salePrice) * qty;
          }
        });
      }

      const orderDate = order.orderTime || order.createdAt || '';
      if (!user.lastOrderDate || orderDate > user.lastOrderDate) {
        user.lastOrderDate = orderDate;
        user.lastOrderStatus = order.status || '';
      }

      user.ordersList.push(order);
    });

    const now = new Date();
    // Calculate smart tags
    const usersArray = Array.from(userMap.values());
    usersArray.forEach(user => {
      const tags = [];
      const lastOrder = user.lastOrderDate ? new Date(user.lastOrderDate) : null;
      const joined = user.createdAt ? new Date(user.createdAt) : null;
      
      const daysSinceLastOrder = lastOrder ? (now - lastOrder) / (1000 * 60 * 60 * 24) : Infinity;
      const daysSinceJoined = joined ? (now - joined) / (1000 * 60 * 60 * 24) : Infinity;

      // Logic for smart tags
      if (user.totalSpent >= 5000 || user.totalOrders >= 15) {
        tags.push({ label: 'VIP', color: 'bg-amber-100 text-amber-700 border-amber-200' });
      } else if (user.totalOrders >= 5) {
        tags.push({ label: 'Frequent', color: 'bg-blue-100 text-blue-700 border-blue-200' });
      }

      if (user.totalOrders === 0 && daysSinceJoined <= 14) {
        tags.push({ label: 'Newbie', color: 'bg-teal-100 text-teal-700 border-teal-200' });
      }

      if (user.totalOrders > 0 && daysSinceLastOrder > 30) {
        tags.push({ label: 'At Risk', color: 'bg-rose-100 text-rose-700 border-rose-200' });
      }
      
      if (user.totalOrders > 0 && daysSinceLastOrder <= 7 && !tags.some(t => t.label === 'VIP' || t.label === 'Frequent')) {
        tags.push({ label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' });
      }

      user.smartTags = tags;
    });

    return usersArray;
  }, [users, orders]);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = enrichedUsers.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q);

      const isActive = u.totalOrders > 0;
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Active' && isActive) ||
        (statusFilter === 'Inactive' && !isActive) ||
        (statusFilter === 'Registered' && u.isFromFirestore);

      return matchesSearch && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'oldest': return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'most-orders': return b.totalOrders - a.totalOrders;
        case 'highest-spend': return b.totalSpent - a.totalSpent;
        case 'name-az': return (a.name || '').localeCompare(b.name || '');
        default: return 0;
      }
    });

    return result;
  }, [enrichedUsers, searchQuery, statusFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = enrichedUsers.length;
    const active = enrichedUsers.filter(u => u.totalOrders > 0).length;
    const totalRevenue = enrichedUsers.reduce((s, u) => s + u.totalSpent, 0);
    const avgSpend = active > 0 ? totalRevenue / active : 0;
    return { total, active, totalRevenue, avgSpend };
  }, [enrichedUsers]);

  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Email', 'Joined Date', 'Total Orders', 'Total Spent (Rs)', 'Total Savings (Rs)', 'Last Order Date', 'Tags'];
    const rows = filteredUsers.map(u => {
      const tagLabels = (u.smartTags || []).map(t => t.label).join('; ');
      return [
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${u.phone || ''}"`,
        `"${u.email || ''}"`,
        `"${formatDate(u.createdAt) || ''}"`,
        u.totalOrders,
        u.totalSpent,
        u.totalSavings,
        `"${formatDate(u.lastOrderDate) || ''}"`,
        `"${tagLabels}"`
      ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.gsap-fade'),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, []);

  // Format date helper
  const formatDate = (val) => {
    if (!val) return '—';
    try {
      if (typeof val === 'string') {
        const d = new Date(val);
        if (isNaN(d)) return val;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (typeof val?.toDate === 'function') {
        return val.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (typeof val?.seconds === 'number') {
        return new Date(val.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch { return '—'; }
    return '—';
  };

  const formatDateTime = (val) => {
    if (!val) return '—';
    try {
      if (typeof val === 'string') {
        const d = new Date(val);
        if (isNaN(d)) return val;
        return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    } catch { return val; }
    return val;
  };

  const getStatusBadge = (status) => {
    const map = {
      'Delivered': { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: CheckCircle2 },
      'Out for Delivery': { bg: 'bg-blue-50 border-blue-200 text-blue-700', icon: Truck },
      'Preparing': { bg: 'bg-purple-50 border-purple-200 text-purple-700', icon: Package },
      'Packing': { bg: 'bg-purple-50 border-purple-200 text-purple-700', icon: Package },
      'Pending': { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: Clock },
      'Order Received': { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: Clock },
      'Cancelled': { bg: 'bg-rose-50 border-rose-200 text-rose-700', icon: XCircle },
    };
    return map[status] || { bg: 'bg-slate-50 border-slate-200 text-slate-600', icon: AlertCircle };
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="All Users & Customers"
        subtitle="Complete customer database — profiles, orders, spending analytics, and activity from Firestore"
      />

      <main ref={containerRef} className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 gsap-fade">
          {/* Total Users */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="text-[11px] font-semibold text-slate-400">Registered + order customers</p>
          </div>

          {/* Active Users */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.active}</p>
            <p className="text-[11px] font-semibold text-slate-400">Users with at least 1 order</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-[11px] font-semibold text-slate-400">From all customer orders</p>
          </div>

          {/* Avg Spend */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Spend / User</span>
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">₹{stats.avgSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-[11px] font-semibold text-slate-400">Average per active customer</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gsap-fade">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5">
              {['All', 'Active', 'Inactive', 'Registered'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none pr-8 cursor-pointer h-9"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-orders">Most Orders</option>
                <option value="highest-spend">Highest Spend</option>
                <option value="name-az">Name (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors h-9"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden gsap-fade">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Contact</th>
                  <th className="py-3.5 px-6">Joined</th>
                  <th className="py-3.5 px-6">Orders</th>
                  <th className="py-3.5 px-6">Total Spent (₹)</th>
                  <th className="py-3.5 px-6">Savings (₹)</th>
                  <th className="py-3.5 px-6">Last Order</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-slate-200" />
                        <p className="text-sm font-bold text-slate-400">No users found</p>
                        <p className="text-xs text-slate-300">No matching customers in database</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isActive = user.totalOrders > 0;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Customer Name & Avatar */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                              {(user.name || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate max-w-[140px]">{user.name}</p>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {user.isFromFirestore && (
                                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Reg</span>
                                )}
                                {user.smartTags && user.smartTags.map((tag, i) => (
                                  <span key={i} className={`text-[9px] font-bold px-1.5 rounded-sm border uppercase tracking-wider ${tag.color}`}>
                                    {tag.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-4 px-6">
                          <div className="space-y-0.5">
                            {user.phone && (
                              <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {user.phone}
                              </p>
                            )}
                            {user.email && (
                              <p className="flex items-center gap-1.5 text-slate-500 truncate max-w-[180px]">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" /> {user.email}
                              </p>
                            )}
                            {!user.phone && !user.email && (
                              <span className="text-slate-300">—</span>
                            )}
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-6 font-medium text-slate-500 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>

                        {/* Total Orders */}
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${user.totalOrders > 0
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                            {user.totalOrders}
                          </span>
                        </td>

                        {/* Total Spent */}
                        <td className="py-4 px-6 font-extrabold text-slate-900">
                          ₹{user.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Savings */}
                        <td className="py-4 px-6">
                          <span className={`font-bold ${user.totalSavings > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                            {user.totalSavings > 0 ? `₹${user.totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </span>
                        </td>

                        {/* Last Order Date */}
                        <td className="py-4 px-6 font-medium text-slate-500 whitespace-nowrap">
                          {formatDate(user.lastOrderDate)}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${isActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                            {user.isBlocked && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-rose-50 border-rose-200 text-rose-700 flex items-center gap-1 mt-1">
                                <ShieldAlert className="w-3 h-3" /> Blocked
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={async () => {
                              setSelectedUser(user);
                              // Fetch saved products from Firestore subcollections
                              if (user.isFromFirestore && user.id) {
                                setSavedLoading(true);
                                try {
                                  const saved = await getUserSavedProducts(user.id);
                                  setSavedProducts(saved);
                                } catch (e) {
                                  console.warn('Failed to fetch saved products:', e);
                                  setSavedProducts([]);
                                }
                                setSavedLoading(false);
                              } else {
                                setSavedProducts([]);
                              }
                            }}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors inline-flex items-center gap-1.5 text-xs border border-emerald-200 cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <SelectedUserModal
          user={selectedUser}
          onClose={() => { setSelectedUser(null); setSavedProducts([]); }}
          savedProducts={savedProducts}
          savedLoading={savedLoading}
          items={items}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          getStatusBadge={getStatusBadge}
          toggleUserBlockStatus={toggleUserBlockStatus}
          updateUserAdminNote={updateUserAdminNote}
        />
      )}
    </div>
  );
}

// Separated modal component for clarity
function SelectedUserModal({ user, onClose, savedProducts, savedLoading, items, formatDate, formatDateTime, getStatusBadge, toggleUserBlockStatus, updateUserAdminNote }) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [noteText, setNoteText] = useState(user.adminNote || '');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      await updateUserAdminNote(user.id, noteText);
      user.adminNote = noteText;
    } catch(e) {
      console.error(e);
    }
    setIsSavingNote(false);
  };

  const spendingData = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      months[label] = 0;
    }
    user.ordersList.forEach(o => {
      if (o.status === 'Cancelled' || o.status === 'Rejected') return;
      const d = new Date(o.createdAt || o.orderTime);
      if (isNaN(d)) return;
      const label = d.toLocaleString('default', { month: 'short' });
      if (months[label] !== undefined) {
        months[label] += parseFloat(o.totalAmount) || 0;
      }
    });
    
    const maxVal = Math.max(...Object.values(months), 1);
    
    return Object.keys(months).map(label => ({
      label,
      value: months[label],
      percent: (months[label] / maxVal) * 100
    }));
  }, [user.ordersList]);

  const handleBlockToggle = async () => {
    setIsBlocking(true);
    try {
      await toggleUserBlockStatus(user.id, user.isBlocked);
      user.isBlocked = !user.isBlocked; // Optimistic update
    } catch(e) {
      console.error('Failed to toggle block status:', e);
    }
    setIsBlocking(false);
  };

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-200">
                  {(user.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    {user.name}
                    {user.smartTags && user.smartTags.map((tag, i) => (
                      <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${tag.color}`}>
                        {tag.label}
                      </span>
                    ))}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Customer since {formatDate(user.createdAt)}
                    {user.isFromFirestore && (
                      <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                        Registered User
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                  <button
                    onClick={handleBlockToggle}
                    disabled={isBlocking}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      user.isBlocked 
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    } disabled:opacity-50`}
                  >
                    {isBlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                     user.isBlocked ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />
                    }
                    {user.isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Profile Info Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Phone Number
                  </p>
                  <p className="text-sm font-bold text-slate-800">{user.phone || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email Address
                  </p>
                  <p className="text-sm font-bold text-slate-800 break-all">{user.email || 'N/A'}</p>
                </div>
              </div>

              {user.address && (
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/60 space-y-1">
                  <p className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-600" /> Address
                  </p>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    {typeof user.address === 'string' ? user.address :
                      (typeof user.address === 'object' ?
                        [user.address.street, user.address.locality, user.address.city, user.address.pincode].filter(Boolean).join(', ')
                        : 'N/A'
                      )}
                  </p>
                </div>
              )}

              {/* Spending Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-1 col-span-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Orders</p>
                  <p className="text-2xl font-black text-slate-900">{user.totalOrders}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Spent</p>
                  <p className="text-xl font-black text-emerald-700">₹{user.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Savings</p>
                  <p className="text-xl font-black text-blue-600">₹{user.totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Monthly Spending Graph */}
              {user.totalOrders > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <BarChart2 className="w-3.5 h-3.5 text-blue-500" /> Spending Trend (6 Months)
                  </h4>
                  <div className="flex items-end justify-between gap-2 h-24 pt-4">
                    {spendingData.map((data, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full bg-slate-200 rounded-t-sm rounded-b-sm h-full flex items-end relative">
                          <div 
                            className="w-full bg-blue-500 rounded-t-sm rounded-b-sm transition-all duration-500"
                            style={{ height: `${data.percent}%` }}
                          />
                          {/* Tooltip on hover */}
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            ₹{data.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{data.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Private Admin Notes */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 space-y-3 relative group">
                <h4 className="text-xs font-black text-amber-900 flex items-center justify-between uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-amber-600" /> Private Admin Notes
                  </div>
                </h4>
                <div className="relative">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add private remarks about this customer..."
                    className="w-full h-24 bg-white/60 border border-amber-200 rounded-xl p-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-all placeholder:text-amber-700/40"
                  />
                  {noteText !== (user.adminNote || '') && (
                    <button
                      onClick={handleSaveNote}
                      disabled={isSavingNote}
                      className="absolute bottom-2 right-2 bg-amber-500 hover:bg-amber-600 text-white p-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div> {/* END LEFT COLUMN */}

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 space-y-6">
              {/* ========== SAVED / WISHLIST PRODUCTS SECTION ========== */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" /> Saved / Wishlist Products
                  </h4>
                  {savedLoading && (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  )}
                </div>

                {(() => {
                  // Combine saved from Firestore subcollections + user document fields
                  const allSaved = [...savedProducts];
                  // Also check if user document has saved items as array field
                  const docSaved = user.savedFromDoc || [];
                  if (Array.isArray(docSaved) && docSaved.length > 0) {
                    docSaved.forEach((item, idx) => {
                      if (typeof item === 'string') {
                        // Item ID reference — try to match with catalog
                        const matchedItem = items.find(i => i.id === item || i.name === item);
                        allSaved.push({
                          id: `doc-${idx}`,
                          name: matchedItem?.name || item,
                          price: matchedItem?.price || 0,
                          sellingPrice: matchedItem?.sellingPrice || 0,
                          category: matchedItem?.category || '',
                          image: matchedItem?.image || matchedItem?.imageUrl || '',
                          source: 'userDoc'
                        });
                      } else if (typeof item === 'object' && item !== null) {
                        allSaved.push({
                          id: item.id || `doc-${idx}`,
                          name: item.name || item.productName || 'Unknown Product',
                          price: item.price || item.salePrice || 0,
                          sellingPrice: item.sellingPrice || item.mrp || 0,
                          category: item.category || '',
                          image: item.image || item.imageUrl || '',
                          source: item.source || 'userDoc'
                        });
                      }
                    });
                  }

                  if (savedLoading) {
                    return (
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center">
                        <Loader2 className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-spin" />
                        <p className="text-xs font-bold text-slate-400">Loading saved products...</p>
                      </div>
                    );
                  }

                  if (allSaved.length === 0) {
                    return (
                      <div className="bg-rose-50/40 p-6 rounded-2xl border border-rose-100 text-center">
                        <Heart className="w-10 h-10 text-rose-200 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400">No saved products found</p>
                        <p className="text-[10px] text-slate-300 mt-1">This user hasn't saved any products yet</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {allSaved.map((product, idx) => (
                        <div key={product.id || idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
                          {/* Product icon/image */}
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                              <Bookmark className="w-5 h-5" />
                            )}
                          </div>

                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.category && (
                                <span className="text-[10px] font-semibold text-slate-400">{product.category}</span>
                              )}
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100">
                                {product.source === 'userDoc' ? 'Saved' :
                                 product.source === 'wishlist' ? 'Wishlist' :
                                 product.source === 'favorites' ? 'Favorite' :
                                 product.source === 'cart' ? 'In Cart' :
                                 'Saved'}
                              </span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right shrink-0">
                            {product.sellingPrice > 0 && product.sellingPrice > product.price ? (
                              <>
                                <p className="text-[10px] text-slate-400 line-through">₹{product.sellingPrice}</p>
                                <p className="text-xs font-extrabold text-emerald-700">₹{product.price}</p>
                              </>
                            ) : (
                              <p className="text-xs font-extrabold text-slate-800">
                                {product.price > 0 ? `₹${product.price}` : '—'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* ========== ORDER HISTORY SECTION ========== */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" /> Order History ({user.ordersList.length})
                  </h4>
                </div>

                {user.ordersList.length === 0 ? (
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200/80 text-center">
                    <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                    {user.ordersList
                      .sort((a, b) => (b.orderTime || b.createdAt || '').localeCompare(a.orderTime || a.createdAt || ''))
                      .map((order, idx) => {
                        const badge = getStatusBadge(order.status);
                        const BadgeIcon = badge.icon;
                        return (
                          <div key={order.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5 hover:shadow-sm transition-shadow">
                            {/* Order Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-extrabold text-emerald-600">{order.id}</span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {formatDateTime(order.orderTime || order.createdAt)}
                                </span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                                <BadgeIcon className="w-3 h-3" /> {order.status}
                              </span>
                            </div>

                            {/* Items */}
                            {order.items && (
                              <div className="space-y-1">
                                {order.items.map((item, i) => {
                                  const qty = item.qty || item.quantity || 1;
                                  const price = item.price || 0;
                                  return (
                                    <div key={i} className="flex justify-between text-xs text-slate-600 font-medium">
                                      <span>{qty}x {item.name}</span>
                                      <span className="font-bold text-slate-800">₹{(qty * price).toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Total */}
                            <div className="pt-1.5 border-t border-slate-100 flex justify-between text-xs">
                              <div className="flex items-center gap-3">
                                {order.paymentMethod && (
                                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                                    <CreditCard className="w-3 h-3" /> {order.paymentMethod}
                                  </span>
                                )}
                              </div>
                              <span className="font-extrabold text-emerald-700">₹{(order.totalAmount || 0).toFixed(2)}</span>
                            </div>

                            {/* Cancel reason */}
                            {order.status === 'Cancelled' && order.cancelReason && (
                              <p className="text-[10px] text-rose-600 font-semibold italic bg-rose-50 rounded-lg px-2.5 py-1 border border-rose-100">
                                Reason: {order.cancelReason}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div> {/* END RIGHT COLUMN */}
            </div> {/* END GRID */}
            </div> {/* END SCROLLABLE BODY */}

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md cursor-pointer"
              >
                Close Customer Details
              </button>
            </div>
          </div>
        </div>
  );
}

