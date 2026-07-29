import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareWarning,
  Search,
  Filter,
  Phone,
  User,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Trash2,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  Package,
  CreditCard,
  Bug,
  Sparkles
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import gsap from 'gsap';

export default function ComplaintsView() {
  const { complaints, updateComplaintStatus, deleteComplaint } = useAdmin();
  const containerRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.gsap-fade'),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, []);

  // Issue Types mapping
  const issueTypesMap = {
    delivery: { label: 'Delivery Issue', icon: ShoppingBag, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    quality: { label: 'Product Quality', icon: Package, color: 'bg-rose-50 text-rose-700 border-rose-200' },
    missing: { label: 'Missing Items', icon: AlertTriangle, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    payment: { label: 'Payment / Refund', icon: CreditCard, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    app_bug: { label: 'App Technical Bug', icon: Bug, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    other: { label: 'General / Other', icon: HelpCircle, color: 'bg-slate-50 text-slate-700 border-slate-200' }
  };

  // Status mapping
  const statusMap = {
    pending: { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: RefreshCw },
    resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    dismissed: { label: 'Dismissed', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle }
  };

  // Stats
  const pendingCount = complaints.filter(c => c.status === 'pending' || !c.status).length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const totalCount = complaints.length;

  // Filtered List
  const filteredComplaints = complaints.filter((c) => {
    const statusMatch = statusFilter === 'all' || (c.status || 'pending') === statusFilter;
    const issueMatch = issueFilter === 'all' || c.issueType === issueFilter;

    const term = searchTerm.toLowerCase().trim();
    const searchMatch =
      !term ||
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.orderId && c.orderId.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term));

    return statusMatch && issueMatch && searchMatch;
  });

  const getTimeMs = (val) => {
    if (!val) return 0;
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    if (typeof val === 'string') return new Date(val).getTime() || 0;
    if (val instanceof Date) return val.getTime();
    return 0;
  };

  const formatTimeWithRelative = (timestamp) => {
    const ms = getTimeMs(timestamp);
    if (!ms) return { exact: 'Recent', relative: 'Just now' };

    const date = new Date(ms);
    const exact = date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - ms) / 1000));
    let relative = '';
    if (diffSec < 60) relative = 'Just now';
    else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)} mins ago`;
    else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)} hrs ago`;
    else relative = `${Math.floor(diffSec / 86400)} days ago`;

    return { exact, relative };
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Customer Complaints & Support"
        subtitle="Review, track, and resolve user-reported issues, order disputes & feedback"
      />

      <main ref={containerRef} className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Stat Cards Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gsap-fade">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Reports</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{totalCount}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between gsap-fade">
            <div>
              <p className="text-xs font-semibold text-amber-600">Pending Review</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between gsap-fade">
            <div>
              <p className="text-xs font-semibold text-blue-600">In Investigation</p>
              <p className="text-2xl font-black text-blue-700 mt-1">{inProgressCount}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between gsap-fade">
            <div>
              <p className="text-xs font-semibold text-emerald-600">Resolved Complaints</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 gsap-fade">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer name, phone, order ID, or issue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="all">All Statuses ({totalCount})</option>
                  <option value="pending">Pending ({pendingCount})</option>
                  <option value="in_progress">In Progress ({inProgressCount})</option>
                  <option value="resolved">Resolved ({resolvedCount})</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:w-48">
                <select
                  value={issueFilter}
                  onChange={(e) => setIssueFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="all">All Issue Types</option>
                  <option value="delivery">Delivery Issues</option>
                  <option value="quality">Product Quality</option>
                  <option value="missing">Missing Items</option>
                  <option value="payment">Payment & Refunds</option>
                  <option value="app_bug">App Bugs</option>
                  <option value="other">Other / Custom</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Complaints Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden gsap-fade">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-emerald-600" />
              Customer Support Queue ({filteredComplaints.length})
            </h3>
            <span className="text-xs font-semibold text-slate-400">Live Sync from Firestore</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Customer & Phone</th>
                  <th className="py-3.5 px-6">Issue Category</th>
                  <th className="py-3.5 px-6">Order Ref</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">No complaints found</p>
                        <p className="text-slate-400 text-xs">
                          {searchTerm || statusFilter !== 'all' || issueFilter !== 'all'
                            ? 'Try adjusting your search query or filters.'
                            : 'Great job! There are currently no customer complaints in the database.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((item) => {
                    const currentStatusKey = item.status || 'pending';
                    const statusObj = statusMap[currentStatusKey] || statusMap.pending;
                    const issueObj = issueTypesMap[item.issueType] || issueTypesMap.other;
                    const IssueIcon = issueObj.icon;
                    const StatusIcon = statusObj.icon;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Customer & Phone */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                              {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{item.name || 'Anonymous User'}</p>
                              <a
                                href={`tel:${item.phone}`}
                                className="text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-medium text-[11px] transition-colors"
                              >
                                <Phone className="w-3 h-3 text-slate-400" /> {item.phone || 'N/A'}
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Issue Category */}
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${issueObj.color}`}>
                            <IssueIcon className="w-3.5 h-3.5" />
                            {issueObj.label}
                          </span>
                        </td>

                        {/* Order Ref */}
                        <td className="py-4 px-6 font-semibold">
                          {item.orderId ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {item.orderId}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Not Provided</span>
                          )}
                        </td>

                        {/* Description Preview */}
                        <td className="py-4 px-6 max-w-xs">
                          <p className="text-slate-700 line-clamp-2 text-xs leading-relaxed">
                            {item.description || 'No description provided.'}
                          </p>
                        </td>

                        {/* Date & Timing */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {formatTimeWithRelative(item.createdAt).exact}
                          </p>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {formatTimeWithRelative(item.createdAt).relative}
                          </span>
                        </td>

                        {/* Status Select */}
                        <td className="py-4 px-6">
                          <div className="relative inline-block">
                            <select
                              value={currentStatusKey}
                              onChange={(e) => updateComplaintStatus(item.id, e.target.value)}
                              className={`appearance-none font-bold text-[11px] px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${statusObj.color}`}
                            >
                              <option value="pending">⏳ Pending Review</option>
                              <option value="in_progress">🔄 In Progress</option>
                              <option value="resolved">✅ Resolved</option>
                              <option value="dismissed">❌ Dismissed</option>
                            </select>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedComplaint(item)}
                              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="View Full Complaint Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this complaint record?')) {
                                  deleteComplaint(item.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Complaint"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Complaint Details
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  {selectedComplaint.name || 'Customer Feedback'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setReplyText('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-slate-400 font-semibold mb-0.5">Phone Number</p>
                  <a href={`tel:${selectedComplaint.phone}`} className="font-bold text-slate-800 text-sm hover:text-emerald-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> {selectedComplaint.phone || 'N/A'}
                  </a>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold mb-0.5">Order ID</p>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedComplaint.orderId || 'Not Provided'}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-amber-800">Submitted On</p>
                  <p className="font-bold text-slate-900 text-xs">
                    {formatTimeWithRelative(selectedComplaint.createdAt).exact}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-200/60 px-2.5 py-1 rounded-full">
                  {formatTimeWithRelative(selectedComplaint.createdAt).relative}
                </span>
              </div>

              <div>
                <p className="text-slate-400 font-semibold mb-1">Issue Category</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs bg-slate-100 text-slate-800">
                  {issueTypesMap[selectedComplaint.issueType]?.label || 'General Issue'}
                </span>
              </div>

              <div>
                <p className="text-slate-400 font-semibold mb-1">Description from Customer</p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedComplaint.description || 'No description provided.'}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 font-semibold mb-1">Admin Reply (Optional)</p>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={selectedComplaint.adminReply || "Write a message to the customer..."}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none h-24"
                  />
                </div>

                <div>
                  <p className="text-slate-400 font-semibold mb-1">Update Resolution Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        updateComplaintStatus(selectedComplaint.id, 'in_progress', replyText || selectedComplaint.adminReply || null);
                        setSelectedComplaint(prev => ({ ...prev, status: 'in_progress', adminReply: replyText || prev.adminReply }));
                        setReplyText('');
                      }}
                      className={`py-2 px-3 rounded-xl font-bold border text-xs transition-all ${
                        selectedComplaint.status === 'in_progress'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => {
                        updateComplaintStatus(selectedComplaint.id, 'resolved', replyText || selectedComplaint.adminReply || null);
                        setSelectedComplaint(prev => ({ ...prev, status: 'resolved', adminReply: replyText || prev.adminReply }));
                        setReplyText('');
                      }}
                      className={`py-2 px-3 rounded-xl font-bold border text-xs transition-all ${
                        selectedComplaint.status === 'resolved'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setReplyText('');
                }}
                className="py-2.5 px-6 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
