import React, { useState } from 'react';
import { PlusCircle, Package, ArrowLeft, Image as ImageIcon, Check, FolderPlus, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import { useNavigate, Link } from 'react-router-dom';

export default function AddItemView() {
  const { categories, addCategory, addItem } = useAdmin();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    sellingPrice: '',
    inStock: true,
    isTrending: false,
    isBogo: false,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80'
  });

  // Calculate off percentage live
  const offPercentage = (() => {
    const mrp = parseFloat(formData.sellingPrice);
    const sale = parseFloat(formData.price);
    if (mrp > 0 && sale > 0 && mrp > sale) {
      return Math.round(((mrp - sale) / mrp) * 100);
    }
    return null;
  })();

  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catErr, setCatErr] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCatErr('');
    if (!newCatName.trim()) return;

    const ok = await addCategory(newCatName.trim());
    if (!ok) {
      setCatErr('Category already exists or is invalid.');
      return;
    }

    setFormData(prev => ({ ...prev, category: newCatName.trim() }));
    setNewCatName('');
    setIsAddCatModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.sellingPrice) return;

    try {
      setIsSubmitting(true);
      await addItem({
        ...formData,
        category: formData.category.trim() || 'General'
      });
      setSuccessMsg(true);
      setTimeout(() => {
        navigate('/dashboard/items');
      }, 1200);
    } catch (err) {
      console.error("Error adding item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Add New Grocery Product"
        subtitle="Create a new entry in your grocery catalog in Indian Rupees (₹)"
      />

      <main className="p-8 max-w-4xl w-full mx-auto flex-1 space-y-6">
        <Link
          to="/items"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Grocery Catalog
        </Link>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Grocery Product Saved Successfully!</p>
              <p className="text-xs text-emerald-600">Redirecting to grocery catalog...</p>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Grocery Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Organic Tomatoes"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Category Dropdown & Quick Add Button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Category (Optional)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCatErr('');
                      setIsAddCatModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> + New Category
                  </button>
                </div>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">General / None (No Category)</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Selling Price / MRP */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">MRP / Selling Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 60.00 (original MRP)"
                  value={formData.sellingPrice}
                  onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Discounted / Our Price */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Our Price (₹) *
                  {offPercentage !== null && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                      {offPercentage}% OFF
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 45.00 (discounted price)"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {parseFloat(formData.price) >= parseFloat(formData.sellingPrice) && formData.price && formData.sellingPrice && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">⚠ Our price must be less than MRP for a discount.</p>
                )}
              </div>

              {/* Stock Status Availability Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Stock Availability *</label>
                <select
                  value={formData.inStock ? 'true' : 'false'}
                  onChange={e => setFormData({ ...formData, inStock: e.target.value === 'true' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="true">In Stock (Available)</option>
                  <option value="false">Out of Stock (Unavailable)</option>
                </select>
              </div>

              {/* Trending Product Toggle Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1">
                  Trending Status
                </label>
                <select
                  value={formData.isTrending ? 'true' : 'false'}
                  onChange={e => setFormData({ ...formData, isTrending: e.target.value === 'true' })}
                  className="w-full bg-slate-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="false">Normal Product (Standard)</option>
                  <option value="true">Mark as Trending Product</option>
                </select>
              </div>

              {/* Buy 1 Get 1 Free Offer Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1">
                  Buy 1 Get 1 Free Offer
                </label>
                <select
                  value={formData.isBogo ? 'true' : 'false'}
                  onChange={e => setFormData({ ...formData, isBogo: e.target.value === 'true' })}
                  className="w-full bg-slate-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                >
                  <option value="false">Standard Single Item</option>
                  <option value="true">Buy 1 Get 1 Free Offer</option>
                </select>
              </div>

            {/* Custom Image URL */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Image URL *</label>
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/..."
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/dashboard/items')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                {isSubmitting ? 'Saving Product...' : 'Save Product To Catalog'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* QUICK ADD CATEGORY MODAL */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Add New Category</h3>
              <button onClick={() => setIsAddCatModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Vegetables, Organic Fruits..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
                {catErr && <p className="text-xs text-rose-600 font-medium mt-1">{catErr}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

