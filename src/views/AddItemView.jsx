import React, { useState } from 'react';
import { PlusCircle, UtensilsCrossed, ArrowLeft, Image as ImageIcon, Check, FolderPlus, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import { useNavigate, Link } from 'react-router-dom';

export default function AddItemView() {
  const { categories, addCategory, addItem } = useAdmin();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: categories[0] || 'Burgers',
    price: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80'
  });

  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catErr, setCatErr] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetImages = [
    { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80' },
    { label: 'Pizza', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=80' },
    { label: 'Salad', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80' },
    { label: 'Drink', url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&auto=format&fit=crop&q=80' },
    { label: 'Dessert', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80' }
  ];

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
    if (!formData.name || !formData.price) return;

    try {
      setIsSubmitting(true);
      await addItem(formData);
      setSuccessMsg(true);
      setTimeout(() => {
        navigate('/items');
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
        title="Add New Food Item"
        subtitle="Create a new entry in your menu catalog in Indian Rupees (₹)"
      />

      <main className="p-8 max-w-4xl w-full mx-auto flex-1 space-y-6">
        <Link
          to="/items"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Food Item Saved Successfully!</p>
              <p className="text-xs text-emerald-600">Redirecting to items catalog...</p>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Food Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Category Dropdown & Quick Add Button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Category *</label>
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
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price (Rupees) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 240.00"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
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

            {/* Image Preset Selectors */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Or Choose Image Preset</label>
              <div className="flex flex-wrap gap-3">
                {presetImages.map(img => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, image: img.url })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      formData.image === img.url
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    {img.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Item Description</label>
              <textarea
                rows="4"
                placeholder="Write a tasty description of ingredients, serving size..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/items')}
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
                {isSubmitting ? 'Saving Item...' : 'Save Item To Menu'}
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
                  placeholder="e.g. Main Course, Snacks..."
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
