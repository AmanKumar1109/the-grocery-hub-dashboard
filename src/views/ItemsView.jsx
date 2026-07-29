import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Filter,
  Star,
  FolderPlus,
  Tag,
  Flame,
  Gift,
  CheckSquare,
  Square,
  Percent,
  ArchiveX,
  Check,
  AlertTriangle,
  Settings,
  Loader2
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

export default function ItemsView() {
  const { items, categories, addCategory, deleteCategory, editItem, toggleItemTrending, toggleItemBogo, toggleItemVisibility, toggleItemStock, deleteItem, bulkUpdateItems } = useAdmin();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  
  // Modals state
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    price: '',
    sellingPrice: '',
    inStock: true,
    isTrending: false,
    image: ''
  });

  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [selectedCategory, searchQuery, items.length]);

  const allCategoryTabs = ['All', '🔥 Trending', ...categories];

  const filteredItems = items.filter(item => {
    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : selectedCategory === '🔥 Trending'
        ? !!item.isTrending
        : item.category === selectedCategory;
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = outOfStockOnly ? item.inStock === false : true;
    return matchesCategory && matchesSearch && matchesStock;
  });


  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (!newCategoryName.trim()) return;

    const success = await addCategory(newCategoryName);
    if (!success) {
      setCategoryError('Category already exists or is invalid.');
      return;
    }

    setSelectedCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsAddCategoryModalOpen(false);
  };

  const handleStartEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      sellingPrice: item.sellingPrice || '',
      inStock: item.inStock,
      isTrending: !!item.isTrending,
      isBogo: !!item.isBogo,
      image: item.image
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    await editItem(editingItem.id, editFormData);
    setEditingItem(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      await deleteItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Grocery Products Catalog"
        subtitle="Manage grocery categories, product listings in Indian Rupees (₹), toggle visibility (Eye/EyeOff), edit and remove products"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Top Header & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-800">Supermarket Catalog Management</h2>
            <p className="text-xs text-slate-400">View, search, filter, and manage your supermarket products</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            <button
              onClick={() => {
                setCategoryError('');
                setIsAddCategoryModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-emerald-600" /> Manage Categories
            </button>

            <Link
              to="/dashboard/items/add"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Grocery Product
            </Link>
          </div>
        </div>

        {/* Search Bar & Horizontal Category Filter Pills */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4 min-w-0">
          <div className="flex flex-col md:flex-row items-center gap-4 min-w-0">
            {/* Search Bar */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search grocery item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Category Filter Pills (Smooth scroll with overflow-x-auto min-w-0) */}
            <div className="flex items-center gap-2 overflow-x-auto min-w-0 w-full py-1 scrollbar-none">
              {allCategoryTabs.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                onClick={() => {
                  setCategoryError('');
                  setIsAddCategoryModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Create New Category"
              >
                <FolderPlus className="w-3.5 h-3.5" /> + Category
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={outOfStockOnly}
                onChange={(e) => setOutOfStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-rose-500 focus:ring-rose-500 border-slate-300"
              />
              <AlertTriangle className={`w-4 h-4 ${outOfStockOnly ? 'text-rose-500' : 'text-slate-400'}`} />
              Out of Stock
            </label>
          </div>
        </div>

        {/* Items Grid / Catalog */}
        {filteredItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No products found</h3>
            <p className="text-xs text-slate-400">
              No grocery products added in Firestore database under "{selectedCategory}". Click below to add a new product.
            </p>
            <Link
              to="/dashboard/items/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs mt-2"
            >
              <Plus className="w-4 h-4" /> Add New Grocery Product
            </Link>
          </div>
        ) : (
          <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isVisible = item.isVisible !== false;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group ${
                    !isVisible ? 'opacity-70 bg-slate-50/80 border-dashed' : ''
                  }`}
                >
                  {/* Item Image & Badges */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80'}
                      alt={item.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        !isVisible ? 'grayscale-30' : ''
                      }`}
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 font-bold text-[11px] shadow-xs">
                        {item.category || 'General'}
                      </span>

                      {/* Trending Overlay Badge */}
                      {item.isTrending && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] shadow-md flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-slate-950" /> Trending
                        </span>
                      )}

                      {/* Buy 1 Get 1 Free Overlay Badge */}
                      {item.isBogo && (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-black text-[11px] shadow-md flex items-center gap-1">
                          <Gift className="w-3 h-3 text-white" /> Buy 1 Get 1
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {/* Visibility Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs ${
                        isVisible
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}>
                        {isVisible ? 'Visible' : 'Hidden'}
                      </span>

                      {/* Stock Status Badge (Clickable One-Click Toggle) */}
                      <button
                        onClick={() => toggleItemStock(item.id, item.inStock !== false)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs transition-transform active:scale-95 cursor-pointer ${
                          item.inStock !== false
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                        title={item.inStock !== false ? 'Click to set Out of Stock' : 'Click to set In Stock'}
                      >
                        {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-700 transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 text-amber-700 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {item.rating || 5.0}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-semibold block">Price</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-extrabold text-slate-800">₹{(item.price || 0).toFixed(2)}</span>
                          {item.sellingPrice > 0 && item.sellingPrice > item.price && (
                            <span className="text-xs text-slate-400 line-through">₹{(item.sellingPrice).toFixed(2)}</span>
                          )}
                          {item.offPercentage > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100">{item.offPercentage}% OFF</span>
                          )}
                        </div>
                      </div>

                      {/* Actions: Stock Toggle, Trending Toggle, BOGO Toggle, Eye Visibility Toggle, Edit, Delete */}
                      <div className="flex items-center gap-1.5">
                        {/* Quick Trending Toggle Button */}
                        <button
                          onClick={() => toggleItemTrending(item.id, !!item.isTrending)}
                          className={`p-2 rounded-xl transition-all border cursor-pointer ${
                            item.isTrending
                              ? 'bg-amber-400 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                              : 'bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 border-slate-200'
                          }`}
                          title={item.isTrending ? 'Click to Remove Trending Label' : 'Click to Mark as Trending Product'}
                        >
                          <Flame className={`w-4 h-4 ${item.isTrending ? 'fill-slate-950' : ''}`} />
                        </button>

                        {/* Quick BOGO Toggle Button */}
                        <button
                          onClick={() => toggleItemBogo(item.id, !!item.isBogo)}
                          className={`p-2 rounded-xl transition-all border cursor-pointer ${
                            item.isBogo
                              ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-xs'
                              : 'bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border-slate-200'
                          }`}
                          title={item.isBogo ? 'Click to Remove Buy 1 Get 1 Offer' : 'Click to Mark as Buy 1 Get 1 Free Offer'}
                        >
                          <Gift className="w-4 h-4" />
                        </button>

                        {/* Quick Stock Toggle Button */}
                        <button
                          onClick={() => toggleItemStock(item.id, item.inStock !== false)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors border flex items-center gap-1 cursor-pointer ${
                            item.inStock !== false
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          }`}
                          title={item.inStock !== false ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}
                        >
                          <Package className="w-3.5 h-3.5" />
                          {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                        </button>

                        {/* Eye / EyeOff Visibility Toggle Button */}
                        <button
                          onClick={() => toggleItemVisibility(item.id, isVisible)}
                          className={`p-2 rounded-xl transition-colors ${
                            isVisible
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                          }`}
                          title={isVisible ? 'Click to Hide Item (Set Visibility False)' : 'Click to Show Item (Set Visibility True)'}
                        >
                          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                        </button>

                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MANAGE CATEGORIES MODAL */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Manage Grocery Categories</h3>
                  <p className="text-xs text-slate-400">Add new categories or delete existing categories from Firestore</p>
                </div>
              </div>
              <button onClick={() => setIsAddCategoryModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form to Add New Category */}
            <form onSubmit={handleAddCategorySubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">Add New Category *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Pasta & Noodles, Beverages..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm whitespace-nowrap"
                >
                  + Add Category
                </button>
              </div>
              {categoryError && <p className="text-xs text-rose-600 font-medium">{categoryError}</p>}
            </form>

            {/* List of Existing Categories with Delete Buttons */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Existing Categories ({categories.length})
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No categories created yet.</p>
                ) : (
                  categories.map((c) => (
                    <div
                      key={c}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-800">{c}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete category "${c}"?`)) {
                            await deleteCategory(c);
                            if (selectedCategory === c) {
                              setSelectedCategory('All');
                            }
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Delete Category "${c}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800">Edit Item Details</h2>
              <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category (Optional)</label>
                  <select
                    value={editFormData.category}
                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">General / None (No Category)</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP / Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.sellingPrice}
                    onChange={e => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 60.00"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Our Price (₹)
                  {(() => {
                    const mrp = parseFloat(editFormData.sellingPrice);
                    const sale = parseFloat(editFormData.price);
                    if (mrp > 0 && sale > 0 && mrp > sale) {
                      const pct = Math.round(((mrp - sale) / mrp) * 100);
                      return (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                          {pct}% OFF
                        </span>
                      );
                    }
                    return null;
                  })()}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editFormData.price}
                  onChange={e => setEditFormData({ ...editFormData, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 45.00"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={editFormData.image}
                  onChange={e => setEditFormData({ ...editFormData, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Availability</label>
                  <select
                    value={editFormData.inStock ? 'true' : 'false'}
                    onChange={e => setEditFormData({ ...editFormData, inStock: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                  >
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trending Tag</label>
                  <select
                    value={editFormData.isTrending ? 'true' : 'false'}
                    onChange={e => setEditFormData({ ...editFormData, isTrending: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-amber-200 rounded-xl px-2.5 py-2 text-amber-900 font-bold focus:ring-2 focus:ring-amber-400 text-xs"
                  >
                    <option value="false">Normal</option>
                    <option value="true">Trending Product</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Buy 1 Get 1</label>
                  <select
                    value={editFormData.isBogo ? 'true' : 'false'}
                    onChange={e => setEditFormData({ ...editFormData, isBogo: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-indigo-200 rounded-xl px-2.5 py-2 text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-400 text-xs"
                  >
                    <option value="false">No Offer</option>
                    <option value="true">Buy 1 Get 1 Free</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-800">Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{deletingItem.name}"</strong>? This will remove it from Firestore database.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
