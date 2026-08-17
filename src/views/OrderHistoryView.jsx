import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Search,
  Eye,
  Edit,
  Truck,
  CheckCircle,
  XCircle,
  X,
  Filter,
  Calendar,
  AlertTriangle,
  Ban,
  Printer,
  Lock,
  AlertCircle,
  ShieldCheck,
  Moon
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import ThermalReceiptModal from '../components/ThermalReceiptModal';
import gsap from 'gsap';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function OrderHistoryView() {
  const { orders, staff, cancelReasonsList, updateOrderStatus, cancelOrder, assignDeliveryPartner } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Modal for view/update order
  const [activeModalOrder, setActiveModalOrder] = useState(null);

  // Quick cancel modal
  const [quickCancelOrder, setQuickCancelOrder] = useState(null);
  const [cancelReasonText, setCancelReasonText] = useState(cancelReasonsList[0]);

  // Thermal print modal state
  const [printingOrder, setPrintingOrder] = useState(null);

  // OTP Verification Modal state (OrderHistory admin side)
  const [otpVerifyOrder, setOtpVerifyOrder] = useState(null);
  const [adminOtpInput, setAdminOtpInput] = useState('');
  const [adminOtpError, setAdminOtpError] = useState('');
  const [adminOtpVerifying, setAdminOtpVerifying] = useState(false);

  const tableRef = useRef(null);

  const historyOrders = orders;

  const filteredOrders = historyOrders.filter(order => {
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    // Check text search
    const query = searchQuery.toLowerCase();
    const matchesSearch = (order.id || '').toLowerCase().includes(query) ||
                          (order.customerName || '').toLowerCase().includes(query) ||
                          (order.customerEmail || '').toLowerCase().includes(query) ||
                          (order.customerPhone || '').toLowerCase().includes(query) ||
                          (order.deliveryAddress || '').toLowerCase().includes(query);
                          
    // Check date filter
    let matchesDate = true;
    if (dateFilter) {
      const orderDateStr = order.orderTime || order.createdAt || '';
      const d = new Date(orderDateStr);
      if (!isNaN(d)) {
        // Adjust for local time zone formatting
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const formattedOrderDate = `${year}-${month}-${day}`;
        matchesDate = (formattedOrderDate === dateFilter);
      } else {
        matchesDate = false; 
      }
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  useEffect(() => {
    if (tableRef.current) {
      gsap.fromTo(
        tableRef.current.querySelectorAll('tr'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' }
      );
    }
  }, [statusFilter, searchQuery, orders.length]);

  const handleQuickCancelSubmit = async (e) => {
    e.preventDefault();
    if (!quickCancelOrder) return;
    await cancelOrder(quickCancelOrder.id, cancelReasonText);
    setQuickCancelOrder(null);
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Order History Archive"
        subtitle="Search completed & past orders in Indian Rupees (₹), print POS thermal receipts, and view cancellation reasons"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="relative w-full sm:w-44">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full cursor-pointer"
                  title="Clear Date"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {['All', 'Delivered', 'Cancelled', 'Out for Delivery', 'Preparing', 'Pending'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredOrders.length} historical records
          </span>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Order ID</th>
                  <th className="py-3.5 px-6">Customer & Address</th>
                  <th className="py-3.5 px-6">Date / Time</th>
                  <th className="py-3.5 px-6">Assigned Partner</th>
                  <th className="py-3.5 px-6">Total (₹)</th>
                  <th className="py-3.5 px-6">Status / Reason</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody ref={tableRef} className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No historical orders found in database.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-emerald-700">
                        {order.id}
                        {order.isNextMorningDelivery && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded w-max shadow-sm">
                            <Moon className="w-3 h-3" /> Tomorrow Morning
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800">{order.customerName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">
                          {typeof order.address === 'string' ? order.address : (typeof order.deliveryAddress === 'string' ? order.deliveryAddress : (order.deliveryAddress ? [order.deliveryAddress.street, order.deliveryAddress.city].filter(Boolean).join(', ') : 'Store Pickup'))}
                        </p>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-500 whitespace-nowrap">
                        {order.orderTime || (order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Recent Order')}
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={order.assignedPartnerId || ''}
                          onChange={(e) => assignDeliveryPartner(order.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-semibold focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">-- Unassigned --</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-900">₹{(order.totalAmount || 0).toFixed(2)}</td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <select
                            value={order.status}
                            onChange={(e) => {
                              if (e.target.value === 'Cancelled') {
                                setQuickCancelOrder(order);
                              } else if (e.target.value === 'Delivered') {
                                setAdminOtpInput('');
                                setAdminOtpError('');
                                setOtpVerifyOrder(order);
                              } else {
                                updateOrderStatus(order.id, e.target.value);
                              }
                            }}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                              order.status === 'Delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              order.status === 'Cancelled' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                              'bg-purple-50 border-purple-200 text-purple-700'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          {order.status === 'Cancelled' && order.cancelReason && (
                            <p className="text-[10px] text-rose-600 font-medium italic">
                              Reason: {order.cancelReason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintingOrder(order)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
                            title="Print Thermal Bill (POS Printer)"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => setActiveModalOrder(order)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors inline-flex items-center gap-1"
                            title="View Invoice Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* THERMAL RECEIPT PRINT MODAL */}
      {printingOrder && (
        <ThermalReceiptModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* QUICK CANCEL REASON MODAL */}
      {quickCancelOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Select Cancellation Reason</h3>
              <button onClick={() => setQuickCancelOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCancelSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason Dropdown</label>
                <select
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold"
                >
                  {cancelReasonsList.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickCancelOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {activeModalOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-600">{activeModalOrder.id}</span>
                <h3 className="text-lg font-bold text-slate-800">Order Invoice & Details</h3>
              </div>
              <button onClick={() => setActiveModalOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Customer</p>
                  <p className="font-bold text-slate-800">{activeModalOrder.customerName}</p>
                  <p className="text-slate-500">{activeModalOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Address</p>
                  <p className="font-medium text-slate-700">
                    {typeof activeModalOrder.address === 'string' ? activeModalOrder.address : (typeof activeModalOrder.deliveryAddress === 'string' ? activeModalOrder.deliveryAddress : (activeModalOrder.deliveryAddress ? [activeModalOrder.deliveryAddress.street, activeModalOrder.deliveryAddress.city].filter(Boolean).join(', ') : 'Store Pickup'))}
                  </p>
                </div>
              </div>

              {activeModalOrder.deliveryOtp && (
                <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl">
                  <p className="font-extrabold uppercase text-[10px] text-amber-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Delivery OTP
                  </p>
                  <p className="text-sm font-black text-slate-900 tracking-[0.2em] font-mono mt-0.5">
                    {activeModalOrder.deliveryOtp}
                  </p>
                </div>
              )}

              {activeModalOrder.status === 'Cancelled' && activeModalOrder.cancelReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <p className="font-bold uppercase text-[10px] text-rose-600">Cancellation Reason</p>
                  <p className="font-semibold text-xs mt-0.5">{activeModalOrder.cancelReason}</p>
                </div>
              )}

              <div>
                <p className="font-bold text-slate-700 mb-2">Order Items Breakdown</p>
                <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  {activeModalOrder.items && activeModalOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between font-medium">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-bold text-slate-800">₹{(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-emerald-600">₹{(activeModalOrder.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Partner Selection inside Modal */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Delivery Partner</label>
                <select
                  value={activeModalOrder.assignedPartnerId || ''}
                  onChange={(e) => {
                    assignDeliveryPartner(activeModalOrder.id, e.target.value);
                    setActiveModalOrder({ ...activeModalOrder, assignedPartnerId: e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Unassigned</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.vehicle})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => {
                  setPrintingOrder(activeModalOrder);
                  setActiveModalOrder(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-emerald-400" /> Print Thermal Bill
              </button>

              <button
                onClick={() => setActiveModalOrder(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN OTP VERIFICATION MODAL (Order History) */}
      {otpVerifyOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                  <Lock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Verify Delivery OTP</h3>
                  <p className="text-xs font-semibold text-slate-400">Order #{otpVerifyOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => { setOtpVerifyOrder(null); setAdminOtpInput(''); setAdminOtpError(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Enter Customer OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={adminOtpInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setAdminOtpInput(val);
                  setAdminOtpError('');
                }}
                placeholder="Enter 6-digit OTP"
                className={`w-full text-center text-2xl font-black tracking-[0.4em] py-4 px-4 rounded-2xl border-2 transition-all focus:outline-none ${
                  adminOtpError
                    ? 'border-rose-400 bg-rose-50/50 text-rose-700 focus:ring-4 focus:ring-rose-400/20'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20'
                }`}
                autoFocus
              />
              {adminOtpError && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {adminOtpError}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setOtpVerifyOrder(null); setAdminOtpInput(''); setAdminOtpError(''); }}
                disabled={adminOtpVerifying}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adminOtpInput.length !== 6 || adminOtpVerifying}
                onClick={async () => {
                  setAdminOtpVerifying(true);
                  setAdminOtpError('');
                  try {
                    if (otpVerifyOrder.deliveryOtp && adminOtpInput === otpVerifyOrder.deliveryOtp) {
                      // Mark admin OTP as verified + deliver immediately
                      await updateDoc(doc(db, 'orders', otpVerifyOrder.id), {
                        adminOtpVerified: true,
                        deliveryOtpVerified: true
                      });
                      await updateOrderStatus(otpVerifyOrder.id, 'Delivered');

                      setOtpVerifyOrder(null);
                      setAdminOtpInput('');
                    } else {
                      await updateDoc(doc(db, 'orders', otpVerifyOrder.id), {
                        otpFailedAttempts: (otpVerifyOrder.otpFailedAttempts || 0) + 1
                      });
                      setAdminOtpError(`Invalid OTP. (${(otpVerifyOrder.otpFailedAttempts || 0) + 1} failed attempts)`);
                    }
                  } catch (err) {
                    console.error('OTP verification error:', err);
                    setAdminOtpError('Verification failed. Please try again.');
                  } finally {
                    setAdminOtpVerifying(false);
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminOtpVerifying ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Verify</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
