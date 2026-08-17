import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Edit2,
  Check,
  DownloadCloud,
  Package,
  Layers,
  Clock,
  Copy,
  X,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  CalendarDays,
  RotateCcw
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import ImageUploadInput from '../components/ImageUploadInput';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function CompareLogsView() {
  const { auditLogs, items, categories, categoryDocs, addItem } = useAdmin();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('missing'); // Default to 'missing' so only lost products are shown!
  const [dateFilter, setDateFilter] = useState('All'); // 'All' | 'today' | '5days' | '7days' | '10days' | '30days'
  const [specificDate, setSpecificDate] = useState(''); // 'YYYY-MM-DD'

  // Restoration States
  const [restoringId, setRestoringId] = useState(null);
  const [isBulkRestoring, setIsBulkRestoring] = useState(false);
  const [restoredSuccessMap, setRestoredSuccessMap] = useState({});
  const [editingRecoverItem, setEditingRecoverItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Helper to safely extract milliseconds from any date/timestamp format
  const getTimeMs = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (val instanceof Date) return val.getTime();
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    if (typeof val === 'string') {
      const clean = val.includes(' ') ? val.replace(' ', 'T') : val;
      const ms = new Date(clean).getTime();
      if (!isNaN(ms)) return ms;
      const directMs = new Date(val).getTime();
      if (!isNaN(directMs)) return directMs;
    }
    return 0;
  };

  // -------------------------------------------------------------
  // LOG COMPARISON ALGORITHM
  // Cross-references historical audit logs with live items in Firestore
  // Strictly compares ITEM_CREATED actions
  // -------------------------------------------------------------
  const allAuditedProducts = useMemo(() => {
    const map = new Map();

    auditLogs.forEach(log => {
      // Strictly compare only against logs where action is 'ITEM_CREATED'
      if (log.action !== 'ITEM_CREATED' || !log.details) return;

      // 1. Extract Item ID (if stored in log doc or within details)
      let logItemId = log.itemId || '';
      if (!logItemId && log.details) {
        const idMatch = log.details.match(/ITEM-[A-Z0-9-]+/i);
        if (idMatch) logItemId = idMatch[0];
      }

      // 2. Extract Product Name
      let productName = '';
      const quoteMatch = log.details.match(/"([^"]+)"/);
      if (quoteMatch && quoteMatch[1]) {
        productName = quoteMatch[1].trim();
      } else if (log.itemName || log.name) {
        productName = (log.itemName || log.name).trim();
      }

      if (!productName || productName.startsWith('STF-') || productName.startsWith('LOG-') || categories.includes(productName)) {
        return;
      }

      const normName = productName.toLowerCase();

      // Extract MRP & Sale Price
      let mrp = 0;
      let salePrice = 0;

      const mrpMatch = log.details.match(/MRP:\s*₹?\s*([\d.]+)/i);
      if (mrpMatch && mrpMatch[1]) {
        mrp = parseFloat(mrpMatch[1]) || 0;
      }

      const saleMatch = log.details.match(/Sale:\s*₹?\s*([\d.]+)/i) || log.details.match(/Price:\s*₹?\s*([\d.]+)/i);
      if (saleMatch && saleMatch[1]) {
        salePrice = parseFloat(saleMatch[1]) || 0;
      } else if (mrp > 0) {
        salePrice = mrp;
      }

      // Extract Unit
      let unit = '';
      const unitMatch = log.details.match(/Unit:\s*([^,\)]+)/i) || productName.match(/\(([^)]+)\)$/);
      if (unitMatch && unitMatch[1]) {
        unit = unitMatch[1].trim();
      }

      // Extract Category
      let category = log.category && log.category !== 'Catalog' ? log.category : 'General';
      const existingCat = categories.find(c => c.toLowerCase() === category.toLowerCase());
      if (existingCat) category = existingCat;

      // Extract Origin Image URL directly from the audit log or details
      let originImage =
        log.image ||
        log.imageUrl ||
        log.productImage ||
        log.itemData?.image ||
        log.meta?.image ||
        '';

      // If not in direct fields, search for image URL in log.details or metadata
      if (!originImage && log.details) {
        const urlMatch = log.details.match(/(https?:\/\/[^\s"'\)]+\.(?:jpg|jpeg|png|webp|avif|gif|svg))/i) ||
                         log.details.match(/(https?:\/\/firebasestorage\.googleapis\.com[^\s"'\)]+)/i) ||
                         log.details.match(/(https?:\/\/res\.cloudinary\.com[^\s"'\)]+)/i);
        if (urlMatch && urlMatch[1]) {
          originImage = urlMatch[1];
        }
      }

      // Check if another catalog item with same name has an image
      if (!originImage) {
        const matchingCatalogItem = items.find(
          i => (i.name || '').toLowerCase().trim() === normName && i.image
        );
        if (matchingCatalogItem) {
          originImage = matchingCatalogItem.image;
        }
      }

      // Check existence in live Firestore catalog by Item ID and/or Name
      const liveItem = items.find(i => {
        const matchesId = logItemId && i.id && i.id.toLowerCase() === logItemId.toLowerCase();
        const matchesName = (i.name || '').toLowerCase().trim() === normName;
        return matchesId || matchesName;
      });

      const isMissing = !liveItem;
      const logMs = getTimeMs(log.timestamp);

      if (!map.has(normName) || logMs > (map.get(normName).lastLogMs || 0)) {
        map.set(normName, {
          id: logItemId || `RECOVER-${normName.replace(/[^a-z0-9]/g, '-').slice(0, 16)}`,
          originalItemId: logItemId || null,
          name: productName,
          sellingPrice: mrp > 0 ? String(mrp) : '60',
          price: salePrice > 0 ? String(salePrice) : (mrp > 0 ? String(mrp) : '45'),
          category: category || 'General',
          subcategory: log.subcategory || '',
          unit: unit || '1 pc',
          image: originImage || '',
          isMissing,
          liveItemId: liveItem?.id || null,
          lastLogId: log.id || 'N/A',
          lastLogAction: log.action || 'ITEM_CREATED',
          lastLogDate: log.timestamp || 'Recent',
          lastLogMs: logMs,
          rawDetails: log.details
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Sort missing items first, then by timestamp descending
      if (a.isMissing && !b.isMissing) return -1;
      if (!a.isMissing && b.isMissing) return 1;
      return (b.lastLogMs || 0) - (a.lastLogMs || 0);
    });
  }, [auditLogs, items, categories]);

  // Missing Products List Only
  const missingProductsList = useMemo(() => {
    return allAuditedProducts.filter(p => p.isMissing);
  }, [allAuditedProducts]);

  // Filtered List based on Search & Selectors & Date Range
  const filteredProducts = useMemo(() => {
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startOfTodayMs = new Date().setHours(0, 0, 0, 0);

    const fiveDaysAgoMs = nowMs - (5 * oneDayMs);
    const sevenDaysAgoMs = nowMs - (7 * oneDayMs);
    const tenDaysAgoMs = nowMs - (10 * oneDayMs);
    const thirtyDaysAgoMs = nowMs - (30 * oneDayMs);

    return allAuditedProducts.filter(p => {
      // 1. Category filter
      if (categoryFilter !== 'All' && p.category !== categoryFilter) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === 'missing' && !p.isMissing) return false;
      if (statusFilter === 'synced' && p.isMissing) return false;

      // 3. Date Range / Specific Date filter
      if (specificDate) {
        const logDateStr = p.lastLogDate ? p.lastLogDate.split(' ')[0] : '';
        if (logDateStr !== specificDate) return false;
      } else if (dateFilter !== 'All') {
        const pMs = p.lastLogMs || getTimeMs(p.lastLogDate);
        if (!pMs) return false;

        if (dateFilter === 'today' && pMs < startOfTodayMs) return false;
        if (dateFilter === '5days' && pMs < fiveDaysAgoMs) return false;
        if (dateFilter === '7days' && pMs < sevenDaysAgoMs) return false;
        if (dateFilter === '10days' && pMs < tenDaysAgoMs) return false;
        if (dateFilter === '30days' && pMs < thirtyDaysAgoMs) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        const matchesLog = p.lastLogId.toLowerCase().includes(q);
        const matchesLiveId = p.liveItemId ? p.liveItemId.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCat && !matchesLog && !matchesLiveId) return false;
      }

      return true;
    });
  }, [allAuditedProducts, categoryFilter, statusFilter, dateFilter, specificDate, searchQuery]);

  // Single Product Restore Handler
  const handleRestoreProduct = async (productToRestore) => {
    if (!productToRestore) return;
    setRestoringId(productToRestore.id);
    try {
      await addItem({
        name: productToRestore.name.trim(),
        sellingPrice: productToRestore.sellingPrice || '60',
        price: productToRestore.price || productToRestore.sellingPrice || '45',
        category: productToRestore.category || 'General',
        subcategory: productToRestore.subcategory || '',
        unit: productToRestore.unit || '',
        image: productToRestore.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
        inStock: true,
        isTrending: false,
        isBogo: false,
        recentBuyers: 0
      });

      setRestoredSuccessMap(prev => ({ ...prev, [productToRestore.name]: true }));
      if (editingRecoverItem) setEditingRecoverItem(null);
    } catch (err) {
      console.error("Error restoring product:", err);
    } finally {
      setRestoringId(null);
    }
  };

  // Bulk Restore All Missing Products Handler
  const handleRestoreAllMissing = async () => {
    if (missingProductsList.length === 0) return;
    setIsBulkRestoring(true);
    try {
      for (const prod of missingProductsList) {
        await addItem({
          name: prod.name.trim(),
          sellingPrice: prod.sellingPrice || '60',
          price: prod.price || prod.sellingPrice || '45',
          category: prod.category || 'General',
          subcategory: prod.subcategory || '',
          unit: prod.unit || '',
          image: prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
          inStock: true,
          isTrending: false,
          isBogo: false,
          recentBuyers: 0
        });
        setRestoredSuccessMap(prev => ({ ...prev, [prod.name]: true }));
      }
    } catch (err) {
      console.error("Bulk restore error:", err);
    } finally {
      setIsBulkRestoring(false);
    }
  };

  // Copy Log ID handler
  const handleCopyLogId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset all active filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStatusFilter('missing');
    setDateFilter('All');
    setSpecificDate('');
  };

  const isAnyFilterActive =
    searchQuery !== '' ||
    categoryFilter !== 'All' ||
    statusFilter !== 'missing' ||
    dateFilter !== 'All' ||
    specificDate !== '';

  // Export to Excel handler
  const handleExportExcel = () => {
    if (filteredProducts.length === 0) return;

    const dataToExport = filteredProducts.map((p, index) => ({
      '#': index + 1,
      'Product Name': p.name,
      'Status': p.isMissing ? 'Missing from Catalog' : 'Active in Catalog',
      'Category': p.category,
      'Unit': p.unit || 'N/A',
      'MRP (₹)': parseFloat(p.sellingPrice).toFixed(2),
      'Sale Price (₹)': parseFloat(p.price).toFixed(2),
      'Live Catalog ID': p.liveItemId || 'None (Missing)',
      'Last Audit Log ID': p.lastLogId,
      'Last Recorded Date': p.lastLogDate
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Log Comparison Report');
    XLSX.writeFile(workbook, `GroceryHub_Compare_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Compare Logs & Product Recovery"
        subtitle="Real-time reconciliation of historical 'ITEM_CREATED' audit logs with active Firestore grocery catalog"
      />

      <main className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* TOP SUMMARY KPI STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Item Created Events</span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{auditLogs.filter(l => l.action === 'ITEM_CREATED').length}</p>
            <p className="text-[11px] text-slate-400">Historical product creation records</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active Catalog</span>
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{items.length}</p>
            <p className="text-[11px] text-slate-400">Products live in Firestore database</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-1 bg-amber-50/30">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-bold uppercase tracking-wider">Missing Products</span>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900">{missingProductsList.length}</p>
            <p className="text-[11px] text-amber-700 font-semibold">Detected from ITEM_CREATED logs</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-1 bg-emerald-50/30">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Catalog Health</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-900">
              {allAuditedProducts.length > 0
                ? `${Math.round(((allAuditedProducts.length - missingProductsList.length) / allAuditedProducts.length) * 100)}%`
                : '100%'}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold">Reconciliation Match Rate</p>
          </div>
        </div>

        {/* SEARCH & CONTROLS CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product name, category, log ID, live ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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

              {missingProductsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreAllMissing}
                  disabled={isBulkRestoring}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isBulkRestoring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Restoring Catalog...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Restore All ({missingProductsList.length}) Missing</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={filteredProducts.length === 0}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4 text-emerald-600" /> Export Excel ({filteredProducts.length})
              </button>
            </div>
          </div>

          {/* Filter Pills / Dropdowns: Status, Date Range (5, 7, 10 days), Particular Date, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            {/* 1. Status Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-400" /> Comparison Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer ${
                  statusFilter !== 'All' ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Products ({allAuditedProducts.length})</option>
                <option value="missing">⚠️ Missing Only ({missingProductsList.length})</option>
                <option value="synced">✅ Synced Only ({allAuditedProducts.length - missingProductsList.length})</option>
              </select>
            </div>

            {/* 2. Date Range Filter (5 Days, 7 Days, 10 Days, 30 Days) */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Date Range Filter
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
                <option value="5days">Last 5 Days</option>
                <option value="7days">Last 7 Days</option>
                <option value="10days">Last 10 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {/* 3. Particular Date Picker */}
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

            {/* 4. Category Filter */}
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
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIVE FILTER BADGES */}
          {isAnyFilterActive && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400">Active Filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-emerald-900">✕</button>
                </span>
              )}
              {statusFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg">
                  Status: {statusFilter === 'missing' ? 'Missing Only' : 'Synced Only'}
                  <button onClick={() => setStatusFilter('All')} className="hover:text-emerald-900">✕</button>
                </span>
              )}
              {dateFilter !== 'All' && !specificDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg">
                  Date: {dateFilter === '5days' ? 'Last 5 Days' : dateFilter === '7days' ? 'Last 7 Days' : dateFilter === '10days' ? 'Last 10 Days' : dateFilter === '30days' ? 'Last 30 Days' : 'Today'}
                  <button onClick={() => setDateFilter('All')} className="hover:text-emerald-900">✕</button>
                </span>
              )}
              {specificDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg">
                  Date: {specificDate}
                  <button onClick={() => setSpecificDate('')} className="hover:text-emerald-900">✕</button>
                </span>
              )}
              {categoryFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg">
                  Category: {categoryFilter}
                  <button onClick={() => setCategoryFilter('All')} className="hover:text-emerald-900">✕</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* COMPARISON RESULTS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Database className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <p className="font-bold text-slate-700 text-sm">No products found for this filter</p>
                <p className="text-xs text-slate-400 mt-0.5">Try resetting search query, date range or status filter.</p>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 min-w-[70px]">Image</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Product Name & Status</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Category</th>
                    <th className="py-3.5 px-4 min-w-[90px]">Unit</th>
                    <th className="py-3.5 px-3 min-w-[90px]">MRP (₹)</th>
                    <th className="py-3.5 px-3 min-w-[90px]">Price (₹)</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Log Reference</th>
                    <th className="py-3.5 px-4 min-w-[170px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod, index) => {
                    const isRestoring = restoringId === prod.id;
                    const isRestored = restoredSuccessMap[prod.name];
                    const isCopied = copiedId === prod.lastLogId;

                    return (
                      <tr
                        key={prod.id}
                        className={`transition-colors ${
                          prod.isMissing ? 'bg-amber-50/25 hover:bg-amber-50/50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>

                        {/* Image */}
                        <td className="py-3.5 px-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextElementSibling) {
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              style={{ display: prod.image ? 'none' : 'flex' }}
                              className="w-full h-full items-center justify-center bg-slate-100 text-slate-400"
                            >
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          </div>
                        </td>

                        {/* Name & Status */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 text-[13px] block">{prod.name}</span>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {prod.originalItemId && (
                              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                ID: {prod.originalItemId}
                              </span>
                            )}
                            {prod.isMissing ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Missing from Catalog
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                                <Check className="w-3 h-3 text-emerald-600" /> Live in Catalog ({prod.liveItemId})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 text-[11px] border border-slate-200/60">
                            {prod.category}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                          {prod.unit || '1 pc'}
                        </td>

                        {/* MRP */}
                        <td className="py-3.5 px-3 font-semibold text-slate-500">
                          ₹{parseFloat(prod.sellingPrice).toFixed(2)}
                        </td>

                        {/* Our Price */}
                        <td className="py-3.5 px-3 font-black text-slate-900">
                          ₹{parseFloat(prod.price).toFixed(2)}
                        </td>

                        {/* Last Log ID & Date */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleCopyLogId(prod.lastLogId)}
                            className="font-mono text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Click to copy Log ID"
                          >
                            <span>{prod.lastLogId}</span>
                            {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
                          </button>
                          <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {prod.lastLogDate}
                          </span>
                        </td>

                        {/* Action / Restore */}
                        <td className="py-3.5 px-4 text-right">
                          {prod.isMissing ? (
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit Modal Button */}
                              <button
                                type="button"
                                onClick={() => setEditingRecoverItem(prod)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                title="Edit details before re-uploading"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Re-Upload / Restore Button */}
                              <button
                                type="button"
                                onClick={() => handleRestoreProduct(prod)}
                                disabled={isRestoring || isRestored}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isRestored
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                {isRestoring ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : isRestored ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Restored!</span>
                                  </>
                                ) : (
                                  <>
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>+ Re-Upload</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                              <Check className="w-4 h-4" /> Active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* EDIT & RESTORE MODAL */}
      {editingRecoverItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Review & Re-Upload Product</h3>
                <p className="text-xs text-slate-400">Verify extracted details from log before saving to Firestore catalog</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecoverItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRestoreProduct(editingRecoverItem);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editingRecoverItem.name}
                  onChange={(e) => setEditingRecoverItem({ ...editingRecoverItem, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingRecoverItem.category}
                    onChange={(e) => setEditingRecoverItem({ ...editingRecoverItem, category: e.target.value, subcategory: '' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="General">General</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subcategory</label>
                  <select
                    value={editingRecoverItem.subcategory || ''}
                    onChange={(e) => setEditingRecoverItem({ ...editingRecoverItem, subcategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">None</option>
                    {categoryDocs.find(c => c.name === editingRecoverItem.category)?.subcategories?.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingRecoverItem.sellingPrice}
                    onChange={(e) => setEditingRecoverItem({ ...editingRecoverItem, sellingPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Our Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingRecoverItem.price}
                    onChange={(e) => setEditingRecoverItem({ ...editingRecoverItem, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit / Quantity</label>
                  <input
                    type="text"
                    value={editingRecoverItem.unit}
                    placeholder="e.g. 1 kg, 500g"
                    onChange={(e) => setEditingRecoverItem({ ...editingRecoverItem, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <ImageUploadInput
                  label="Product Image (Upload or Paste URL)"
                  value={editingRecoverItem.image}
                  onChange={(newUrl) => setEditingRecoverItem(prev => ({ ...prev, image: newUrl }))}
                  folder="products"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecoverItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restoringId === editingRecoverItem.id}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {restoringId === editingRecoverItem.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Product...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Re-Upload Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
