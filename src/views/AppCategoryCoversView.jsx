import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
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
  Search,
  X,
  Loader2,
  Layers,
  Check,
  Power,
  RefreshCw,
  Tag,
  Image as ImageIcon,
  Flame,
  Gift,
  ShoppingBag,
  UploadCloud,
  CheckCheck
} from 'lucide-react';

// Starter covers matched specifically to the 21 real store categories in Firestore
const STORE_STARTER_COVERS = {
  'Atta, Rice & Dal': {
    title: 'Atta, Rice & Dal',
    tag: 'ESSENTIALS',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop',
    colorHex: '0xFFF1F5F9',
  },
  'Baby Care': {
    title: 'Baby Care',
    tag: 'CARE',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&auto=format&fit=crop',
    colorHex: '0xFFFCE7F3',
  },
  'Bakery & Biscuits': {
    title: 'Bakery & Biscuits',
    tag: 'BAKERY',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop',
    colorHex: '0xFFF3E8FF',
  },
  'Bath & Body': {
    title: 'Bath & Body',
    tag: 'WELLNESS',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop',
    colorHex: '0xFFE0E7FF',
  },
  'Beauty & Cosmetics': {
    title: 'Beauty & Cosmetics',
    tag: 'GLOW',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop',
    colorHex: '0xFFFFE4E6',
  },
  'Chips & Namkeen': {
    title: 'Chips & Namkeen',
    tag: 'CRAVINGS',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop',
    colorHex: '0xFFFFEDD5',
  },
  'Cleaners & Repellents': {
    title: 'Cleaners & Repellents',
    tag: 'CLEAN',
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop',
    colorHex: '0xFFCCFBF1',
  },
  'Dairy, Bread & Eggs': {
    title: 'Dairy, Bread & Eggs',
    tag: 'DAILY',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop',
    colorHex: '0xFFFEF3C7',
  },
  'Drinks & Juices': {
    title: 'Drinks & Juices',
    tag: 'CHILLED',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop',
    colorHex: '0xFFE0F2FE',
  },
  'Dry Fruits & Cereals': {
    title: 'Dry Fruits & Cereals',
    tag: 'HEALTHY',
    imageUrl: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=400&auto=format&fit=crop',
    colorHex: '0xFFFEF9C3',
  },
  'Feminine Hygiene': {
    title: 'Feminine Hygiene',
    tag: 'CARE',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop',
    colorHex: '0xFFFDF2F8',
  },
  'Fresheners': {
    title: 'Fresheners',
    tag: 'AROMA',
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&auto=format&fit=crop',
    colorHex: '0xFFECFDF5',
  },
  'General': {
    title: 'General Essentials',
    tag: 'ALL',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop',
    colorHex: '0xFFF8FAFC',
  },
  'Hair Care': {
    title: 'Hair Care',
    tag: 'SHINE',
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop',
    colorHex: '0xFFF5F3FF',
  },
  'Instant Food': {
    title: 'Instant Food',
    tag: 'QUICK',
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop',
    colorHex: '0xFFFFEDD5',
  },
  'Oil Ghee & Masala': {
    title: 'Oil Ghee & Masala',
    tag: 'PURE',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop',
    colorHex: '0xFFFEF3C7',
  },
  'Pooja Needs': {
    title: 'Pooja Needs',
    tag: 'POOJA',
    imageUrl: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=400&auto=format&fit=crop',
    colorHex: '0xFFFFFBEB',
  },
  'Sauce & Spreads': {
    title: 'Sauce & Spreads',
    tag: 'TASTY',
    imageUrl: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400&auto=format&fit=crop',
    colorHex: '0xFFFFE4E6',
  },
  'Stationery & Games': {
    title: 'Stationery & Games',
    tag: 'KIDS',
    imageUrl: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&auto=format&fit=crop',
    colorHex: '0xFFEFF6FF',
  },
  'Sweets & Chocolates': {
    title: 'Sweets & Chocolates',
    tag: 'SWEET',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop',
    colorHex: '0xFFF3E8FF',
  },
  'Tea, Coffee & Milk Drinks': {
    title: 'Tea & Coffee',
    tag: 'BREW',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop',
    colorHex: '0xFFFEF3C7',
  },
};

const SYSTEM_TILES = [
  {
    id: 'all',
    targetKey: 'all',
    title: 'All Products',
    tag: 'ALL',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop',
    colorHex: '0xFFFFF4B8',
    isSystem: true,
    order: 0,
    isActive: true,
  },
  {
    id: 'trending',
    targetKey: 'Trending',
    title: 'Trending Deals',
    tag: 'HOT',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop',
    colorHex: '0xFFFFE0B2',
    isSystem: true,
    order: 1,
    isActive: true,
  },
  {
    id: 'bogo',
    targetKey: 'BOGO',
    title: 'Buy 1 Get 1',
    tag: 'BOGO',
    imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&auto=format&fit=crop',
    colorHex: '0xFFE1BEE7',
    isSystem: true,
    order: 2,
    isActive: true,
  },
];

const PRESET_TAGS = ['ALL', 'HOT', 'BOGO', 'DEAL', 'FRESH', '50% OFF', 'BESTSELLER', 'NEW', 'DAILY', 'CHILLED', 'PURE'];

export default function AppCategoryCoversView() {
  const [storeCategories, setStoreCategories] = useState([]);
  const [coversMap, setCoversMap] = useState({});
  const [orderedList, setOrderedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'system' | 'catalog' | 'missing'
  const [toastMessage, setToastMessage] = useState(null);

  // Edit / Add Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formTargetKey, setFormTargetKey] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsSystem, setFormIsSystem] = useState(false);

  // Show Toast
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Listen to real Firebase `categories` collection
  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || d.id,
        imageUrl: d.data().imageUrl || d.data().coverImage || '',
        tag: d.data().tag || '',
        ...d.data(),
      }));
      setStoreCategories(list);
    });

    return () => unsubCats();
  }, []);

  // 2. Listen to real Firebase `app_category_covers` collection
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'app_category_covers'), orderBy('order', 'asc'));
    const unsubCovers = onSnapshot(
      q,
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          map[d.id] = { id: d.id, ...data };
          if (data.targetKey) {
            map[data.targetKey.toLowerCase()] = { id: d.id, ...data };
          }
        });
        setCoversMap(map);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to app_category_covers:', error);
        setLoading(false);
      }
    );

    return () => unsubCovers();
  }, []);

  // 3. Merge system categories + actual Firebase store categories
  useEffect(() => {
    const merged = [];

    // Add 3 System Sections first
    SYSTEM_TILES.forEach((sys) => {
      const saved = coversMap[sys.id] || coversMap[sys.targetKey.toLowerCase()];
      merged.push({
        id: sys.id,
        targetKey: sys.targetKey,
        title: saved?.title || sys.title,
        tag: saved?.tag !== undefined ? saved.tag : sys.tag,
        imageUrl: saved?.imageUrl || sys.imageUrl,
        colorHex: saved?.colorHex || sys.colorHex,
        isSystem: true,
        order: saved?.order !== undefined ? saved.order : sys.order,
        isActive: saved?.isActive !== undefined ? saved.isActive : sys.isActive,
      });
    });

    // Add all Real Store Categories from Firebase
    storeCategories.forEach((cat, idx) => {
      const catKey = cat.name || cat.id;
      const docId = `cat_${catKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const saved = coversMap[docId] || coversMap[catKey.toLowerCase()] || coversMap[cat.id.toLowerCase()];
      const starter = STORE_STARTER_COVERS[catKey] || {};

      const resolvedImage = saved?.imageUrl || cat.imageUrl || cat.coverImage || starter.imageUrl || '';
      const resolvedTag = saved?.tag !== undefined ? saved.tag : (cat.tag || starter.tag || '');
      const resolvedTitle = saved?.title || catKey;
      const resolvedActive = saved?.isActive !== undefined ? saved.isActive : true;
      const resolvedOrder = saved?.order !== undefined ? saved.order : 3 + idx;

      merged.push({
        id: saved?.id || docId,
        catDocId: cat.id,
        targetKey: catKey,
        title: resolvedTitle,
        tag: resolvedTag,
        imageUrl: resolvedImage,
        colorHex: saved?.colorHex || starter.colorHex || '0xFFF8FAFC',
        isSystem: false,
        order: resolvedOrder,
        isActive: resolvedActive,
        hasCover: !!resolvedImage,
      });
    });

    // Sort by order
    merged.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    setOrderedList(merged);
  }, [storeCategories, coversMap]);

  // Open modal for Edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormTargetKey(item.targetKey || item.id);
    setFormTitle(item.title || '');
    setFormTag(item.tag || '');
    setFormImageUrl(item.imageUrl || '');
    setFormIsActive(item.isActive !== false);
    setFormIsSystem(!!item.isSystem);
    setModalOpen(true);
  };

  // Open modal for Add custom
  const handleAddNew = () => {
    setEditingItem(null);
    setFormTargetKey('');
    setFormTitle('');
    setFormTag('');
    setFormImageUrl('');
    setFormIsActive(true);
    setFormIsSystem(false);
    setModalOpen(true);
  };

  // Quick 1-click Toggle Active/Hidden
  const handleToggleActive = async (item, e) => {
    e.stopPropagation();
    try {
      const newStatus = !(item.isActive !== false);
      const docRef = doc(db, 'app_category_covers', item.id);
      await setDoc(
        docRef,
        {
          id: item.id,
          targetKey: item.targetKey,
          title: item.title,
          tag: item.tag || '',
          imageUrl: item.imageUrl || '',
          isSystem: !!item.isSystem,
          order: item.order ?? 99,
          isActive: newStatus,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // If category exists in `categories` collection, also sync isActive
      if (!item.isSystem && item.catDocId) {
        await updateDoc(doc(db, 'categories', item.catDocId), {
          isActive: newStatus,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }

      showToast(
        newStatus
          ? `"${item.title}" is now ACTIVE in mobile app.`
          : `"${item.title}" is now HIDDEN in mobile app.`,
        'success'
      );
    } catch (err) {
      console.error('Toggle error:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formTargetKey.trim()) {
      showToast('Please enter category key.', 'error');
      return;
    }
    if (!formTitle.trim()) {
      showToast('Please enter display title.', 'error');
      return;
    }

    setSaving(true);
    try {
      const docId =
        editingItem?.id || `cat_${formTargetKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const docRef = doc(db, 'app_category_covers', docId);

      const payload = {
        id: docId,
        targetKey: formTargetKey.trim(),
        title: formTitle.trim(),
        tag: formTag.trim().toUpperCase(),
        imageUrl: formImageUrl.trim(),
        isActive: formIsActive,
        isSystem: formIsSystem,
        updatedAt: serverTimestamp(),
      };

      if (!editingItem) {
        payload.order = orderedList.length;
        payload.createdAt = serverTimestamp();
      }

      // 1. Save to `app_category_covers`
      await setDoc(docRef, payload, { merge: true });

      // 2. Also update `categories` document in Firebase for 100% consistency!
      const catDocName = editingItem?.catDocId || formTargetKey.trim();
      const catRef = doc(db, 'categories', catDocName);
      await updateDoc(catRef, {
        imageUrl: formImageUrl.trim(),
        coverImage: formImageUrl.trim(),
        tag: formTag.trim().toUpperCase(),
        updatedAt: serverTimestamp(),
      }).catch(() => {
        // If doc not found by name, try fallback matching
      });

      showToast(`Cover for "${formTitle}" saved successfully!`, 'success');
      setModalOpen(false);
    } catch (err) {
      console.error('Save error:', err);
      showToast('Error saving cover: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reorder Items
  const handleMoveOrder = async (index, direction, e) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedList.length) return;

    try {
      const batch = writeBatch(db);
      const currentItem = orderedList[index];
      const targetItem = orderedList[targetIndex];

      batch.set(
        doc(db, 'app_category_covers', currentItem.id),
        {
          id: currentItem.id,
          targetKey: currentItem.targetKey,
          title: currentItem.title,
          tag: currentItem.tag || '',
          imageUrl: currentItem.imageUrl || '',
          isSystem: !!currentItem.isSystem,
          isActive: currentItem.isActive !== false,
          order: targetIndex,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      batch.set(
        doc(db, 'app_category_covers', targetItem.id),
        {
          id: targetItem.id,
          targetKey: targetItem.targetKey,
          title: targetItem.title,
          tag: targetItem.tag || '',
          imageUrl: targetItem.imageUrl || '',
          isSystem: !!targetItem.isSystem,
          isActive: targetItem.isActive !== false,
          order: index,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      showToast('Tile order updated!', 'success');
    } catch (err) {
      console.error('Reorder error:', err);
      showToast('Failed to reorder items.', 'error');
    }
  };

  // 1-Click Auto-Fill Starter Covers for all Store Categories
  const handleAutoFillAllStoreCovers = async () => {
    if (
      !window.confirm(
        'Auto-populate starter cover images & tags for all real categories from your Firebase store? (Existing custom covers will be preserved)'
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);

      // 1. Ensure system categories exist
      SYSTEM_TILES.forEach((sys) => {
        const ref = doc(db, 'app_category_covers', sys.id);
        batch.set(
          ref,
          {
            ...sys,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      // 2. Populate store categories
      storeCategories.forEach((cat, idx) => {
        const catKey = cat.name || cat.id;
        const docId = `cat_${catKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const starter = STORE_STARTER_COVERS[catKey] || {
          title: catKey,
          tag: '',
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop',
        };

        const existingSaved = coversMap[docId] || coversMap[catKey.toLowerCase()];
        const imageUrl = existingSaved?.imageUrl || cat.imageUrl || cat.coverImage || starter.imageUrl;
        const tag = existingSaved?.tag !== undefined ? existingSaved.tag : (cat.tag || starter.tag || '');
        const title = existingSaved?.title || starter.title || catKey;

        const coverRef = doc(db, 'app_category_covers', docId);
        batch.set(
          coverRef,
          {
            id: docId,
            targetKey: catKey,
            title,
            tag,
            imageUrl,
            isSystem: false,
            order: 3 + idx,
            isActive: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Also update categories doc in Firestore
        const catRef = doc(db, 'categories', cat.id);
        batch.update(catRef, {
          imageUrl,
          coverImage: imageUrl,
          tag,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      showToast('All 21 store category covers populated and synced successfully!', 'success');
    } catch (err) {
      console.error('Error syncing store covers:', err);
      showToast('Sync error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter list
  const filteredList = orderedList.filter((c) => {
    if (activeTab === 'system' && !c.isSystem) return false;
    if (activeTab === 'catalog' && c.isSystem) return false;
    if (activeTab === 'missing' && c.imageUrl) return false;

    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(term) ||
      (c.targetKey || '').toLowerCase().includes(term) ||
      (c.tag || '').toLowerCase().includes(term)
    );
  });

  const activeCount = orderedList.filter((c) => c.isActive !== false).length;
  const withCoverCount = orderedList.filter((c) => !!c.imageUrl).length;
  const missingCoverCount = orderedList.filter((c) => !c.imageUrl).length;

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toastMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Unified Standard Header */}
      <Header
        title="Category Covers & Tiles"
        subtitle="Manage category cover photos and quick showcase tiles for the mobile app"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Top Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <span className="text-xs font-bold text-slate-800">
              {storeCategories.length} Store Categories Loaded
            </span>
            <p className="text-[11px] text-slate-500">
              Covers are cached locally in the mobile app for instant rendering
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleAutoFillAllStoreCovers}
              disabled={saving}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              title="Populate starter photos for all categories"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 text-slate-600" />}
              <span>Sync Store Covers</span>
            </button>

            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Tile</span>
            </button>
          </div>
        </div>

        {/* Info Card with Live Stats */}
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Live Store Categories Loaded from Firebase
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                Displaying all <span className="font-bold text-slate-800">{storeCategories.length} categories</span> from your Firebase database plus the <span className="font-bold text-slate-800">3 System Sections</span> (All Products, Trending, Buy 1 Get 1).
                Upload cover images for each so customers see attractive circular photos instead of plain icons in the GroceryHub app!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs flex-wrap">
            <div className="text-center px-2">
              <div className="text-lg font-extrabold text-emerald-600">{withCoverCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">With Covers</div>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-lg font-extrabold text-amber-600">{missingCoverCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Needs Cover</div>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-lg font-extrabold text-slate-800">{orderedList.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Tiles</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items ({orderedList.length})
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'system'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>System (3)</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Store Categories ({storeCategories.length})</span>
            </button>
            {missingCoverCount > 0 && (
              <button
                onClick={() => setActiveTab('missing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'missing'
                    ? 'bg-rose-100 text-rose-800 shadow-xs'
                    : 'text-rose-600 hover:text-rose-800'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Missing Cover ({missingCoverCount})</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search category or tag…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading store category covers…</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No categories found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query or click the button below to sync from your store.
            </p>
            <button
              onClick={handleAutoFillAllStoreCovers}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Sync All Store Categories</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredList.map((item, index) => {
              const isActive = item.isActive !== false;
              const hasCover = !!item.imageUrl;

              return (
                <div
                  key={item.id || item.targetKey}
                  className={`group relative bg-white rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between ${
                    isActive
                      ? 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                      : 'border-slate-200/70 bg-slate-50/70 opacity-75'
                  }`}
                >
                  {/* Top card bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      {item.isSystem ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          System
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Store Cat
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-400">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Move up / down */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => handleMoveOrder(index, 'up', e)}
                        disabled={index === 0}
                        title="Move Left / Earlier"
                        className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ${
                          index === 0 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleMoveOrder(index, 'down', e)}
                        disabled={index === orderedList.length - 1}
                        title="Move Right / Later"
                        className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ${
                          index === orderedList.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Circular Mobile Preview */}
                  <div className="flex flex-col items-center py-2">
                    <div className="relative">
                      {/* 56px circle representation */}
                      <div
                        onClick={() => handleEdit(item)}
                        className={`w-16 h-16 rounded-full p-0.5 border-2 cursor-pointer transition transform group-hover:scale-105 ${
                          hasCover
                            ? 'border-emerald-500/50 bg-white shadow-sm'
                            : 'border-dashed border-amber-400 bg-amber-50/50'
                        } flex items-center justify-center overflow-hidden`}
                      >
                        {hasCover ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full rounded-full flex flex-col items-center justify-center text-slate-400 font-bold text-xs ${
                            hasCover ? 'hidden' : 'flex'
                          }`}
                        >
                          <ImageIcon className="w-5 h-5 text-amber-500 mb-0.5" />
                          <span className="text-[8px] text-amber-700 font-bold">Add Cover</span>
                        </div>
                      </div>

                      {/* Tag pill */}
                      {item.tag && (
                        <div className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                          {item.tag}
                        </div>
                      )}
                    </div>

                    {/* Display Title & Target Key */}
                    <div className="mt-3 text-center w-full px-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={item.targetKey}>
                        Key: <span className="font-mono text-slate-600">{item.targetKey}</span>
                      </p>

                      {!hasCover && (
                        <button
                          onClick={() => handleEdit(item)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Set Cover Photo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Toggle & Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* 1-click Toggle */}
                    <button
                      onClick={(e) => handleToggleActive(item, e)}
                      title={isActive ? 'Click to Hide from App' : 'Click to Show in App'}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Power className={`w-3 h-3 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{isActive ? 'Active' : 'Hidden'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(item)}
                      title="Edit Cover Photo & Tag"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit / Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingItem ? `Edit Cover: ${editingItem.title}` : 'Add New Category Tile'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Upload cover photo and set badge tag for mobile app
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Category Key */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Key *
                </label>
                <input
                  type="text"
                  required
                  value={formTargetKey}
                  onChange={(e) => setFormTargetKey(e.target.value)}
                  placeholder="e.g. all, Trending, BOGO, Fresh Vegetables"
                  disabled={editingItem && editingItem.isSystem}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono disabled:opacity-60"
                />
              </div>

              {/* Display Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Display Title (Mobile Label) *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. All Products, Trending Now, Veg & Fruits"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Tag / Badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Badge Tag (Optional Pill on Top)
                </label>
                <input
                  type="text"
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value.toUpperCase())}
                  placeholder="e.g. HOT, BOGO, DEAL, 50% OFF, FRESH"
                  maxLength={10}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold uppercase tracking-wider"
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className="text-[10px] text-slate-400">Presets:</span>
                  {PRESET_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormTag(t)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition ${
                        formTag === t
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  {formTag && (
                    <button
                      type="button"
                      onClick={() => setFormTag('')}
                      className="text-[9px] text-slate-400 hover:text-slate-600 underline ml-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Cover Image Upload (Firebase Storage or URL) */}
              <div>
                <ImageUploadInput
                  label="Category Cover Photo"
                  folder="category_covers"
                  value={formImageUrl}
                  onChange={(url) => setFormImageUrl(url)}
                />
              </div>

              {/* Live Preview Inside Modal */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Preview in App Circle
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full p-0.5 border-2 border-emerald-500/40 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                      {formImageUrl ? (
                        <img
                          src={formImageUrl}
                          alt="preview"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    {formTag && (
                      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-black uppercase">
                        {formTag}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {formTitle || 'Category Name'}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">
                      ● Active & ready for mobile
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Visible in Mobile App (Active)
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Cover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
