import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ClipboardList,
  Search,
  ShieldCheck,
  Filter,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Copy,
  Check,
  DownloadCloud,
  RotateCcw,
  Tag,
  ChevronLeft,
  ChevronRight,
  Layers,
  Calendar,
  Package,
  CalendarDays,
  X,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import * as XLSX from 'xlsx';

export default function AuditLogsView() {
  const { auditLogs } = useAdmin();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All'); // 'All' | 'today' | 'yesterday' | 'week' | 'month'
  const [specificDate, setSpecificDate] = useState(''); // 'YYYY-MM-DD'
  const [selectedProduct, setSelectedProduct] = useState('All'); // Filter by extracted product name

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Copied Log ID state for visual feedback
  const [copiedId, setCopiedId] = useState(null);

  const timelineRef = useRef(null);

  // Extract Dynamic List of Categories
  const uniqueCategories = useMemo(() => {
    const cats = new Set(auditLogs.map(l => l.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [auditLogs]);

  // Extract Dynamic List of Actions with live counts
  const uniqueActions = useMemo(() => {
    const actionMap = {};
    auditLogs.forEach(l => {
      if (l.action) {
        actionMap[l.action] = (actionMap[l.action] || 0) + 1;
      }
    });
    return Object.entries(actionMap)
      .sort((a, b) => b[1] - a[1])
      .map(([action, count]) => ({ action, count }));
  }, [auditLogs]);

  // Extract Unique Product Names from audit log details (quoted strings or product mentions)
  const uniqueProductNames = useMemo(() => {
    const prodSet = new Set();
    auditLogs.forEach(log => {
      if (log.details) {
        const matches = log.details.match(/"([^"]+)"/g);
        if (matches) {
          matches.forEach(m => {
            const clean = m.replace(/"/g, '').trim();
            if (clean && clean.length > 2 && !clean.startsWith('LOG-') && !clean.startsWith('ORD-') && !clean.startsWith('STF-')) {
              prodSet.add(clean);
            }
          });
        }
      }
    });
    return ['All', ...Array.from(prodSet).sort()];
  }, [auditLogs]);

  // Comprehensive Filter & Search Logic
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const currentMonthStr = now.toISOString().slice(0, 7);

    return auditLogs.filter(log => {
      // 1. Category Filter
      if (categoryFilter !== 'All' && log.category !== categoryFilter) {
        return false;
      }

      // 2. Action Filter
      if (actionFilter !== 'All' && log.action !== actionFilter) {
        return false;
      }

      // 3. Severity Filter
      if (severityFilter !== 'All' && log.severity !== severityFilter) {
        return false;
      }

      // 4. Product Name Filter
      if (selectedProduct !== 'All') {
        const prodMatch = (log.details || '').toLowerCase().includes(selectedProduct.toLowerCase());
        if (!prodMatch) return false;
      }

      // 5. Particular / Specific Exact Date Filter
      if (specificDate) {
        const logDateStr = log.timestamp ? log.timestamp.split(' ')[0] : '';
        if (logDateStr !== specificDate) {
          return false;
        }
      } else if (dateFilter !== 'All') {
        // Preset Date Range Filter
        const logDateStr = log.timestamp ? log.timestamp.split(' ')[0] : '';
        const logDate = new Date(log.timestamp);
        if (dateFilter === 'today' && logDateStr !== todayStr) return false;
        if (dateFilter === 'yesterday' && logDateStr !== yesterdayStr) return false;
        if (dateFilter === 'week' && logDate < sevenDaysAgo) return false;
        if (dateFilter === 'month' && (!logDateStr || !logDateStr.startsWith(currentMonthStr))) return false;
      }

      // 6. Universal Search Filter (Log ID, Product Name, Item ID, Order ID, Staff ID, Action, Details, Actor)
      if (searchQuery.trim()) {
        const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/);
        const searchableCorpus = [
          log.id || '',
          log.action || '',
          log.details || '',
          log.actor || '',
          log.category || '',
          log.severity || '',
          log.timestamp || ''
        ].join(' ').toLowerCase();

        const allTermsMatch = queryTerms.every(term => searchableCorpus.includes(term));
        if (!allTermsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    auditLogs,
    categoryFilter,
    actionFilter,
    severityFilter,
    dateFilter,
    specificDate,
    selectedProduct,
    searchQuery
  ]);

  // Reset to first page whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, actionFilter, severityFilter, dateFilter, specificDate, selectedProduct, searchQuery]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // GSAP animation on list update
  useEffect(() => {
    if (timelineRef.current && timelineRef.current.children.length > 0) {
      gsap.fromTo(
        timelineRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out' }
      );
    }
  }, [paginatedLogs, currentPage]);

  // Copy Log ID handler
  const handleCopyLogId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setActionFilter('All');
    setSeverityFilter('All');
    setDateFilter('All');
    setSpecificDate('');
    setSelectedProduct('All');
  };

  const isAnyFilterActive =
    searchQuery !== '' ||
    categoryFilter !== 'All' ||
    actionFilter !== 'All' ||
    severityFilter !== 'All' ||
    dateFilter !== 'All' ||
    specificDate !== '' ||
    selectedProduct !== 'All';

  // Export to Excel handler
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) return;

    const dataToExport = filteredLogs.map((log, index) => ({
      '#': index + 1,
      'Log ID': log.id || 'N/A',
      'Timestamp': log.timestamp || 'N/A',
      'Action': log.action || 'N/A',
      'Category': log.category || 'General',
      'Severity': log.severity || 'info',
      'Details': log.details || 'N/A',
      'Performed By': log.actor || 'Admin'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');
    XLSX.writeFile(workbook, `GroceryHub_Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Warning
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
            <XCircle className="w-3 h-3 text-rose-600" /> Danger
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
            <Info className="w-3 h-3 text-blue-600" /> Info
          </span>
        );
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="System Audit Logs"
        subtitle="Chronological timeline of catalog updates, order tracking & 9-digit traceable log IDs"
      />

      <main className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* TOP FILTER & SEARCH CONTROL CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {/* Row 1: Universal Search Bar & Action Buttons */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID (LOG / ITEM / ORD / STF), Product Name (e.g. Tomatoes), Action, Admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                </button>
              )}

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={filteredLogs.length === 0}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                title="Export filtered logs to Excel"
              >
                <DownloadCloud className="w-4 h-4 text-emerald-600" /> Export ({filteredLogs.length})
              </button>
            </div>
          </div>

          {/* Row 2: Comprehensive Multi-Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
            {/* Particular Single Date Picker */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600" /> Particular Date
                </span>
                {specificDate && (
                  <button
                    type="button"
                    onClick={() => setSpecificDate('')}
                    className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Date
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => {
                    setSpecificDate(e.target.value);
                    if (e.target.value) setDateFilter('All');
                  }}
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer ${
                    specificDate ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold' : 'border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Date Range Presets */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Date Preset
              </label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  if (e.target.value !== 'All') setSpecificDate('');
                }}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer ${
                  dateFilter !== 'All' ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Past 7 Days</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Action Event Type Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" /> Action Event ({uniqueActions.length})
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer ${
                  actionFilter !== 'All' ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Actions ({auditLogs.length})</option>
                {uniqueActions.map(({ action, count }) => (
                  <option key={action} value={action}>
                    {action} ({count})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Name Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                <Package className="w-3 h-3 text-slate-400" /> Product Name
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer ${
                  selectedProduct !== 'All' ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Products</option>
                {uniqueProductNames.filter(p => p !== 'All').map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" /> Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer ${
                  categoryFilter !== 'All' ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS & RESULTS COUNTER */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong className="text-slate-800 font-bold">{paginatedLogs.length}</strong> of{' '}
            <strong className="text-slate-800 font-bold">{filteredLogs.length}</strong> matching log events
            {isAnyFilterActive && ' (Filtered)'}
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Total recorded: {auditLogs.length}
          </span>
        </div>

        {/* AUDIT LOG TIMELINE LIST */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <p className="font-bold text-slate-700 text-sm">No audit log entries found</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAnyFilterActive
                    ? 'Try clearing the search query, selecting another date, or resetting filters.'
                    : 'Perform an action (add item, update order, assign partner) to generate audit records.'}
                </p>
              </div>
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div ref={timelineRef} className="space-y-3">
              {paginatedLogs.map((log) => {
                const isCopied = copiedId === log.id;

                return (
                  <div
                    key={log.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 transition-all border border-slate-200/70 hover:border-slate-300"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setActionFilter(log.action)}
                            className="font-bold text-slate-800 text-xs hover:text-emerald-600 transition-colors cursor-pointer text-left"
                            title={`Filter logs by action "${log.action}"`}
                          >
                            {log.action}
                          </button>
                          {getSeverityBadge(log.severity)}
                          <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600 text-[10px] font-semibold">
                            {log.category || 'General'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.details}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> Performed by: <strong className="text-slate-700">{log.actor || 'Admin'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-1 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {log.timestamp}
                      </span>

                      {/* 9-DIGIT ALPHANUMERIC LOG NUMBER BADGE WITH CLICK TO COPY */}
                      <button
                        type="button"
                        onClick={() => handleCopyLogId(log.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                        title="Click to copy 9-digit Log Number"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>{log.id}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
