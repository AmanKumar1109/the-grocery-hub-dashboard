import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList,
  Search,
  ShieldCheck,
  Filter,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import gsap from 'gsap';

export default function AuditLogsView() {
  const { auditLogs } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const timelineRef = useRef(null);

  const filteredLogs = auditLogs.filter(log => {
    const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.actor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (timelineRef.current) {
      gsap.fromTo(
        timelineRef.current.children,
        { opacity: 0, x: -15 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [categoryFilter, searchQuery]);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'success':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">Success</span>;
      case 'warning':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">Warning</span>;
      case 'danger':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">Danger</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">Info</span>;
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="System Audit Logs"
        subtitle="Complete chronological timeline of administrative actions, menu changes, and order status updates"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Search & Category Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search logs, actions, admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {['All', 'Orders', 'Catalog', 'Staff'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {filteredLogs.length} activity events recorded
          </span>
        </div>

        {/* Audit Log Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No audit log entries found</p>
              <p className="text-xs">Perform an action (add item, update order, assign partner) to generate logs.</p>
            </div>
          ) : (
            <div ref={timelineRef} className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-xs">{log.action}</span>
                        {getSeverityBadge(log.severity)}
                        <span className="text-[11px] font-semibold text-slate-400">Category: {log.category}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{log.details}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> Performed by: <strong className="text-slate-700">{log.actor}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {log.timestamp}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{log.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
