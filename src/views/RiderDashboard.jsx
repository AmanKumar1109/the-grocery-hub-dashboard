import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Package,
  Clock,
  LogOut,
  ShoppingBag,
  User,
  ChevronRight,
  Navigation,
  Star,
  AlertCircle,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';

// Status config
const STATUS_CONFIG = {
  'Order Received': { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', dot: 'bg-blue-400', label: 'Received' },
  'Pending':        { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', dot: 'bg-blue-400', label: 'Received' },
  'Packing':        { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-400', label: 'Packing' },
  'Preparing':      { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-400', label: 'Packing' },
  'Out for Delivery': { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', label: 'Out for Delivery' },
  'Delivered':      { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', dot: 'bg-slate-400', label: 'Delivered' },
};

const TRACKING_STEPS = [
  { value: 'Order Received', label: 'Received', icon: '📦' },
  { value: 'Packing', label: 'Packing', icon: '🛍️' },
  { value: 'Out for Delivery', label: 'On the Way', icon: '🛵' },
  { value: 'Delivered', label: 'Delivered', icon: '✅' },
];

function TrackingBar({ status }) {
  const normalize = (s) => {
    if (s === 'Pending') return 'Order Received';
    if (s === 'Preparing') return 'Packing';
    return s;
  };
  const current = normalize(status);
  const currentIdx = TRACKING_STEPS.findIndex(s => s.value === current);

  return (
    <div className="flex items-center gap-0 w-full">
      {TRACKING_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <React.Fragment key={step.value}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                isDone
                  ? isCurrent
                    ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/40 scale-110'
                    : 'bg-emerald-700/60 border-emerald-600/50'
                  : 'bg-slate-700/50 border-slate-600/30'
              }`}>
                <span className={isDone ? '' : 'opacity-30'}>{step.icon}</span>
              </div>
              <p className={`text-[9px] font-bold text-center leading-tight ${
                isCurrent ? 'text-emerald-300' : isDone ? 'text-slate-300' : 'text-slate-600'
              }`} style={{ width: 44 }}>{step.label}</p>
            </div>
            {idx < TRACKING_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all ${
                idx < currentIdx ? 'bg-emerald-600' : 'bg-slate-700'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function RiderDashboard() {
  const { currentUser, riderStaffDoc, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [staffDoc, setStaffDoc] = useState(riderStaffDoc);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deliveringId, setDeliveringId] = useState(null); // orderId being delivered
  const [expandedOrder, setExpandedOrder] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Real-time listen to rider's staff doc for live status
  useEffect(() => {
    if (!riderStaffDoc?.id) return;
    const unsub = onSnapshot(doc(db, 'staff', riderStaffDoc.id), (snap) => {
      if (snap.exists()) {
        setStaffDoc({ id: snap.id, ...snap.data() });
      }
    });
    return unsub;
  }, [riderStaffDoc?.id]);

  // Real-time listen to assigned orders
  useEffect(() => {
    if (!riderStaffDoc?.id) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('assignedPartnerId', '==', riderStaffDoc.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort: active first, then by time
      loaded.sort((a, b) => {
        const aActive = a.status !== 'Delivered' && a.status !== 'Cancelled';
        const bActive = b.status !== 'Delivered' && b.status !== 'Cancelled';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return 0;
      });
      setOrders(loaded);
      setLoading(false);
    });

    return unsub;
  }, [riderStaffDoc?.id]);

  // Mark as Delivered handler
  const handleMarkDelivered = async (order) => {
    if (deliveringId) return;
    setDeliveringId(order.id);
    try {
      // 1. Mark order as Delivered in Firestore
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'Delivered',
        isCurrent: false,
        deliveredAt: new Date().toISOString()
      });

      // 2. Update staff status using LOCAL real-time state (not stale Firestore counter)
      if (riderStaffDoc?.id) {
        // Count remaining active orders AFTER this delivery (exclude current order)
        const remainingActive = activeOrders.filter(
          o => o.id !== order.id && o.status !== 'Delivered' && o.status !== 'Cancelled'
        ).length;

        await updateDoc(doc(db, 'staff', riderStaffDoc.id), {
          activeOrders: remainingActive,
          // Go back to Available only when no more active orders remain
          status: remainingActive === 0 ? 'Available' : 'On Duty',
          totalDeliveries: (staffDoc?.totalDeliveries || 0) + 1
        });
      }

      showToast(
        `✅ Order #${order.id} delivered! ${
          activeOrders.filter(o => o.id !== order.id).length === 0
            ? 'Status → Available 🟢'
            : 'Next order ready 🛵'
        }`,
        'success'
      );
    } catch (err) {
      console.error('Mark delivered error:', err);
      showToast('❌ Error marking delivered. Try again.', 'error');
    } finally {
      setDeliveringId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading your orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-bold transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200'
            : 'bg-rose-900/90 border-rose-500/50 text-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          {toast.msg}
        </div>
      )}

      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">The Grocery Hub</p>
              <h1 className="text-sm font-black text-white leading-none">Delivery Dashboard</h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Rider Profile Card */}
        <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/40 border border-emerald-500/20 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 text-2xl font-black text-white">
                {staffDoc?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-base font-black text-white">{staffDoc?.name || 'Rider'}</h2>
                <p className="text-xs text-emerald-300/70 font-medium">{staffDoc?.vehicle || 'Delivery Partner'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-amber-300">{staffDoc?.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-[10px] text-slate-400">· {staffDoc?.totalDeliveries || 0} deliveries</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border ${
              staffDoc?.status === 'On Duty'
                ? 'bg-amber-500/15 border-amber-500/30'
                : 'bg-emerald-500/15 border-emerald-500/30'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                staffDoc?.status === 'On Duty' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <p className={`text-[10px] font-black ${
                staffDoc?.status === 'On Duty' ? 'text-amber-300' : 'text-emerald-300'
              }`}>{staffDoc?.status || 'Available'}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-xl font-black text-emerald-400">{activeOrders.length}</p>
              <p className="text-[10px] text-slate-400 font-medium">Active</p>
            </div>
            <div className="text-center border-x border-white/5">
              <p className="text-xl font-black text-white">{deliveredOrders.length}</p>
              <p className="text-[10px] text-slate-400 font-medium">Today Done</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-amber-400">{staffDoc?.totalDeliveries || 0}</p>
              <p className="text-[10px] text-slate-400 font-medium">Total</p>
            </div>
          </div>
        </div>

        {/* Active Orders Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Orders ({activeOrders.length})
            </h2>
          </div>

          {activeOrders.length === 0 ? (
            <div className="bg-slate-800/40 border border-white/5 rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-base font-black text-slate-400">No active orders</p>
              <p className="text-xs text-slate-500">Waiting for admin to assign orders to you</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Order Received'];
                const isExpanded = expandedOrder === order.id;
                const isDelivering = deliveringId === order.id;
                const canDeliver = order.status === 'Out for Delivery' || order.status === 'Packing' || order.status === 'Order Received' || order.status === 'Pending';

                return (
                  <div
                    key={order.id}
                    className="bg-slate-800/60 border border-white/8 rounded-3xl overflow-hidden shadow-xl"
                  >
                    {/* Order Card Header */}
                    <div className="p-5 space-y-4">
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black text-emerald-400 tracking-wider">{order.id}</span>
                          <h3 className="text-base font-black text-white mt-0.5">{order.customerName || 'Customer'}</h3>
                        </div>
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Tracking Bar */}
                      <TrackingBar status={order.status} />

                      {/* Address & Phone */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5 bg-slate-700/40 rounded-2xl p-3">
                          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-200 font-medium leading-relaxed">
                            {typeof order.address === 'string'
                              ? order.address
                              : typeof order.deliveryAddress === 'string'
                                ? order.deliveryAddress
                                : `${order.deliveryAddress?.street || ''}, ${order.deliveryAddress?.locality || ''}, ${order.deliveryAddress?.city || ''} ${order.deliveryAddress?.pincode || ''}`}
                          </p>
                        </div>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="flex items-center gap-2.5 bg-slate-700/40 hover:bg-slate-700/70 rounded-2xl p-3 transition-colors group"
                        >
                          <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                          <p className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                            {order.customerPhone || 'N/A'} · Tap to call
                          </p>
                        </a>
                      </div>

                      {/* Expand/Collapse Items */}
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-300">
                          {order.items?.length || 0} items · ₹{(order.totalAmount || 0).toFixed(2)}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {/* Items List (expandable) */}
                      {isExpanded && (
                        <div className="bg-slate-900/40 rounded-2xl p-3 space-y-2">
                          {order.items?.map((item, i) => {
                            const qty = item.qty || item.quantity || 1;
                            return (
                              <div key={i} className="flex justify-between text-xs text-slate-300 font-medium">
                                <span>{qty}x {item.name}</span>
                                <span className="text-white font-bold">₹{(qty * (item.price || 0)).toFixed(2)}</span>
                              </div>
                            );
                          })}
                          <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-extrabold">
                            <span className="text-slate-300">Total</span>
                            <span className="text-emerald-400">₹{(order.totalAmount || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mark as Delivered CTA */}
                    <div className="px-5 pb-5">
                      <button
                        onClick={() => handleMarkDelivered(order)}
                        disabled={isDelivering || !canDeliver}
                        className={`w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                          isDelivering
                            ? 'bg-emerald-700/60 text-emerald-300 cursor-not-allowed'
                            : canDeliver
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/30 active:scale-95'
                              : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isDelivering ? (
                          <>
                            <div className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                            Marking Delivered…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            Mark as Delivered
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delivered Orders (collapsible history) */}
        {deliveredOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-slate-400 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
              Completed Today ({deliveredOrders.length})
            </h2>
            <div className="space-y-2">
              {deliveredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-800/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-black text-slate-400">{order.id}</p>
                    <p className="text-sm font-bold text-slate-300">{order.customerName}</p>
                    <p className="text-xs text-slate-500">₹{(order.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/40">
                    ✓ Delivered
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No orders at all */}
        {orders.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-xs text-slate-500">No orders assigned yet. Contact your admin.</p>
          </div>
        )}
      </main>
    </div>
  );
}
