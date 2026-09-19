import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Plus, Image as ImageIcon, Check, X, Edit3, Trash2, Tag, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import ImageUploadInput from './ImageUploadInput';

export default function BrandSelector({
  value = '',
  logo = '',
  onChange,
  label = "Brand Name",
  required = false
}) {
  const { brands = [], saveBrand, deleteBrand, items = [] } = useAdmin();

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [tempLogo, setTempLogo] = useState('');
  const [editingBrandName, setEditingBrandName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Manage modal quick add states
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');
  const [manageFeedback, setManageFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Default popular grocery brands
  const defaultPopular = [
    'Amul', 'Aashirvaad', 'Tata', 'Fortune', 'Nestle', 'Britannia',
    'Dabur', 'Haldiram\'s', 'Parle', 'Saffola', 'Dettol', 'Surf Excel',
    'Colgate', 'Cadbury', 'Patanjali', 'Everest', 'MDH', 'Catch', 'Mother Dairy',
    'Kissan', 'Maggi', 'Kellogg\'s', 'Lipton', 'Red Label', 'Brooke Bond'
  ];

  // Combined unique list of brand names
  const allBrandNames = useMemo(() => {
    const set = new Set(defaultPopular);
    brands.forEach(b => {
      if (b.name) set.add(b.name.trim());
    });
    items.forEach(i => {
      if (i.brand && typeof i.brand === 'string' && i.brand.trim()) {
        set.add(i.brand.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [brands, items]);

  // Find existing brand document in master library
  const matchedBrandDoc = useMemo(() => {
    if (!value || !value.trim()) return null;
    return brands.find(b => b.name?.toLowerCase().trim() === value.toLowerCase().trim()) || null;
  }, [value, brands]);

  // Current active logo (from doc or prop)
  const activeLogo = logo || matchedBrandDoc?.logo || '';

  // Handle typing or selecting brand
  const handleBrandChange = (newVal) => {
    const trimmed = newVal;
    const found = brands.find(b => b.name?.toLowerCase().trim() === trimmed.toLowerCase().trim());
    onChange({
      name: trimmed,
      logo: found?.logo || (trimmed === value ? logo : '')
    });
  };

  // Open modal to set or edit logo for current brand
  const handleOpenLogoModal = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!value.trim()) return;
    setEditingBrandName(value.trim());
    setTempLogo(activeLogo);
    setModalFeedback(null);
    setIsLogoModalOpen(true);
  };

  // Save logo to master brand library from Modal 1
  const handleSaveLogo = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!editingBrandName.trim()) return;
    setIsSaving(true);
    setModalFeedback(null);
    try {
      await saveBrand(editingBrandName.trim(), tempLogo);
      onChange({
        name: editingBrandName.trim(),
        logo: tempLogo
      });
      setModalFeedback({ type: 'success', text: `Brand logo for "${editingBrandName}" saved successfully!` });
      setTimeout(() => {
        setIsLogoModalOpen(false);
      }, 700);
    } catch (err) {
      console.error("Error saving brand logo:", err);
      setModalFeedback({ type: 'error', text: err.message || "Failed to save logo. Please check permissions." });
    } finally {
      setIsSaving(false);
    }
  };

  // Save new brand from Manage modal (Modal 2)
  const handleAddBrandFromManage = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!newBrandName.trim()) return;
    setIsSaving(true);
    setManageFeedback(null);
    try {
      const brandToSave = newBrandName.trim();
      const logoToSave = newBrandLogo.trim();
      await saveBrand(brandToSave, logoToSave);
      setManageFeedback({ type: 'success', text: `Brand "${brandToSave}" saved to Master Library!` });
      setNewBrandName('');
      setNewBrandLogo('');
      setTimeout(() => setManageFeedback(null), 4000);
    } catch (err) {
      console.error("Error adding brand:", err);
      setManageFeedback({ type: 'error', text: err.message || "Failed to save brand to library." });
    } finally {
      setIsSaving(false);
    }
  };

  // Quick select brand from library list into parent form
  const handleSelectFromLibrary = (brandItem, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange({
      name: brandItem.name,
      logo: brandItem.logo || ''
    });
    setIsManageModalOpen(false);
  };

  return (
    <div className="space-y-1.5">
      {/* Top Label with Quick Links */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 block">
          {label} {required ? '*' : '(Optional)'}
        </label>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setManageFeedback(null);
            setIsManageModalOpen(true);
          }}
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Master Brands Library ({brands.length})
        </button>
      </div>

      {/* Brand Input & Logo Indicator */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          {/* Circular Brand Logo Badge inside input if available */}
          {activeLogo && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full overflow-hidden border border-slate-200 bg-white shadow-2xs shrink-0 flex items-center justify-center z-10">
              <img
                src={activeLogo}
                alt="Brand Logo"
                className="w-full h-full object-contain p-0.5"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          <input
            type="text"
            list="brand-master-suggestions"
            placeholder="e.g. Amul, Tata, Fortune, Nestle"
            value={value}
            onChange={(e) => handleBrandChange(e.target.value)}
            className={`w-full bg-slate-50 border border-slate-200 rounded-xl pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
              activeLogo ? 'pl-10' : 'pl-4'
            }`}
          />
          <datalist id="brand-master-suggestions">
            {allBrandNames.map(b => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>

        {/* Action Button: Set Logo or Show Active Logo */}
        {value.trim() && (
          <button
            type="button"
            onClick={handleOpenLogoModal}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer border ${
              activeLogo
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}
            title={activeLogo ? "Brand logo set in master library (Click to change)" : "Add logo for this brand"}
          >
            {activeLogo ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Logo Linked</span>
                <Edit3 className="w-3 h-3 text-indigo-400" />
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>+ Brand Logo</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Prominent Brand Logo Preview Card */}
      {value.trim() && activeLogo ? (
        <div className="p-3 bg-gradient-to-r from-indigo-50/90 to-blue-50/50 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white border border-indigo-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              <img
                src={activeLogo}
                alt={`${value} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-800">{value}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ✓ Logo Attached
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Saved in Master Library (Permanently linked to all {value} products)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenLogoModal}
            className="px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            Change Logo
          </button>
        </div>
      ) : null}

      {/* MODAL 1: SET / EDIT BRAND LOGO FOR CURRENT BRAND (Rendered in Portal outside any parent form) */}
      {isLogoModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Brand Logo: {editingBrandName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Upload once, auto-applied to all products of this brand!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                modalFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {modalFeedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{modalFeedback.text}</span>
              </div>
            )}

            <div className="space-y-4">
              <ImageUploadInput
                label={`Upload or Paste Logo for "${editingBrandName}"`}
                value={tempLogo}
                onChange={(url) => setTempLogo(url)}
                folder="brands"
              />

              {/* Live circular and square preview */}
              {tempLogo && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                    <img src={tempLogo} alt="Logo Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                    <img src={tempLogo} alt="Logo Preview" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Master Brand Logo Ready</p>
                    <p className="text-[10px] text-slate-400">Will auto-link to all "{editingBrandName}" items.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLogo}
                  disabled={isSaving || !tempLogo}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save & Link to Brand'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: MASTER BRANDS LIBRARY MANAGEMENT (Rendered in Portal outside any parent form) */}
      {isManageModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Master Brands Library
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add a brand logo once here. Whenever you pick this brand for any product, the logo is automatically attached!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {manageFeedback && (
              <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 ${
                manageFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {manageFeedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{manageFeedback.text}</span>
              </div>
            )}

            {/* Quick Add Brand Form (Pure Div Container, no form tag to avoid nested form submission) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shrink-0">
              <span className="text-xs font-bold text-slate-700 block">
                + Add New Brand with Logo to Library
              </span>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Amul, Tata, Fortune, Nestle"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <ImageUploadInput
                  label="Brand Logo (Upload File or Paste Link)"
                  value={newBrandLogo}
                  onChange={(url) => setNewBrandLogo(url)}
                  folder="brands"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddBrandFromManage}
                  disabled={isSaving || !newBrandName.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {isSaving ? 'Saving to Library...' : 'Save Brand to Library'}
                </button>
              </div>
            </div>

            {/* List of saved brands */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin min-h-[150px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Saved Brands in Library ({brands.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Click "Select" on any brand to use it in your product
                </span>
              </div>

              {brands.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">No brands saved in master library yet.</p>
                  <p className="text-[11px] mt-1">Enter a brand name and upload its logo above to save your first brand!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {brands.map((b) => (
                    <div
                      key={b.id || b.name}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {b.logo ? (
                            <img
                              src={b.logo}
                              alt={b.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
                              }}
                            />
                          ) : (
                            <Tag className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{b.name}</p>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            {b.logo ? '✓ Logo attached' : 'No logo'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleSelectFromLibrary(b, e)}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          title="Use this brand in current product form"
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingBrandName(b.name);
                            setTempLogo(b.logo || '');
                            setModalFeedback(null);
                            setIsLogoModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Logo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteBrand(b.id || b.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
