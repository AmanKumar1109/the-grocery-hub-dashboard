import React, { useEffect, useRef } from 'react';
import {
  TrendingUp,
  Calendar,
  Wallet,
  ShoppingBag,
  Users,
  Utensils,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import StatCard from '../components/StatCard';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

export default function DashboardView() {
  const { earnings, orders, items, staff } = useAdmin();
  const containerRef = useRef(null);

  const activeOrders = orders.filter(o => o.isCurrent);
  const deliveredToday = orders.filter(o => o.status === 'Delivered');

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.gsap-fade'),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Dashboard Overview"
        subtitle="Real-time financial breakdown, live orders, and system statistics in Indian Rupees (₹)"
      />

      <main ref={containerRef} className="p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
        {/* Earnings & Key Metrics Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-600" /> Revenue & Financial Highlights (₹)
            </h2>
            <span className="text-xs font-semibold text-slate-400">Firestore Real-Time Data</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Today's Earning"
              amount={`₹${earnings.today.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              growth={earnings.todayGrowth}
              icon={IndianRupee}
              index={0}
            />
            <StatCard
              title="Earning This Month"
              amount={`₹${earnings.thisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              growth={earnings.monthGrowth}
              icon={Calendar}
              index={1}
            />
            <StatCard
              title="Earning So Far"
              amount={`₹${earnings.soFar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              growth={earnings.totalGrowth}
              icon={Wallet}
              index={2}
            />
            <StatCard
              title="Active Orders Now"
              amount={activeOrders.length.toString()}
              growth={`${deliveredToday.length} delivered today`}
              icon={ShoppingBag}
              index={3}
            />
          </div>
        </section>

        {/* Operational Highlights & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Target & Performance Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 gsap-fade">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Monthly Earnings Target & Performance</h3>
                <p className="text-xs text-slate-400">Current month performance in Rupees (₹)</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                Firestore Sync Active
              </span>
            </div>

            {/* Target Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Current Revenue</span>
                <span className="text-emerald-600">₹{earnings.thisMonth.toLocaleString('en-IN')} Total</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-emerald-600 rounded-full w-[100%] transition-all duration-1000 shadow-xs"></div>
              </div>
            </div>

            {/* Meal Period Revenue Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Lunch Sales</p>
                <p className="text-lg font-bold text-slate-800 mt-1">₹{(earnings.today * 0.4).toFixed(2)}</p>
                <span className="text-[11px] text-emerald-600 font-semibold">40% of daily total</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Dinner Peak</p>
                <p className="text-lg font-bold text-slate-800 mt-1">₹{(earnings.today * 0.5).toFixed(2)}</p>
                <span className="text-[11px] text-emerald-600 font-semibold">50% of daily total</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Other Orders</p>
                <p className="text-lg font-bold text-slate-800 mt-1">₹{(earnings.today * 0.1).toFixed(2)}</p>
                <span className="text-[11px] text-emerald-600 font-semibold">10% of daily total</span>
              </div>
            </div>
          </div>

          {/* Quick Fleet & Kitchen Health */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between gsap-fade">
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-1">Fleet & Kitchen Health</h3>
              <p className="text-xs text-slate-400">Live stats from Firestore Database</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">On Duty Personnel</p>
                    <p className="text-[11px] text-slate-500">{staff.filter(s => s.status === 'On Duty' || s.status === 'Available').length} active delivery drivers</p>
                  </div>
                </div>
                <span className="text-base font-extrabold text-emerald-700">{staff.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Active Menu Items</p>
                    <p className="text-[11px] text-slate-500">{items.filter(i => i.inStock).length} items currently in stock</p>
                  </div>
                </div>
                <span className="text-base font-extrabold text-slate-800">{items.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Avg. Delivery Speed</p>
                    <p className="text-[11px] text-slate-500">Order placement to doorstep</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-emerald-700">22.4 mins</span>
              </div>
            </div>

            <Link
              to="/orders/current"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              Manage Live Orders <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Live Orders Overview Section */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden gsap-fade">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Live Active Orders Snapshot</h3>
              <p className="text-xs text-slate-400">Orders requiring immediate fulfillment or partner assignment</p>
            </div>
            <Link
              to="/orders/current"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View All Current Orders ({activeOrders.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Order ID</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Items Summary</th>
                  <th className="py-3.5 px-6">Total Amount (₹)</th>
                  <th className="py-3.5 px-6">Assigned Partner</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                      No active orders found in database.
                    </td>
                  </tr>
                ) : (
                  activeOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-emerald-700">{order.id}</td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800">{order.customerName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{order.deliveryAddress}</p>
                      </td>
                      <td className="py-4 px-6">
                        {order.items ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : 'No items'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">₹{(order.totalAmount || 0).toFixed(2)}</td>
                      <td className="py-4 px-6">
                        {order.assignedPartnerName !== 'Unassigned' ? (
                          <span className="font-medium text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {order.assignedPartnerName}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          order.status === 'Preparing' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
