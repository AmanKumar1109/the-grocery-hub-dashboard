import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import ImageUploadInput from '../components/ImageUploadInput';
import {
  Smartphone,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  Palette,
  Search,
  ShoppingBag,
  Folder,
  X,
  Loader2,
  ExternalLink,
  Layers,
  Check,
  Power
} from 'lucide-react';

// Preset color themes matching the mobile app style
const COLOR_PRESETS = [
  {
    name: 'Ocean Sapphire',
    gradientColors: ['#1E3A8A', '#1D4ED8', '#0F172A'],
    accentColor: '#3B82F6',
  },
  {
    name: 'Royal Velvet',
    gradientColors: ['#581C87', '#3B0764', '#1E0130'],
    accentColor: '#A855F7',
  },
  {
    name: 'Sunset Saver',
    gradientColors: ['#9A3412', '#7C2D12', '#431407'],
    accentColor: '#F97316',
  },
  {
    name: 'Berry Silk',
    gradientColors: ['#831843', '#701A75', '#3B0764'],
    accentColor: '#EC4899',
  },
  {
    name: 'Emerald Fresh',
    gradientColors: ['#065F46', '#044E3A', '#022C22'],
    accentColor: '#10B981',
  },
  {
    name: 'Grocery Gold',
    gradientColors: ['#854D0E', '#713F12', '#361D04'],
    accentColor: '#FACC15',
  },
  {
    name: 'Obsidian Night',
    gradientColors: ['#1E293B', '#0F172A', '#020617'],
    accentColor: '#64748B',
  },
];

// Default 5 promotional banners from mobile app
const DEFAULT_APP_BANNERS = [
  {
    title: 'Surf Excel\nMatic Liquid',
    subtitle: 'Tough stain removal in 1 wash',
    buttonText: 'Shop now',
    imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=700&auto=format&fit=crop',
    gradientColors: ['#1E3A8A', '#1D4ED8', '#0F172A'],
    accentColor: '#3B82F6',
    targetTitle: 'Surf & Detergent Cleaners',
    sectionType: 'all',
    searchTerm: 'surf',
    categoryId: 'cat_cleaning',
    order: 0,
    isActive: true,
    isDefault: true,
  },
  {
    title: 'Cadbury Rich\nFudge Brownie',
    subtitle: 'Gooey, decadent & fresh baked',
    buttonText: 'Order fresh',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=700&auto=format&fit=crop',
    gradientColors: ['#581C87', '#3B0764', '#1E0130'],
    accentColor: '#A855F7',
    targetTitle: 'Cadbury Brownies & Chocolates',
    sectionType: 'all',
    searchTerm: 'brownie',
    categoryId: 'cat_bakery',
    order: 1,
    isActive: true,
    isDefault: true,
  },
  {
    title: 'Weekend Super\nGrocery Saver',
    subtitle: 'Up to 30% OFF on daily essentials',
    buttonText: 'Explore deals',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&auto=format&fit=crop',
    gradientColors: ['#9A3412', '#7C2D12', '#431407'],
    accentColor: '#F97316',
    targetTitle: 'All Products & Categories',
    sectionType: 'all',
    searchTerm: '',
    categoryId: '',
    order: 2,
    isActive: true,
    isDefault: true,
  },
  {
    title: 'Dairy Milk\nSilk Chocolate',
    subtitle: 'Silky smooth, velvety pure delight',
    buttonText: 'Shop treat',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700&auto=format&fit=crop',
    gradientColors: ['#831843', '#701A75', '#3B0764'],
    accentColor: '#EC4899',
    targetTitle: 'Cadbury Silk & Chocolates',
    sectionType: 'all',
    searchTerm: 'dairy milk',
    categoryId: 'cat_bakery',
    order: 3,
    isActive: true,
    isDefault: true,
  },
  {
    title: 'Farm Fresh\nDaily Dairy',
    subtitle: 'Pure cow milk, butter & paneer',
    buttonText: 'Order now',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=700&auto=format&fit=crop',
    gradientColors: ['#065F46', '#044E3A', '#022C22'],
    accentColor: '#10B981',
    targetTitle: 'Fresh Dairy & Milk',
    sectionType: 'all',
    searchTerm: 'dairy',
    categoryId: 'cat_dairy_bread',
    order: 4,
    isActive: true,
    isDefault: true,
  },
];

export default function AppBannersView() {
  const { categories = [] } = useAdmin();

  // Initialize with defaults immediately so screen is never empty
  const [banners, setBanners] = useState(
    DEFAULT_APP_BANNERS.map((b, i) => ({ ...b, id: `default-init-${i}` }))
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'hidden'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Shop now',
    imageUrl: '',
    gradientColor1: '#1E3A8A',
    gradientColor2: '#1D4ED8',
    gradientColor3: '#0F172A',
    accentColor: '#3B82F6',
    sectionType: 'all',
    targetTitle: 'All Products',
    categoryId: '',
    searchTerm: '',
    isActive: true,
  });

  // Listen to Firestore `app_banners` collection & Auto-seed defaults if empty
  useEffect(() => {
    let hasAttemptedSeed = false;
    const bannersRef = collection(db, 'app_banners');
    const q = query(bannersRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // If collection is completely empty, auto-seed the 5 default banners to Firestore!
        if (snapshot.empty && !hasAttemptedSeed) {
          hasAttemptedSeed = true;
          try {
            const batch = writeBatch(db);
            DEFAULT_APP_BANNERS.forEach((item) => {
              const newDocRef = doc(collection(db, 'app_banners'));
              batch.set(newDocRef, {
                ...item,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            });
            await batch.commit();
            // onSnapshot will immediately trigger with the newly written docs!
            return;
          } catch (e) {
            console.error('Auto-seed error:', e);
            setLoading(false);
            return;
          }
        }

        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setBanners(loaded);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching app banners:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Open Modal for Create or Edit
  const openModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setForm({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        buttonText: banner.buttonText || 'Shop now',
        imageUrl: banner.imageUrl || '',
        gradientColor1: banner.gradientColors?.[0] || '#1E3A8A',
        gradientColor2: banner.gradientColors?.[1] || '#1D4ED8',
        gradientColor3: banner.gradientColors?.[2] || '#0F172A',
        accentColor: banner.accentColor || '#3B82F6',
        sectionType: banner.sectionType || 'all',
        targetTitle: banner.targetTitle || 'All Products',
        categoryId: banner.categoryId || '',
        searchTerm: banner.searchTerm || '',
        isActive: banner.isActive !== undefined ? banner.isActive : true,
      });
    } else {
      setEditingBanner(null);
      setForm({
        title: '',
        subtitle: '',
        buttonText: 'Shop now',
        imageUrl: '',
        gradientColor1: '#1E3A8A',
        gradientColor2: '#1D4ED8',
        gradientColor3: '#0F172A',
        accentColor: '#3B82F6',
        sectionType: 'all',
        targetTitle: 'All Products',
        categoryId: '',
        searchTerm: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  // Apply Color Preset
  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      gradientColor1: preset.gradientColors[0],
      gradientColor2: preset.gradientColors[1],
      gradientColor3: preset.gradientColors[2],
      accentColor: preset.accentColor,
    }));
  };

  // Save Banner (Create or Update)
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showFeedback('error', 'Please enter a banner title.');
      return;
    }
    if (!form.imageUrl.trim()) {
      showFeedback('error', 'Please provide or upload a banner product image.');
      return;
    }

    setActionLoading(true);
    try {
      const bannerPayload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        buttonText: form.buttonText.trim() || 'Shop now',
        imageUrl: form.imageUrl.trim(),
        gradientColors: [form.gradientColor1, form.gradientColor2, form.gradientColor3],
        accentColor: form.accentColor,
        sectionType: form.sectionType,
        targetTitle: form.targetTitle.trim() || 'Products',
        categoryId: form.sectionType === 'category' ? form.categoryId : '',
        searchTerm: form.sectionType === 'search' ? form.searchTerm.trim() : '',
        isActive: form.isActive,
        updatedAt: serverTimestamp(),
      };

      if (editingBanner && !editingBanner.id.startsWith('default-init-')) {
        // Update existing document
        const docRef = doc(db, 'app_banners', editingBanner.id);
        await updateDoc(docRef, bannerPayload);
        showFeedback('success', `Banner "${form.title.replace('\n', ' ')}" updated successfully.`);
      } else {
        // Create new document in Firestore
        const newOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.order ?? 0)) + 1 : 0;
        await addDoc(collection(db, 'app_banners'), {
          ...bannerPayload,
          order: newOrder,
          createdAt: serverTimestamp(),
        });
        showFeedback('success', `Banner "${form.title.replace('\n', ' ')}" saved to Firestore!`);
      }

      closeModal();
    } catch (err) {
      console.error('Error saving banner:', err);
      showFeedback('error', 'Failed to save banner to Firestore.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Hide / Unhide (Active / Inactive)
  const handleToggleActive = async (banner) => {
    setActionLoading(true);
    try {
      const newStatus = !banner.isActive;

      // If document exists in Firestore
      if (banner.id && !banner.id.startsWith('default-init-')) {
        const docRef = doc(db, 'app_banners', banner.id);
        await updateDoc(docRef, {
          isActive: newStatus,
          updatedAt: serverTimestamp(),
        });
      } else {
        // First-time toggle on default item: create it in Firestore with toggled status
        const docRef = doc(collection(db, 'app_banners'));
        await updateDoc(docRef, {
          ...banner,
          isActive: newStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      showFeedback(
        'success',
        newStatus
          ? `🟢 Banner "${banner.title.replace('\n', ' ')}" is now ACTIVE on mobile app.`
          : `⏸️ Banner "${banner.title.replace('\n', ' ')}" is now HIDDEN from mobile app.`
      );
    } catch (err) {
      console.error('Error toggling banner status:', err);
      showFeedback('error', 'Failed to update banner visibility.');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Hide All or Unhide All
  const handleBulkToggle = async (targetActive) => {
    if (!window.confirm(targetActive ? 'Show all banners on mobile app?' : 'Hide all banners from mobile app?')) {
      return;
    }
    setActionLoading(true);
    try {
      const batch = writeBatch(db);
      banners.forEach((banner) => {
        if (banner.id && !banner.id.startsWith('default-init-')) {
          const docRef = doc(db, 'app_banners', banner.id);
          batch.update(docRef, { isActive: targetActive, updatedAt: serverTimestamp() });
        }
      });
      await batch.commit();
      showFeedback('success', targetActive ? 'All banners are now visible in mobile app.' : 'All banners are now hidden in mobile app.');
    } catch (err) {
      console.error('Error bulk updating banners:', err);
      showFeedback('error', 'Failed to update all banners.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (banner) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${banner.title.replace('\n', ' ')}"?`)) {
      return;
    }
    setActionLoading(true);
    try {
      if (banner.id && !banner.id.startsWith('default-init-')) {
        await deleteDoc(doc(db, 'app_banners', banner.id));
      } else {
        setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      }
      showFeedback('success', 'Banner deleted successfully.');
    } catch (err) {
      console.error('Error deleting banner:', err);
      showFeedback('error', 'Failed to delete banner.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reorder Banner Up or Down
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    setActionLoading(true);
    try {
      const currentBanner = banners[index];
      const targetBanner = banners[targetIndex];

      if (
        currentBanner.id &&
        !currentBanner.id.startsWith('default-init-') &&
        targetBanner.id &&
        !targetBanner.id.startsWith('default-init-')
      ) {
        const batch = writeBatch(db);
        const currentRef = doc(db, 'app_banners', currentBanner.id);
        const targetRef = doc(db, 'app_banners', targetBanner.id);

        batch.update(currentRef, { order: targetBanner.order ?? targetIndex });
        batch.update(targetRef, { order: currentBanner.order ?? index });

        await batch.commit();
      } else {
        const updated = [...banners];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;
        setBanners(updated);
      }
      showFeedback('success', 'Banner display order updated.');
    } catch (err) {
      console.error('Error reordering banners:', err);
      showFeedback('error', 'Failed to update order.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered list
  const activeCount = banners.filter((b) => b.isActive !== false).length;
  const hiddenCount = banners.filter((b) => b.isActive === false).length;

  const displayBanners = banners.filter((b) => {
    if (filterTab === 'active') return b.isActive !== false;
    if (filterTab === 'hidden') return b.isActive === false;
    return true;
  });

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Mobile App Banners"
        subtitle="Manage dynamic promotional carousel banners, slide ordering, and app visibility"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Feedback Toast */}
        {feedback && (
          <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          </div>
        )}

        {/* Action & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Banners ({banners.length})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                filterTab === 'active'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterTab('hidden')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                filterTab === 'hidden'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Hidden ({hiddenCount})
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {banners.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkToggle(true)}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
                  title="Show all banners in app"
                >
                  Show All
                </button>
                <button
                  onClick={() => handleBulkToggle(false)}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
                  title="Hide all banners from app"
                >
                  Hide All
                </button>
              </>
            )}

            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Banner</span>
            </button>
          </div>
        </div>

        {/* Banners List */}
        <div className="space-y-3.5">
          {displayBanners.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-sm font-semibold text-slate-600">No banners found in "{filterTab}" filter.</p>
              <button
                onClick={() => setFilterTab('all')}
                className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-800 transition cursor-pointer"
              >
                View All Banners
              </button>
            </div>
          ) : (
            displayBanners.map((banner, index) => {
              const isHidden = banner.isActive === false;
              const bgGradient =
                banner.gradientColors && banner.gradientColors.length >= 3
                  ? `linear-gradient(135deg, ${banner.gradientColors[0]} 0%, ${banner.gradientColors[1]} 50%, ${banner.gradientColors[2]} 100%)`
                  : 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #0F172A 100%)';

              const accent = banner.accentColor || '#3B82F6';

              return (
                <div
                  key={banner.id}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs flex flex-col md:flex-row items-center gap-5 transition ${
                    isHidden
                      ? 'border-slate-200/60 bg-slate-50/50 opacity-75'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Reorder Vertical Handle */}
                  <div className="flex md:flex-col items-center gap-1 self-start md:self-center shrink-0">
                    <button
                      onClick={() => handleMoveOrder(index, 'up')}
                      disabled={index === 0 || actionLoading}
                      title="Move Up"
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => handleMoveOrder(index, 'down')}
                      disabled={index === banners.length - 1 || actionLoading}
                      title="Move Down"
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Banner Card Preview */}
                  <div
                    className={`relative w-full md:w-72 h-32 rounded-xl p-3.5 flex items-center justify-between overflow-hidden shadow-sm shrink-0 transition ${
                      isHidden ? 'opacity-60 saturate-75' : ''
                    }`}
                    style={{ background: bgGradient }}
                  >
                    <div
                      className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full blur-xl pointer-events-none opacity-40"
                      style={{ backgroundColor: accent }}
                    />

                    {/* Text Left */}
                    <div className="relative z-10 max-w-[62%] flex flex-col justify-between h-full">
                      <div>
                        <h4 className="text-white font-bold text-xs tracking-tight leading-snug line-clamp-2 whitespace-pre-line">
                          {banner.title}
                        </h4>
                        <p className="text-white/80 text-[10px] font-medium mt-0.5 line-clamp-1">
                          {banner.subtitle}
                        </p>
                      </div>

                      <div className="mt-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-2xs"
                          style={{
                            backgroundColor: `${accent}33`,
                            border: `1px solid ${accent}`,
                          }}
                        >
                          {banner.buttonText || 'Shop now'}
                        </span>
                      </div>
                    </div>

                    {/* Image Right */}
                    <div className="relative z-10 w-20 h-20 rounded-lg overflow-hidden bg-white/10 border border-white/20 shadow-inner flex items-center justify-center shrink-0">
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
                          }}
                        />
                      ) : (
                        <span className="text-white/40 text-[10px]">No image</span>
                      )}
                    </div>

                    {/* Hidden Badge Watermark */}
                    {isHidden && (
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex items-center justify-center z-20">
                        <span className="px-2.5 py-0.5 bg-slate-900/90 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-700 shadow-sm flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-slate-400" />
                          Hidden
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Banner Information - Clean, Minimal, No rainbow tag clutter */}
                  <div className="flex-1 min-w-0 w-full space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          !isHidden
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            !isHidden ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {!isHidden ? 'Active in App' : 'Hidden from App'}
                      </span>

                      {banner.isDefault && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Default Preset
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                        {banner.title.replace('\n', ' ')}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {banner.subtitle || 'Promotional Banner'}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                      <span>
                        Target: <strong className="text-slate-700">{banner.targetTitle || 'All Products'}</strong>
                      </span>
                      <span>•</span>
                      <span>Button: <strong className="text-slate-700">{banner.buttonText || 'Shop now'}</strong></span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      disabled={actionLoading}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        !isHidden
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {!isHidden ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>{!isHidden ? 'Hide' : 'Unhide'}</span>
                    </button>

                    <button
                      onClick={() => openModal(banner)}
                      title="Edit Banner"
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteBanner(banner)}
                      title="Delete Banner"
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {editingBanner ? 'Edit Mobile App Banner' : 'Create New Mobile App Banner'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure title, image, colors, visibility, and tap navigation
                  </p>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBanner} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* LIVE PREVIEW ROW */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Live Mobile Card Preview (Exact mobile app appearance):
                </label>
                <div className="bg-slate-900/5 p-4 rounded-2xl flex items-center justify-center border border-slate-200">
                  <div
                    className="relative w-full max-w-md h-40 rounded-2xl p-5 flex items-center justify-between overflow-hidden shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${form.gradientColor1} 0%, ${form.gradientColor2} 50%, ${form.gradientColor3} 100%)`,
                    }}
                  >
                    <div
                      className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-50"
                      style={{ backgroundColor: form.accentColor }}
                    />

                    <div className="relative z-10 max-w-[65%] flex flex-col justify-between h-full">
                      <div>
                        <h4 className="text-white font-black text-base tracking-tight leading-tight line-clamp-2 whitespace-pre-line">
                          {form.title.trim() || 'Banner Title Line\nSecond Line'}
                        </h4>
                        <p className="text-white/80 text-xs font-medium mt-1 line-clamp-1">
                          {form.subtitle.trim() || 'Exciting promotion or discount subtitle'}
                        </p>
                      </div>

                      <div className="mt-2">
                        <span
                          className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm"
                          style={{
                            backgroundColor: `${form.accentColor}33`,
                            border: `1.5px solid ${form.accentColor}`,
                          }}
                        >
                          {form.buttonText.trim() || 'Shop now'}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 w-28 h-28 rounded-2xl overflow-hidden bg-white/10 border border-white/25 shadow-inner flex items-center justify-center shrink-0">
                      {form.imageUrl ? (
                        <img
                          src={form.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
                          }}
                        />
                      ) : (
                        <div className="text-white/40 text-xs text-center p-2">Upload product image</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. TEXT CONTENT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Banner Title <span className="text-red-500">*</span>
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (Type \n or press Enter for multi-line)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Surf Excel&#10;Matic Liquid"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="e.g. Tough stain removal in 1 wash"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={form.buttonText}
                      onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                      placeholder="e.g. Shop now / Order fresh / Explore deals"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. IMAGE UPLOAD / URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banner Product Image <span className="text-red-500">*</span>
                </label>
                <ImageUploadInput
                  value={form.imageUrl}
                  onChange={(url) => setForm({ ...form, imageUrl: url })}
                  label="App Banner Product Image"
                  folder="app_banners"
                />
              </div>

              {/* 3. COLOR THEME & PRESETS */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    Color Presets (One-Click Themes)
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Or customize hex below</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="p-2 rounded-xl border border-slate-200 hover:border-slate-400 bg-white flex flex-col items-center gap-1.5 transition active:scale-95 group text-center"
                    >
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${preset.gradientColors[0]} 0%, ${preset.gradientColors[1]} 50%, ${preset.gradientColors[2]} 100%)`,
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 group-hover:text-emerald-700 leading-tight">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Hex Customization */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Gradient Start</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={form.gradientColor1}
                        onChange={(e) => setForm({ ...form, gradientColor1: e.target.value })}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.gradientColor1}
                        onChange={(e) => setForm({ ...form, gradientColor1: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Gradient Mid</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={form.gradientColor2}
                        onChange={(e) => setForm({ ...form, gradientColor2: e.target.value })}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.gradientColor2}
                        onChange={(e) => setForm({ ...form, gradientColor2: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Gradient End</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={form.gradientColor3}
                        onChange={(e) => setForm({ ...form, gradientColor3: e.target.value })}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.gradientColor3}
                        onChange={(e) => setForm({ ...form, gradientColor3: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Accent (Button/Glow)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={form.accentColor}
                        onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.accentColor}
                        onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. TAP ACTION & NAVIGATION */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                  What happens when customer taps this banner?
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Tap Action Type</label>
                    <select
                      value={form.sectionType}
                      onChange={(e) => setForm({ ...form, sectionType: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="all">Show All Products</option>
                      <option value="category">Open Specific Category</option>
                      <option value="search">Run Search Keyword</option>
                    </select>
                  </div>

                  {form.sectionType === 'category' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Select Category</label>
                      <select
                        value={form.categoryId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm({
                            ...form,
                            categoryId: val,
                            targetTitle: val || 'Category Products',
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : form.sectionType === 'search' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Search Keyword</label>
                      <input
                        type="text"
                        value={form.searchTerm}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            searchTerm: e.target.value,
                            targetTitle: e.target.value ? `Search: ${e.target.value}` : 'Products',
                          })
                        }
                        placeholder="e.g. surf, atta, chocolate"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Page Title</label>
                      <input
                        type="text"
                        value={form.targetTitle}
                        onChange={(e) => setForm({ ...form, targetTitle: e.target.value })}
                        placeholder="e.g. All Products & Categories"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Screen Header Title</label>
                    <input
                      type="text"
                      value={form.targetTitle}
                      onChange={(e) => setForm({ ...form, targetTitle: e.target.value })}
                      placeholder="e.g. Cadbury Brownies & Treats"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 5. VISIBILITY TOGGLE */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Banner Visibility</h4>
                  <p className="text-[11px] text-slate-500">
                    Enable or disable this banner immediately from the mobile app
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingBanner ? 'Save Changes' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
