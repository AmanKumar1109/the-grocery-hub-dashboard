import React, { useState, useEffect, useRef } from 'react';
import {
  UtensilsCrossed,
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
  Tag
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

export default function ItemsView() {
  const { items, categories, addCategory, editItem, toggleItemVisibility, deleteItem } = useAdmin();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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
    inStock: true,
    description: '',
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

  const allCategoryTabs = ['All', ...categories];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
      inStock: item.inStock,
      description: item.description,
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
        title="Food Items Catalog"
        subtitle="Manage food categories, item listings in Indian Rupees (₹), toggle visibility (Eye/EyeOff), edit and remove items"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto flex-1">
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search food item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category Pills + Add Category Button */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none flex-1">
              {allCategoryTabs.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {/* Add Category Trigger Button */}
              <button
                onClick={() => {
                  setCategoryError('');
                  setIsAddCategoryModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 transition-colors"
                title="Create New Category"
              >
                <FolderPlus className="w-3.5 h-3.5" /> + Category
              </button>
            </div>
          </div>

          {/* Action Buttons: Add Item & Add Category */}
          <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
            <button
              onClick={() => {
                setCategoryError('');
                setIsAddCategoryModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-emerald-600" /> Add Category
            </button>

            <Link
              to="/items/add"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Food Item
            </Link>
          </div>
        </div>

        {/* Items Grid / Catalog */}
        {filteredItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No items found</h3>
            <p className="text-xs text-slate-400">
              No food items added in Firestore database under "{selectedCategory}". Click below to add a new food item.
            </p>
            <Link
              to="/items/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs mt-2"
            >
              <Plus className="w-4 h-4" /> Add New Food Item
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
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 font-bold text-[11px] shadow-xs">
                        {item.category}
                      </span>
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

                      {/* Stock Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs ${
                        item.inStock
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-500 text-white'
                      }`}>
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
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
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-semibold block">Price</span>
                        <span className="text-lg font-extrabold text-slate-800">₹{(item.price || 0).toFixed(2)}</span>
                      </div>

                      {/* Actions: Eye Visibility Toggle, Edit, Delete */}
                      <div className="flex items-center gap-1.5">
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

      {/* ADD CATEGORY MODAL */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Add New Category</h3>
                  <p className="text-xs text-slate-400">Create a new food category in Firestore</p>
                </div>
              </div>
              <button onClick={() => setIsAddCategoryModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pasta & Noodles"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
                {categoryError && <p className="text-xs text-rose-600 font-medium mt-1">{categoryError}</p>}
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">Existing Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <span key={c} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
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
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.price}
                    onChange={e => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
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

              <div>
                <label className="font-bold text-slate-700 block mb-1">Stock Availability</label>
                <select
                  value={editFormData.inStock ? 'true' : 'false'}
                  onChange={e => setEditFormData({ ...editFormData, inStock: e.target.value === 'true' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                ></textarea>
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
              <h3 className="text-base font-bold text-slate-800">Delete Menu Item?</h3>
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
