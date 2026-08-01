import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Clock,
  UserCheck,
  MapPin,
  Phone,
  CheckCircle2,
  ChevronRight,
  UserPlus,
  AlertCircle,
  Truck,
  Ban,
  X,
  AlertTriangle,
  Printer,
  FileText,
  RefreshCw,
  Eye,
  User,
  CreditCard,
  Navigation,
  ShieldCheck
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import ThermalReceiptModal from '../components/ThermalReceiptModal';
import DeliveryMapModal from '../components/DeliveryMapModal';
import { checkDeliveryServiceable, resolveOrderCoordinates, BAHARAGORA_HUB } from '../utils/locationUtils';
import { fetchRoadRoute } from '../utils/routeService';
import gsap from 'gsap';

export default function CurrentOrdersView() {
  const { orders, staff, cancelReasonsList, updateOrderStatus, cancelOrder, sendDelayNotification, assignDeliveryPartner } = useAdmin();
  const [filterStatus, setFilterStatus] = useState('All');

  // Pending status map for stage selection before rolling update
  const [pendingStatusMap, setPendingStatusMap] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // View Customer Details Modal state
  const [viewDetailsOrder, setViewDetailsOrder] = useState(null);

  // Live Map Tracking Modal state
  const [trackingOrder, setTrackingOrder] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cancel order modal state
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [selectedReason, setSelectedReason] = useState(cancelReasonsList[0]);
  const [customReasonText, setCustomReasonText] = useState('');

  // Delay order modal state
  const delayReasonsList = [
    '🌧️ Delivery delayed due to bad weather.',
    '🚦 Delivery delayed due to heavy traffic.',
    '🚚 Delivery partner is running late.',
    '📦 Your order is taking longer than expected.',
    '🛠️ Temporary operational issue. We apologize for the delay.',
    '🎉 High order volume is causing a slight delay.',
    'Other / Custom Message'
  ];
  const [delayingOrder, setDelayingOrder] = useState(null);
  const [selectedDelayReason, setSelectedDelayReason] = useState(delayReasonsList[0]);
  const [customDelayText, setCustomDelayText] = useState('');

  const handleConfirmDelay = async (e) => {
    e.preventDefault();
    if (!delayingOrder) return;
    const finalReason = selectedDelayReason === 'Other / Custom Message' 
      ? (customDelayText.trim() || 'Your order is delayed.') 
      : selectedDelayReason;
    
    const message = `⚠️ Delivery Update\n\n${finalReason}`;
    await sendDelayNotification(delayingOrder.id, message);
    setDelayingOrder(null);
    setCustomDelayText('');
    showToast(`Delay notification sent for Order #${delayingOrder.id}.`);
  };

  // Print Bill Modal state
  const [printingOrder, setPrintingOrder] = useState(null);

  const containerRef = useRef(null);

  const formatOrderDateTime = (order) => {
    const val = order.createdAt || order.orderTime || order.updatedAt;
    if (!val) return 'Recent Order';

    let date;
    if (typeof val === 'string') {
      date = new Date(val);
    } else if (val && typeof val.toDate === 'function') {
      date = val.toDate();
    } else if (val && typeof val.seconds === 'number') {
      date = new Date(val.seconds * 1000);
    } else if (val instanceof Date) {
      date = val;
    }

    if (!date || isNaN(date.getTime())) {
      return typeof order.orderTime === 'string' ? order.orderTime : 'Recent Order';
    }

    const exact = date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));
    let relative = '';
    if (diffSec < 60) relative = 'Just now';
    else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
    else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
    else relative = `${Math.floor(diffSec / 86400)}d ago`;

    return { exact, relative };
  };

  const currentOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

  const filteredOrders = currentOrders.filter(order => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Order Received') return order.status === 'Order Received' || order.status === 'Pending';
    if (filterStatus === 'Packing') return order.status === 'Packing' || order.status === 'Preparing';
    return order.status === filterStatus;
  });

  const [orderDistances, setOrderDistances] = useState({});

  const fetchedRoadOrderIdsRef = useRef(new Set());

  useEffect(() => {
    let active = true;
    
    const fetchDistances = async () => {
      for (const order of currentOrders) {
        if (!active) break;
        
        const coords = await resolveOrderCoordinates(order);
        const check = checkDeliveryServiceable(coords.lat, coords.lng);
        
        // Skip API call if we already successfully fetched road distance
        if (fetchedRoadOrderIdsRef.current.has(order.id)) {
          continue;
        }
        
        // Set straight-line fallback first while loading
        if (active) {
          setOrderDistances(prev => ({
            ...prev,
            [order.id]: prev[order.id] || { ...check, roadDistanceKm: check.distanceKm, isRoad: false }
          }));
        }
        
        try {
          // Small delay to prevent Google Maps Directions API rate limits
          await new Promise(r => setTimeout(r, 350));
          const roadResult = await fetchRoadRoute(BAHARAGORA_HUB, coords);
          
          if (active && roadResult.success && roadResult.totalDistanceKm > 0) {
            fetchedRoadOrderIdsRef.current.add(order.id);
            setOrderDistances(prev => ({
              ...prev,
              [order.id]: {
                ...check,
                roadDistanceKm: roadResult.totalDistanceKm,
                isRoad: true
              }
            }));
          }
        } catch (err) {
          // Fallback remains
        }
      }
    };
    
    fetchDistances();
    return () => { active = false; };
  }, [orders]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, scale: 0.97, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [filterStatus, orders.length]);

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    const finalReason = selectedReason === 'Other / Custom Reason' ? (customReasonText.trim() || 'Other Reason') : selectedReason;
    await cancelOrder(cancellingOrder.id, finalReason);
    setCancellingOrder(null);
    setCustomReasonText('');
    showToast(`Order #${cancellingOrder.id} cancelled.`);
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col relative">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <Header
        title="Live Current Orders"
        subtitle="Manage live customer orders in Indian Rupees (₹), print thermal receipts, update status, and assign partners"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Status Filter Tabs & Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            {['All', 'Order Received', 'Packing', 'Out for Delivery'].map((status) => {
              const count = status === 'All'
                ? currentOrders.length
                : currentOrders.filter(o => status === 'Order Received' ? (o.status === 'Order Received' || o.status === 'Pending') : status === 'Packing' ? (o.status === 'Packing' || o.status === 'Preparing') : o.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    filterStatus === status
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{status}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    filterStatus === status ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{currentOrders.length} active orders requiring store/delivery action</span>
          </div>
        </div>

        {/* Orders Cards Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No active orders found</h3>
            <p className="text-xs text-slate-400">No live orders in database under "{filterStatus}".</p>
          </div>
        ) : (
          <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map((order) => {
              const check = orderDistances[order.id] || { isServiceable: true, distanceKm: '...' };
              const selectedVal = pendingStatusMap[order.id] || order.status || 'Order Received';

              const stages = [
                { label: 'Received', value: 'Order Received' },
                { label: 'Packing', value: 'Packing' },
                { label: 'Out for Delivery', value: 'Out for Delivery' },
                { label: 'Delivered', value: 'Delivered' }
              ];

              const currentStageIdx = stages.findIndex(s => s.value === selectedVal || (selectedVal === 'Pending' && s.value === 'Order Received') || (selectedVal === 'Preparing' && s.value === 'Packing'));

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 p-6 flex flex-col justify-between space-y-6 relative overflow-hidden"
                >
                  {/* Top Bar: Order ID, Time & Action Buttons */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      {/* Order Identity & Placement Time */}
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100/80">
                          #{order.id}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            {typeof formatOrderDateTime(order) === 'object'
                              ? `${formatOrderDateTime(order).exact} (${formatOrderDateTime(order).relative})`
                              : formatOrderDateTime(order)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-1.5">
                        {/* Live Map Button */}
                        <button
                          onClick={() => setTrackingOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                          title="Track Live Rider & Customer Map"
                        >
                          <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Track Map
                        </button>

                        {/* Customer Details Button */}
                        <button
                          onClick={() => setViewDetailsOrder(order)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View Customer Details"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>

                        {/* Delay Delivery Button */}
                        <button
                          onClick={() => {
                            setSelectedDelayReason(delayReasonsList[0]);
                            setCustomDelayText('');
                            setDelayingOrder(order);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200/60 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Delay Delivery"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Delay
                        </button>

                        {/* Cancel Order Button */}
                        <button
                          onClick={() => {
                            setSelectedReason(cancelReasonsList[0]);
                            setCustomReasonText('');
                            setCancellingOrder(order);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold border border-rose-200/60 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Cancel Order"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-500" /> Cancel
                        </button>
                      </div>
                    </div>

                    {/* Customer Info & Address Card */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">{order.customerName || 'Valued Customer'}</h3>
                          <p className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{order.customerPhone || 'N/A'}</span>
                          </p>
                        </div>

                        {/* Zone Serviceability Badge */}
                        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 flex items-center gap-1 ${check.isServiceable ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' : 'bg-rose-50 text-rose-700 border-rose-200/70 animate-pulse'}`}>
                          {check.isServiceable ? (
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {check.roadDistanceKm ?? check.distanceKm} km (Road Distance)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-600">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {check.roadDistanceKm ?? check.distanceKm} km (Out of Zone!)
                            </span>
                          )}
                        </span>
                      </div>

                      <p className="flex items-start gap-2 text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          {typeof order.address === 'string' ? order.address : (typeof order.deliveryAddress === 'string' ? order.deliveryAddress : `${order.deliveryAddress?.street || ''}, ${order.deliveryAddress?.city || ''}`)}
                        </span>
                      </p>
                    </div>

                    {/* Ordered Grocery Items Section */}
                    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ordered Items</span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                          {order.items ? order.items.length : 0} Items
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {order.items && order.items.map((item, i) => {
                          const qty = item.qty || item.quantity || 1;
                          const price = item.price || 0;
                          return (
                            <div key={i} className="flex items-center justify-between text-xs text-slate-700 font-medium">
                              <span className="truncate pr-2">
                                <span className="font-bold text-slate-900 bg-slate-200/60 px-1.5 py-0.5 rounded mr-1.5 text-[10px]">{qty}x</span>
                                {item.name}
                              </span>
                              <span className="font-bold text-slate-900 shrink-0">₹{(qty * price).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center text-xs font-bold text-slate-900">
                        <span className="text-slate-500">Total Payable</span>
                        <span className="text-emerald-700 text-base font-extrabold">₹{(order.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Controls: Assign Partner & Progress Pipeline */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    {/* Delivery Partner Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-emerald-600" /> Assign Delivery Partner
                        </span>
                        {order.assignedPartnerId && (
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Assigned</span>
                        )}
                      </label>

                      <select
                        value={order.assignedPartnerId || ''}
                        onChange={(e) => assignDeliveryPartner(order.id, e.target.value)}
                        className={`w-full text-xs font-semibold rounded-xl px-3.5 py-2.5 border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                          order.assignedPartnerId
                            ? 'bg-emerald-50/40 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                        }`}
                      >
                        <option value="">-- Select Delivery Person --</option>
                        {staff.map(person => (
                          <option key={person.id} value={person.id}>
                            {person.name} ({person.vehicle}) - Status: {person.status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Interactive Order Pipeline Tracker */}
                    <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" /> Tracking Progress Stage
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                          {order.status || 'Order Received'}
                        </span>
                      </div>

                      {/* Step Progress Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {stages.map((st, idx) => {
                          const isSelected = selectedVal === st.value || (selectedVal === 'Pending' && st.value === 'Order Received') || (selectedVal === 'Preparing' && st.value === 'Packing');
                          const isPast = idx <= (currentStageIdx >= 0 ? currentStageIdx : 0);

                          return (
                            <button
                              key={st.value}
                              type="button"
                              onClick={() => setPendingStatusMap(prev => ({ ...prev, [order.id]: st.value }))}
                              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center truncate border ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-[1.02]'
                                  : isPast
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {st.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Update Live Status Action Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          const targetStatus = pendingStatusMap[order.id] || order.status || 'Order Received';
                          await updateOrderStatus(order.id, targetStatus);
                          showToast(`Order #${order.id} status updated to ${targetStatus}!`);
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> Update & Sync Status Live
                      </button>
                    </div>

                    {/* Print Bill / Thermal Receipt Button */}
                    <div>
                      <button
                        onClick={() => setPrintingOrder(order)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          order.isBillPrinted
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 shadow-2xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                        }`}
                      >
                        <Printer className="w-4 h-4" />
                        <span>{order.isBillPrinted ? 'Reprint Bill / Thermal Receipt' : 'Print Bill / Thermal Receipt'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* LIVE DELIVERY TRACKING MAP MODAL */}
      {trackingOrder && (
        <DeliveryMapModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}

      {/* THERMAL POS RECEIPT MODAL */}
      {printingOrder && (
        <ThermalReceiptModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* Customer Details Modal */}
      {viewDetailsOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <User className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600">{viewDetailsOrder.id}</span>
                  <h3 className="text-lg font-black text-slate-900">Customer Details</h3>
                </div>
              </div>
              <button
                onClick={() => setViewDetailsOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info Card */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Customer Name</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">{viewDetailsOrder.customerName || 'Valued Customer'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Phone Number</p>
                    <a
                      href={`tel:${viewDetailsOrder.customerPhone}`}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1.5 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5" /> {viewDetailsOrder.customerPhone || 'N/A'}
                    </a>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Payment Mode</p>
                    <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-500" /> {viewDetailsOrder.paymentMethod || 'Cash on Delivery'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Address Details */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/60 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Delivery Address
                </p>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  {typeof viewDetailsOrder.address === 'string'
                    ? viewDetailsOrder.address
                    : (typeof viewDetailsOrder.deliveryAddress === 'string'
                      ? viewDetailsOrder.deliveryAddress
                      : `${viewDetailsOrder.deliveryAddress?.street || ''}, ${viewDetailsOrder.deliveryAddress?.locality || ''}, ${viewDetailsOrder.deliveryAddress?.city || ''} ${viewDetailsOrder.deliveryAddress?.pincode || ''}`)}
                </p>
              </div>

              {/* Items Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Ordered Items</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {viewDetailsOrder.items && viewDetailsOrder.items.map((item, i) => {
                    const qty = item.qty || item.quantity || 1;
                    const price = item.price || 0;
                    return (
                      <div key={i} className="flex justify-between text-xs text-slate-700 font-bold">
                        <span>{qty}x {item.name}</span>
                        <span className="font-extrabold text-slate-900">₹{(qty * price).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-extrabold text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-emerald-700 text-sm font-black">₹{(viewDetailsOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewDetailsOrder(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md cursor-pointer"
              >
                Close Customer Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL WITH REASON DROPDOWN */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Cancel Order #{cancellingOrder.id}</h3>
                  <p className="text-xs text-slate-400">Specify reason for cancelling customer order</p>
                </div>
              </div>
              <button onClick={() => setCancellingOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-800">{cancellingOrder.customerName}</p>
                <p className="text-slate-500 truncate">{cancellingOrder.deliveryAddress}</p>
                <p className="font-extrabold text-emerald-700 mt-1">₹{(cancellingOrder.totalAmount || 0).toFixed(2)}</p>
              </div>

              {/* Cancellation Reason Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Cancellation Reason *</label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-rose-500"
                >
                  {cancelReasonsList.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Optional Custom Reason Input */}
              {selectedReason === 'Other / Custom Reason' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Enter Custom Reason</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Write detailed reason..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                  ></textarea>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" /> Confirm Order Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELAY DELIVERY MODAL */}
      {delayingOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Delay Order #{delayingOrder.id}</h3>
                  <p className="text-xs text-slate-400">Send delay notification to customer</p>
                </div>
              </div>
              <button onClick={() => setDelayingOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelay} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-800">{delayingOrder.customerName}</p>
                <p className="text-slate-500 truncate">{typeof delayingOrder.address === 'string' ? delayingOrder.address : (typeof delayingOrder.deliveryAddress === 'string' ? delayingOrder.deliveryAddress : `${delayingOrder.deliveryAddress?.street || ''}, ${delayingOrder.deliveryAddress?.city || ''}`)}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Delay Reason *</label>
                <select
                  value={selectedDelayReason}
                  onChange={(e) => setSelectedDelayReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500"
                >
                  {delayReasonsList.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {selectedDelayReason === 'Other / Custom Message' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Enter Custom Message (Max 200 chars)</label>
                  <textarea
                    rows="2"
                    required
                    maxLength="200"
                    placeholder="Type custom delay message..."
                    value={customDelayText}
                    onChange={(e) => setCustomDelayText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                  ></textarea>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDelayingOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4" /> Send Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
