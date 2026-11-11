import React, { useState, useEffect, useMemo } from 'react';
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
  LayoutTemplate,
  Check,
  Power,
  RefreshCw,
  Tag,
  Image as ImageIcon,
  Flame,
  Gift,
  ShoppingBag,
  Sliders,
  Layers,
  ChevronRight,
  Palette,
  Package,
  Percent,
  Grid,
  Store,
  PauseCircle,
  PlayCircle,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

// Preset color gradients for middle banners
const BANNER_GRADIENT_PRESETS = [
  {
    name: 'Warm Amber & Gold (Bakery)',
    colors: ['#FFF3E0', '#FFE0B2', '#FFCC80'],
    textColor: '#19251B',
  },
  {
    name: 'Soft Sunny Yellow (Baby Care)',
    colors: ['#FEF3C7', '#FDE68A', '#FBBF24'],
    textColor: '#19251B',
  },
  {
    name: 'Fresh Mint & Emerald',
    colors: ['#D1FAE5', '#A7F3D0', '#6EE7B7'],
    textColor: '#064E3B',
  },
  {
    name: 'Ocean Sky Blue',
    colors: ['#E0F2FE', '#BAE6FD', '#7DD3FC'],
    textColor: '#0C4A6E',
  },
  {
    name: 'Sunset Peach & Coral',
    colors: ['#FFEDD5', '#FED7AA', '#FDBA74'],
    textColor: '#7C2D12',
  },
  {
    name: 'Berry Blossom Pink',
    colors: ['#FCE7F3', '#FBCFE8', '#F9A8D4'],
    textColor: '#831843',
  },
  {
    name: 'Royal Lilac & Lavender',
    colors: ['#F3E8FF', '#E9D5FF', '#D8B4FE'],
    textColor: '#581C87',
  },
];

// Default configuration for "THE Grocery DEALS" curated showcase
const DEFAULT_GRAND_DEALS_CONFIG = {
  headerWord1: 'THE ',
  headerWord2: 'Grocery',
  headerWord3: ' DEALS',
  featuredCard: {
    badge: 'TOP\nDEALS',
    title: 'Shivam Salted Chuda',
    price: 60,
    mrp: 80,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop',
    targetCategory: 'Chips & Namkeen',
  },
  gridItems: [
    {
      discountTag: '30% OFF',
      title: 'Shivam Papdi Namkeen',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop',
      targetCategory: 'Chips & Namkeen',
    },
    {
      discountTag: '38% OFF',
      title: 'Shivam T.M.J Mixture',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop',
      targetCategory: 'Chips & Namkeen',
    },
    {
      discountTag: '25% OFF',
      title: 'Shivam Hara Matar',
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop',
      targetCategory: 'Chips & Namkeen',
    },
    {
      title: 'BEST BRAND\nOFFERS',
      subtitle: 'Explore Top Brands',
      targetCategory: 'all',
    },
  ],
  bottomPills: [
    {
      title: 'BUY 2 AT ₹299',
      subtitle: 'on Namkeen & Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&auto=format&fit=crop',
      targetCategory: 'Chips & Namkeen',
    },
    {
      title: 'Min 40% OFF',
      subtitle: 'on Gourmet Essentials',
      targetCategory: 'all',
    },
  ],
};

// Current 8 default mobile app home page sections
const DEFAULT_HOME_SECTIONS = [
  {
    id: 'sec_top_carousel',
    type: 'top_carousel',
    title: 'Top Promotional Banners (Carousel)',
    subtitle: 'Dynamic full-width banner slider managed in App Banners',
    order: 0,
    isActive: true,
    isSystem: true,
  },
  {
    id: 'sec_special_deals',
    type: 'special_deals',
    title: 'Today Special Deals',
    subtitle: 'Handpicked discounted products carousel',
    order: 1,
    isActive: true,
    isSystem: false,
  },
  {
    id: 'sec_grand_deals',
    type: 'grand_deals',
    title: 'The Grocery Deals Showcase',
    subtitle: 'Curated luxury deals and promotional offer cards with 2x2 grid',
    order: 2,
    isActive: true,
    isSystem: false,
    ...DEFAULT_GRAND_DEALS_CONFIG,
  },
  {
    id: 'sec_banner_bakery',
    type: 'promo_banner',
    title: 'Bakery & Biscuits',
    subtitle: 'Up to 25% Off on Cookies & Cakes',
    badge: 'OVEN FRESH BAKERY',
    buttonText: 'Shop Bakery',
    targetCategory: 'Bakery & Biscuits',
    categoryId: 'cat_bakery',
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop',
    gradientColors: ['#FFF3E0', '#FFE0B2', '#FFCC80'],
    order: 3,
    isActive: true,
    isSystem: false,
  },
  {
    id: 'sec_products_bakery',
    type: 'category_products',
    title: 'Bakery & Biscuits',
    subtitle: 'Fresh cookies, breads and sweet treats',
    targetCategory: 'Bakery & Biscuits',
    categoryId: 'cat_bakery',
    order: 4,
    isActive: true,
    isSystem: false,
  },
  {
    id: 'sec_trending_area',
    type: 'trending_area',
    title: 'Trending in Your Area',
    subtitle: 'Most popular products ordered by nearby customers',
    order: 5,
    isActive: true,
    isSystem: false,
  },
  {
    id: 'sec_banner_baby_care',
    type: 'promo_banner',
    title: 'Baby Care Essentials',
    subtitle: 'Up to 30% Off on Diapers & Wipes',
    badge: 'BABY CARE SPECIAL',
    buttonText: 'Shop Baby Care',
    targetCategory: 'Baby Care',
    categoryId: 'cat_baby_care',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&auto=format&fit=crop',
    gradientColors: ['#FEF3C7', '#FDE68A', '#FBBF24'],
    order: 6,
    isActive: true,
    isSystem: false,
  },
  {
    id: 'sec_products_baby_care',
    type: 'category_products',
    title: 'Baby Care Essentials',
    subtitle: 'Diapers, gentle wipes and baby hygiene',
    targetCategory: 'Baby Care',
    categoryId: 'cat_baby_care',
    order: 7,
    isActive: true,
    isSystem: false,
  },
];

// Product Select Modal Component
function ProductSelectModal({ isOpen, onClose, onSelect, items = [], categories = [] }) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCat === 'All' || item.category === selectedCat;
      const title = (item.title || item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const id = (item.id || '').toLowerCase();
      const term = search.toLowerCase();
      const matchSearch = !term || title.includes(term) || cat.includes(term) || id.includes(term);
      return matchCat && matchSearch;
    });
  }, [items, search, selectedCat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Product from Store Catalog</h3>
              <p className="text-[11px] text-slate-500">Pick any product to automatically populate title, price, discount & image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title (e.g. Shivam Chuda, Milk, Biscuit)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCat('All')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0 transition cursor-pointer ${
                selectedCat === 'All'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Products ({items.length})
            </button>
            {categories.slice(0, 10).map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCat(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex-shrink-0 transition cursor-pointer ${
                  selectedCat === c
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Product Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No products found matching "{search}".
            </div>
          ) : (
            filtered.map((item) => {
              const title = item.title || item.name || 'Unnamed Product';
              const img = item.imageUrl || item.image || (item.images && item.images[0]) || '';
              const price = item.price || 0;
              const off = item.offPercentage || 0;
              const mrp = item.mrp || (off > 0 ? Math.round(price / (1 - off / 100)) : 0);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {img ? (
                        <img src={img} alt={title} className="w-full h-full object-contain" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                          {title}
                        </h5>
                        {off > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black">
                            {off}% OFF
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-bold text-slate-800">₹{price}</span>
                        {mrp > price && (
                          <span className="line-through text-slate-400 text-[10px]">₹{mrp}</span>
                        )}
                        <span>•</span>
                        <span className="text-slate-400 truncate">{item.category}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(item);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white transition flex-shrink-0 cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppHomeLayoutView() {
  const { categories = [], items = [] } = useAdmin();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Mobile App Order Acceptance / Pause Control State
  const [appOrdersActive, setAppOrdersActive] = useState(true);
  const [appPauseMessage, setAppPauseMessage] = useState(
    'Online ordering is temporarily paused on our app. You can still browse products & prices!'
  );
  const [savingAppOrderStatus, setSavingAppOrderStatus] = useState(false);
  const [editingPauseNotice, setEditingPauseNotice] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [modalType, setModalType] = useState('category_products'); // 'category_products' | 'promo_banner' | 'grand_deals'

  // Product Picker Modal State
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productPickerTarget, setProductPickerTarget] = useState(null); // { type: 'featured' } | { type: 'grid', index: 0..3 } | { type: 'pill', index: 0..1 }

  // Generic Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formTargetCategory, setFormTargetCategory] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formButtonText, setFormButtonText] = useState('Shop Now');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formGradientColors, setFormGradientColors] = useState(['#FFF3E0', '#FFE0B2', '#FFCC80']);
  const [formIsActive, setFormIsActive] = useState(true);

  // Grand Deals Specific Form State
  const [grandWord1, setGrandWord1] = useState('THE ');
  const [grandWord2, setGrandWord2] = useState('Grocery');
  const [grandWord3, setGrandWord3] = useState(' DEALS');
  const [grandFeatured, setGrandFeatured] = useState(DEFAULT_GRAND_DEALS_CONFIG.featuredCard);
  const [grandGridItems, setGrandGridItems] = useState(DEFAULT_GRAND_DEALS_CONFIG.gridItems);
  const [grandBottomPills, setGrandBottomPills] = useState(DEFAULT_GRAND_DEALS_CONFIG.bottomPills);

  // Real store deal items for intelligent fallback display
  const liveStoreDeals = useMemo(() => {
    return items.filter((i) => i.isDeal || (i.offPercentage && i.offPercentage >= 15));
  }, [items]);

  // Show Toast
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time Firestore sync for `app_home_sections`
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'app_home_sections'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed default 8 sections
          try {
            const batch = writeBatch(db);
            DEFAULT_HOME_SECTIONS.forEach((sec) => {
              const ref = doc(db, 'app_home_sections', sec.id);
              batch.set(ref, {
                ...sec,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            });
            await batch.commit();
            console.log('Auto-seeded default home sections.');
          } catch (e) {
            console.error('Error auto-seeding home sections:', e);
          }
          setLoading(false);
          return;
        }

        const loaded = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setSections(loaded);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to app_home_sections:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time synchronization of Mobile App Orders Acceptance / Pause State
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const active =
          data.isAppAcceptingOrders !== undefined
            ? data.isAppAcceptingOrders !== false
            : data.isAcceptingOrders !== false;
        setAppOrdersActive(active);
        if (data.appOrderPauseMessage) {
          setAppPauseMessage(data.appOrderPauseMessage);
        } else if (data.orderPauseMessage) {
          setAppPauseMessage(data.orderPauseMessage);
        }
      }
    });
    return () => unsub();
  }, []);

  // Instant toggle for App Orders with real-time Firestore sync
  const handleToggleAppOrders = async () => {
    setSavingAppOrderStatus(true);
    const next = !appOrdersActive;
    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        {
          isAppAcceptingOrders: next,
          appOrderPauseMessage: appPauseMessage,
          appOrderPausedAt: next ? null : serverTimestamp(),
        },
        { merge: true }
      );
      setAppOrdersActive(next);
      showToast(
        next ? '✅ Mobile App Orders are now ACTIVE!' : '⏸️ Mobile App Orders are now PAUSED!',
        'success'
      );
    } catch (e) {
      console.error(e);
      showToast('Failed to update app order status', 'error');
    } finally {
      setSavingAppOrderStatus(false);
    }
  };

  // Save custom pause notice message
  const handleSavePauseNotice = async () => {
    setSavingAppOrderStatus(true);
    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        {
          appOrderPauseMessage: appPauseMessage,
        },
        { merge: true }
      );
      setEditingPauseNotice(false);
      showToast('Pause notice message updated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to update notice message', 'error');
    } finally {
      setSavingAppOrderStatus(false);
    }
  };

  // Open modal to add a Category Products section
  const handleAddCategorySection = () => {
    setEditingSection(null);
    setModalType('category_products');
    const firstCat = categories[0] || 'Dairy, Bread & Eggs';
    setFormTitle(firstCat);
    setFormSubtitle('Fresh arrivals delivered in 10 minutes');
    setFormTargetCategory(firstCat);
    setFormBadge('');
    setFormButtonText('');
    setFormImageUrl('');
    setFormIsActive(true);
    setModalOpen(true);
  };

  // Open modal to add a Middle Promo Banner
  const handleAddPromoBanner = () => {
    setEditingSection(null);
    setModalType('promo_banner');
    const firstCat = categories[0] || 'Drinks & Juices';
    setFormTitle('Summer Coolers & Drinks');
    setFormSubtitle('Up to 40% Off on juices & sodas');
    setFormTargetCategory(firstCat);
    setFormBadge('CHILLED REFRESH');
    setFormButtonText('Explore Drinks');
    setFormImageUrl('https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop');
    setFormGradientColors(['#E0F2FE', '#BAE6FD', '#7DD3FC']);
    setFormIsActive(true);
    setModalOpen(true);
  };

  // Open modal to add a Curated Deals Grid Showcase (The Grocery Deals style)
  const handleAddGrandDealsShowcase = () => {
    setEditingSection(null);
    setModalType('grand_deals');
    setFormTitle('The Grocery Deals Showcase');
    setFormSubtitle('Curated luxury deals and promotional offer cards');
    setGrandWord1('THE ');
    setGrandWord2('Grocery');
    setGrandWord3(' DEALS');
    setGrandFeatured({ ...DEFAULT_GRAND_DEALS_CONFIG.featuredCard });
    setGrandGridItems(DEFAULT_GRAND_DEALS_CONFIG.gridItems.map((g) => ({ ...g })));
    setGrandBottomPills(DEFAULT_GRAND_DEALS_CONFIG.bottomPills.map((p) => ({ ...p })));
    setFormIsActive(true);
    setModalOpen(true);
  };

  // Open modal to edit any section
  const handleEditSection = (sec) => {
    setEditingSection(sec);
    setModalType(sec.type || 'category_products');
    setFormTitle(sec.title || '');
    setFormSubtitle(sec.subtitle || '');
    setFormTargetCategory(sec.targetCategory || '');
    setFormBadge(sec.badge || '');
    setFormButtonText(sec.buttonText || 'Shop Now');
    setFormImageUrl(sec.imageUrl || '');
    setFormGradientColors(sec.gradientColors || ['#FFF3E0', '#FFE0B2', '#FFCC80']);
    setFormIsActive(sec.isActive !== false);

    // If grand_deals, fill its special state
    if (sec.type === 'grand_deals') {
      setGrandWord1(sec.headerWord1 || 'THE ');
      setGrandWord2(sec.headerWord2 || 'Grocery');
      setGrandWord3(sec.headerWord3 || ' DEALS');
      setGrandFeatured(sec.featuredCard || DEFAULT_GRAND_DEALS_CONFIG.featuredCard);
      setGrandGridItems(sec.gridItems || DEFAULT_GRAND_DEALS_CONFIG.gridItems);
      setGrandBottomPills(sec.bottomPills || DEFAULT_GRAND_DEALS_CONFIG.bottomPills);
    }

    setModalOpen(true);
  };

  // Handler when a product is picked from the ProductSelectModal
  const handleProductSelected = (product) => {
    if (!productPickerTarget) return;

    const pTitle = product.title || product.name || '';
    const pPrice = product.price || 0;
    const pOff = product.offPercentage || 0;
    const pMrp =
      product.mrp || (pOff > 0 ? Math.round(pPrice / (1 - pOff / 100)) : Math.round(pPrice * 1.3));
    const pImg = product.imageUrl || product.image || (product.images && product.images[0]) || '';
    const pCategory = product.category || 'all';

    if (productPickerTarget.type === 'featured') {
      setGrandFeatured({
        ...grandFeatured,
        title: pTitle,
        price: pPrice,
        mrp: pMrp,
        imageUrl: pImg,
        targetCategory: pCategory,
        badge: pOff > 0 ? `${pOff}%\nOFF` : 'TOP\nDEALS',
      });
      showToast(`Selected "${pTitle}" for Left Featured Card!`, 'success');
    } else if (productPickerTarget.type === 'grid') {
      const idx = productPickerTarget.index;
      const next = [...grandGridItems];
      next[idx] = {
        ...next[idx],
        title: pTitle,
        discountTag: pOff > 0 ? `${pOff}% OFF` : 'DEAL',
        imageUrl: pImg,
        targetCategory: pCategory,
      };
      setGrandGridItems(next);
      showToast(`Selected "${pTitle}" for Grid Card #${idx + 1}!`, 'success');
    } else if (productPickerTarget.type === 'pill') {
      const idx = productPickerTarget.index;
      const next = [...grandBottomPills];
      next[idx] = {
        ...next[idx],
        title: pTitle,
        subtitle: pOff > 0 ? `Min ${pOff}% OFF` : `on ${pCategory}`,
        imageUrl: pImg,
        targetCategory: pCategory,
      };
      setGrandBottomPills(next);
      showToast(`Selected "${pTitle}" for Deal Strip #${idx + 1}!`, 'success');
    }

    setProductPickerOpen(false);
  };

  // Quick 1-click Toggle Active/Hidden
  const handleToggleActive = async (sec, e) => {
    e.stopPropagation();
    try {
      const newStatus = !(sec.isActive !== false);
      const docRef = doc(db, 'app_home_sections', sec.id);
      await updateDoc(docRef, {
        isActive: newStatus,
        updatedAt: serverTimestamp(),
      });
      showToast(
        newStatus
          ? `"${sec.title}" is now ACTIVE on mobile home screen.`
          : `"${sec.title}" is now HIDDEN from home screen.`,
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
    if (!formTitle.trim()) {
      showToast('Please enter section title.', 'error');
      return;
    }

    setSaving(true);
    try {
      const secId =
        editingSection?.id ||
        (modalType === 'promo_banner'
          ? `sec_banner_${Date.now()}`
          : modalType === 'grand_deals'
          ? `sec_grand_deals_${Date.now()}`
          : `sec_cat_${formTargetCategory.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`);

      const docRef = doc(db, 'app_home_sections', secId);

      const payload = {
        id: secId,
        type: editingSection?.type || modalType,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        isActive: formIsActive,
        updatedAt: serverTimestamp(),
      };

      if (modalType === 'category_products' || editingSection?.type === 'category_products') {
        payload.targetCategory = formTargetCategory.trim();
      }

      if (modalType === 'promo_banner' || editingSection?.type === 'promo_banner') {
        payload.targetCategory = formTargetCategory.trim();
        payload.badge = formBadge.trim().toUpperCase();
        payload.buttonText = formButtonText.trim() || 'Shop Now';
        payload.imageUrl = formImageUrl.trim();
        payload.gradientColors = formGradientColors;
      }

      if (modalType === 'grand_deals' || editingSection?.type === 'grand_deals') {
        payload.headerWord1 = grandWord1;
        payload.headerWord2 = grandWord2;
        payload.headerWord3 = grandWord3;
        payload.featuredCard = grandFeatured;
        payload.gridItems = grandGridItems;
        payload.bottomPills = grandBottomPills;
      }

      if (!editingSection) {
        payload.order = sections.length;
        payload.createdAt = serverTimestamp();
      }

      await setDoc(docRef, payload, { merge: true });
      showToast(editingSection ? 'Section updated successfully!' : 'New home section added!', 'success');
      setModalOpen(false);
    } catch (err) {
      console.error('Save error:', err);
      showToast('Error saving section: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Move Section Up / Down
  const handleMoveOrder = async (index, direction, e) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    try {
      const batch = writeBatch(db);
      const currentItem = sections[index];
      const targetItem = sections[targetIndex];

      batch.update(doc(db, 'app_home_sections', currentItem.id), {
        order: targetIndex,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'app_home_sections', targetItem.id), {
        order: index,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      showToast('Layout sequence updated!', 'success');
    } catch (err) {
      console.error('Reorder error:', err);
      showToast('Failed to reorder sections.', 'error');
    }
  };

  // Delete Section
  const handleDeleteSection = async (sec, e) => {
    e.stopPropagation();
    if (sec.isSystem) {
      alert(`"${sec.title}" is a core section. You can toggle it to "Hidden" instead of deleting.`);
      return;
    }

    if (!window.confirm(`Delete "${sec.title}" section from home screen?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'app_home_sections', sec.id));
      showToast(`Section "${sec.title}" removed.`, 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete section.', 'error');
    }
  };

  // Reset to Default 8 Sections
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'Reset home screen layout to the standard 8 default sections? (Existing custom sections will be preserved)'
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);
      DEFAULT_HOME_SECTIONS.forEach((sec) => {
        const ref = doc(db, 'app_home_sections', sec.id);
        batch.set(
          ref,
          {
            ...sec,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
      await batch.commit();
      showToast('Default home layout restored!', 'success');
    } catch (err) {
      console.error('Reset error:', err);
      showToast('Failed to reset defaults.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = sections.filter((s) => s.isActive !== false).length;
  const hiddenCount = sections.filter((s) => s.isActive === false).length;

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/60 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold ${
              toastMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-900/10'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-900/10'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Banner / Breadcrumb */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shadow-xs">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  Mobile App Builder
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Home Page Dynamic Layout</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                Home Screen Layout & Sections
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleResetDefaults}
              disabled={saving}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs cursor-pointer"
              title="Reset to default 8 sections"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleAddCategorySection}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm hover:shadow shadow-purple-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category Shelf</span>
            </button>

            <button
              onClick={handleAddPromoBanner}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition shadow-sm hover:shadow shadow-amber-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Middle Banner</span>
            </button>

            <button
              onClick={handleAddGrandDealsShowcase}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 transition shadow-sm hover:shadow shadow-rose-700/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Add Deals Grid Showcase</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* Mobile App Order Acceptance & Pause Master Controller */}
        <div
          className={`mb-6 rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
            appOrdersActive
              ? 'bg-gradient-to-r from-emerald-50/80 via-emerald-50/30 to-white border-emerald-200'
              : 'bg-gradient-to-r from-rose-50/90 via-rose-50/40 to-white border-rose-300 ring-2 ring-rose-500/20'
          }`}
        >
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 transition-colors ${
                  appOrdersActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-rose-600 text-white shadow-md shadow-rose-600/20 animate-pulse'
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Mobile App Ordering
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                      appOrdersActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        appOrdersActive ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
                      }`}
                    />
                    {appOrdersActive ? 'Active & Accepting Orders' : 'Orders Paused'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {appOrdersActive ? (
                    <span>
                      Customers using the Android / iOS mobile app can freely add products to cart and proceed through checkout to place orders.
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-900">
                      Ordering is paused on the mobile app. A notice banner is displayed, and the checkout button is disabled with your custom message.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setEditingPauseNotice(!editingPauseNotice)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span>{editingPauseNotice ? 'Hide Notice Editor' : 'Edit Pause Notice'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleAppOrders}
                disabled={savingAppOrderStatus}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 ${
                  appOrdersActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                {savingAppOrderStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : appOrdersActive ? (
                  <PauseCircle className="w-4 h-4" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                <span>
                  {appOrdersActive ? 'Pause App Orders Now' : 'Resume App Orders (Turn ON)'}
                </span>
              </button>
            </div>
          </div>

          {/* Expandable Pause Notice Message Editor */}
          {editingPauseNotice && (
            <div className="border-t border-slate-200/80 bg-white/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Customer Notice Message (Displayed on App when paused)</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Visible on Home Header, Cart & Checkout
                </span>
              </div>

              <textarea
                rows={2}
                value={appPauseMessage}
                onChange={(e) => setAppPauseMessage(e.target.value)}
                placeholder="Enter the notice message shown to customers on the app..."
                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800"
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] font-bold text-slate-500">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() =>
                    setAppPauseMessage(
                      'Online ordering is temporarily paused due to heavy order rush. We will resume taking orders in 30 minutes!'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  ⚡ High Order Rush
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAppPauseMessage(
                      'Store is closed for the day. We will reopen tomorrow morning at 7:00 AM!'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  🌙 Store Closed for Day
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAppPauseMessage(
                      'App ordering is paused for a short maintenance update. You can browse all products freely!'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  🛠️ Maintenance Update
                </button>
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={handleSavePauseNotice}
                    disabled={savingAppOrderStatus}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-xs cursor-pointer"
                  >
                    {savingAppOrderStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Notice</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-purple-500/10 via-amber-500/5 to-transparent border border-purple-500/20 rounded-2xl p-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Visual Home Screen Arrangement
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                Control exactly what customers see on the GroceryHub mobile home screen from top to bottom.
                Pick items from your <span className="font-bold text-slate-800">{items.length} store products</span> directly without re-uploading images, customize the luxury <span className="font-bold text-rose-800">"THE Grocery DEALS"</span> 2x2 grid showcase, or insert middle promo banner cards anywhere!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-center px-2">
              <div className="text-lg font-extrabold text-emerald-600">{activeCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active in App</div>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-lg font-extrabold text-slate-400">{hiddenCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hidden</div>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-lg font-extrabold text-purple-700">{sections.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Sections</div>
            </div>
          </div>
        </div>

        {/* Content Section List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading home screen layout…</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <LayoutTemplate className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No layout sections found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click the button below to initialize the standard 8 home screen sections.
            </p>
            <button
              onClick={handleResetDefaults}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Initialize Default Sections</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((sec, index) => {
              const isActive = sec.isActive !== false;
              const isPromoBanner = sec.type === 'promo_banner';
              const isCategoryProducts = sec.type === 'category_products';
              const isTopCarousel = sec.type === 'top_carousel';
              const isSpecialDeals = sec.type === 'special_deals';
              const isGrandDeals = sec.type === 'grand_deals';
              const isTrendingArea = sec.type === 'trending_area';

              const grandConf = isGrandDeals
                ? {
                    ...DEFAULT_GRAND_DEALS_CONFIG,
                    ...sec,
                  }
                : null;

              return (
                <div
                  key={sec.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 p-5 ${
                    isActive
                      ? 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      : 'border-slate-200/70 bg-slate-50/70 opacity-60'
                  }`}
                >
                  {/* Top Bar: Position, Type Badge, Reorder, Status Toggle, Actions */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Position & Type Icon */}
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Position Badge & Reorder */}
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={(e) => handleMoveOrder(index, 'up', e)}
                          disabled={index === 0}
                          title="Move Up"
                          className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ${
                            index === 0 ? 'opacity-20 cursor-not-allowed' : ''
                          }`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-extrabold text-slate-500 font-mono">
                          #{index + 1}
                        </span>
                        <button
                          onClick={(e) => handleMoveOrder(index, 'down', e)}
                          disabled={index === sections.length - 1}
                          title="Move Down"
                          className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ${
                            index === sections.length - 1 ? 'opacity-20 cursor-not-allowed' : ''
                          }`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Section Type Icon & Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                            isTopCarousel
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : isPromoBanner
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : isCategoryProducts
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : isGrandDeals
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {isTopCarousel && <Smartphone className="w-6 h-6" />}
                          {isPromoBanner && <ImageIcon className="w-6 h-6" />}
                          {isCategoryProducts && <ShoppingBag className="w-6 h-6" />}
                          {isGrandDeals && <Sparkles className="w-6 h-6" />}
                          {isSpecialDeals && <Flame className="w-6 h-6" />}
                          {isTrendingArea && <Flame className="w-6 h-6" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {sec.title}
                            </h4>

                            {/* Type Pill */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                                isPromoBanner
                                  ? 'bg-amber-100 text-amber-800'
                                  : isCategoryProducts
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isGrandDeals
                                  ? 'bg-rose-100 text-rose-900 font-black'
                                  : isTopCarousel
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isPromoBanner
                                ? 'Middle Banner Card'
                                : isCategoryProducts
                                ? 'Category Shelf'
                                : isGrandDeals
                                ? 'Curated Deals Grid'
                                : isTopCarousel
                                ? 'Top Carousel'
                                : 'Curated Section'}
                            </span>

                            {sec.badge && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black tracking-wider uppercase">
                                {sec.badge}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {sec.subtitle || (sec.targetCategory ? `Category: ${sec.targetCategory}` : '')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2.5 flex-shrink-0 self-end md:self-center">
                      {/* Active/Hidden Toggle */}
                      <button
                        onClick={(e) => handleToggleActive(sec, e)}
                        title={isActive ? 'Click to Hide from App' : 'Click to Show in App'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        <Power className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{isActive ? 'Active' : 'Hidden'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditSection(sec)}
                        title="Edit Section Details"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition border border-slate-200 hover:border-purple-200 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>{isGrandDeals ? 'Edit Showcase & Items' : 'Edit'}</span>
                      </button>

                      {/* Delete */}
                      {!sec.isSystem && (
                        <button
                          onClick={(e) => handleDeleteSection(sec, e)}
                          title="Delete Section"
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200 hover:border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SPECIAL RICH VISUAL PREVIEW FOR "THE GROCERY DEALS" */}
                  {isGrandDeals && grandConf && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Showcase Layout Preview (2-Column Grid & Deals)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditSection(sec)}
                          className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                        >
                          Pick Products & Customize →
                        </button>
                      </div>

                      {/* Mini Realistic Representation */}
                      <div className="bg-gradient-to-b from-amber-50/60 to-amber-100/40 rounded-2xl border border-amber-200/80 p-4 max-w-2xl">
                        {/* Header */}
                        <div className="text-center font-serif font-black text-xs text-amber-950 mb-3 tracking-widest">
                          <span>{grandConf.headerWord1 || 'THE '}</span>
                          <span className="italic font-black text-rose-800 text-sm">{grandConf.headerWord2 || 'Grocery'}</span>
                          <span>{grandConf.headerWord3 || ' DEALS'}</span>
                        </div>

                        {/* 2-Column: Left Tall Card + Right 2x2 Grid */}
                        <div className="grid grid-cols-12 gap-2.5">
                          {/* Left Tall Card */}
                          <div className="col-span-5 bg-[#F3E7D8] rounded-xl p-2.5 border border-[#E8D4BE] flex flex-col justify-between items-center text-center">
                            <span className="font-serif font-black text-[9px] text-[#7A1832] leading-tight">
                              {(grandConf.featuredCard?.badge || 'TOP DEALS').replace('\n', ' ')}
                            </span>
                            <div className="my-1 bg-[#6B4E3D] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                              ₹{grandConf.featuredCard?.price || 60}
                              <span className="text-[8px] line-through text-white/60 ml-1">
                                ₹{grandConf.featuredCard?.mrp || 80}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-800 line-clamp-1 mb-1.5">
                              {grandConf.featuredCard?.title || 'Shivam Salted Chuda'}
                            </span>
                            <div className="w-full h-16 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden">
                              {grandConf.featuredCard?.imageUrl ? (
                                <img
                                  src={grandConf.featuredCard?.imageUrl}
                                  alt="featured"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-amber-600" />
                              )}
                            </div>
                          </div>

                          {/* Right 2x2 Grid */}
                          <div className="col-span-7 grid grid-cols-2 gap-2">
                            {grandConf.gridItems?.slice(0, 4).map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-[#F3E7D8] rounded-xl p-1.5 border border-[#E8D4BE] flex flex-col justify-between items-center text-center"
                              >
                                {item.discountTag ? (
                                  <span className="bg-[#4A3427] text-white text-[7px] font-extrabold px-1.5 py-0.5 rounded">
                                    {item.discountTag}
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-serif font-bold text-[#6B4E3D]">
                                    {item.title ? item.title.split('\n')[0] : 'BRAND'}
                                  </span>
                                )}
                                <span className="text-[9px] font-bold text-slate-800 line-clamp-1 my-0.5">
                                  {item.title ? item.title.replace('\n', ' ') : 'Offers'}
                                </span>
                                {item.imageUrl ? (
                                  <div className="w-full h-9 bg-white rounded p-0.5 flex items-center justify-center overflow-hidden">
                                    <img src={item.imageUrl} alt="grid" className="w-full h-full object-contain" />
                                  </div>
                                ) : (
                                  <div className="w-full h-9 bg-[#EADBCA] rounded flex items-center justify-center text-[8px] font-serif font-bold text-[#7A1832]">
                                    ★ OFFERS
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom 2 Deal Pills */}
                        <div className="grid grid-cols-2 gap-2 mt-2.5">
                          {grandConf.bottomPills?.slice(0, 2).map((pill, idx) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-r from-[#B58E6B] to-[#A17855] text-white rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10px]"
                            >
                              <div className="truncate">
                                <div className="font-extrabold truncate">{pill.title}</div>
                                <div className="text-[8px] text-white/80 truncate">{pill.subtitle}</div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    modalType === 'grand_deals'
                      ? 'bg-rose-100 text-rose-800'
                      : modalType === 'promo_banner'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {modalType === 'grand_deals' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : modalType === 'promo_banner' ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <ShoppingBag className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingSection
                      ? `Edit: ${editingSection.title}`
                      : modalType === 'grand_deals'
                      ? 'Create New "THE Grocery DEALS" Showcase'
                      : modalType === 'promo_banner'
                      ? 'Add Middle Promo Banner Card'
                      : 'Add Category Product Section'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {modalType === 'grand_deals'
                      ? 'Pick products from your store list without re-uploading images'
                      : modalType === 'promo_banner'
                      ? 'Configure full-width promotional card with banner image and button'
                      : 'Configure horizontal product carousel from a grocery category'}
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
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Section Heading & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Section Name (Admin Label) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. The Grocery Deals Showcase"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtitle / Description
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="e.g. Curated luxury deals and promotional offer cards"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* 1. CATEGORY PRODUCT SECTION FORM */}
              {modalType === 'category_products' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Grocery Category *
                  </label>
                  <select
                    value={formTargetCategory}
                    onChange={(e) => {
                      setFormTargetCategory(e.target.value);
                      if (!formTitle || formTitle === formTargetCategory) {
                        setFormTitle(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="">Select a Category</option>
                    {categories.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 2. PROMO MIDDLE BANNER FORM */}
              {modalType === 'promo_banner' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Link / Category *
                    </label>
                    <select
                      value={formTargetCategory}
                      onChange={(e) => setFormTargetCategory(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="">Select Target Category</option>
                      {categories.map((catName) => (
                        <option key={catName} value={catName}>
                          {catName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Badge Pill (e.g. OVEN FRESH, BABY CARE SPECIAL)
                      </label>
                      <input
                        type="text"
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value.toUpperCase())}
                        placeholder="e.g. OVEN FRESH BAKERY"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold uppercase tracking-wider"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={formButtonText}
                        onChange={(e) => setFormButtonText(e.target.value)}
                        placeholder="e.g. Shop Bakery, Explore Now"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <ImageUploadInput
                      label="Middle Banner Image"
                      folder="home_banners"
                      value={formImageUrl}
                      onChange={(url) => setFormImageUrl(url)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Card Background Gradient
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {BANNER_GRADIENT_PRESETS.map((preset) => {
                        const isSelected =
                          JSON.stringify(formGradientColors) === JSON.stringify(preset.colors);
                        return (
                          <div
                            key={preset.name}
                            onClick={() => setFormGradientColors(preset.colors)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                              isSelected
                                ? 'border-purple-600 ring-2 ring-purple-500/20 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-lg border border-black/10 shadow-xs flex-shrink-0"
                                style={{
                                  background: `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                                }}
                              />
                              <span className="text-[11px] font-semibold text-slate-800 truncate">
                                {preset.name}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* 3. GRAND DEALS SHOWCASE RICH FORM (THE Grocery DEALS) */}
              {modalType === 'grand_deals' && (
                <div className="space-y-4 pt-1">
                  {/* Top Branding Words */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <label className="block text-xs font-bold text-amber-900 mb-1.5">
                      Showcase Header Branding (3-Part Serif Logo)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={grandWord1}
                        onChange={(e) => setGrandWord1(e.target.value)}
                        placeholder="THE "
                        className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-serif font-bold text-center"
                      />
                      <input
                        type="text"
                        value={grandWord2}
                        onChange={(e) => setGrandWord2(e.target.value)}
                        placeholder="Grocery"
                        className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-serif italic font-bold text-rose-800 text-center"
                      />
                      <input
                        type="text"
                        value={grandWord3}
                        onChange={(e) => setGrandWord3(e.target.value)}
                        placeholder=" DEALS"
                        className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-serif font-bold text-center"
                      />
                    </div>
                  </div>

                  {/* Left Tall Featured Product Card */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-rose-600" />
                        <span>Left Featured Deal Card</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setProductPickerTarget({ type: 'featured' });
                          setProductPickerOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5 text-emerald-700" />
                        <span>📦 Pick from Store Products</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Product Title</label>
                        <input
                          type="text"
                          value={grandFeatured.title || ''}
                          onChange={(e) => setGrandFeatured({ ...grandFeatured, title: e.target.value })}
                          placeholder="e.g. Shivam Salted Chuda"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Badge (e.g. TOP DEALS)</label>
                        <input
                          type="text"
                          value={grandFeatured.badge || ''}
                          onChange={(e) => setGrandFeatured({ ...grandFeatured, badge: e.target.value })}
                          placeholder="TOP\nDEALS"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Deal Price (₹)</label>
                        <input
                          type="number"
                          value={grandFeatured.price || 0}
                          onChange={(e) => setGrandFeatured({ ...grandFeatured, price: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Original MRP (₹)</label>
                        <input
                          type="number"
                          value={grandFeatured.mrp || 0}
                          onChange={(e) => setGrandFeatured({ ...grandFeatured, mrp: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <ImageUploadInput
                        label="Featured Product Image (Auto-filled on product selection or custom upload)"
                        folder="grand_deals"
                        value={grandFeatured.imageUrl || ''}
                        onChange={(url) => setGrandFeatured({ ...grandFeatured, imageUrl: url })}
                      />
                    </div>
                  </div>

                  {/* Right 2x2 Grid Items (4 items) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Grid className="w-3.5 h-3.5 text-amber-600" />
                        <span>Right 2x2 Deals Grid (4 Product Cards)</span>
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400">Pick products or customize</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {grandGridItems.map((item, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                          <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                            <span className="font-bold text-slate-800">Grid Card #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setProductPickerTarget({ type: 'grid', index: idx });
                                setProductPickerOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                            >
                              <Package className="w-3 h-3 text-emerald-600" />
                              <span>Pick Product</span>
                            </button>
                          </div>

                          {idx < 3 ? (
                            <>
                              <div>
                                <input
                                  type="text"
                                  value={item.discountTag || ''}
                                  onChange={(e) => {
                                    const next = [...grandGridItems];
                                    next[idx].discountTag = e.target.value;
                                    setGrandGridItems(next);
                                  }}
                                  placeholder="Discount Tag (e.g. 30% OFF)"
                                  className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={item.title || ''}
                                  onChange={(e) => {
                                    const next = [...grandGridItems];
                                    next[idx].title = e.target.value;
                                    setGrandGridItems(next);
                                  }}
                                  placeholder="Title (e.g. Shivam Papdi Namkeen)"
                                  className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                                />
                              </div>
                              <div>
                                <ImageUploadInput
                                  label="Thumbnail"
                                  folder="grand_deals"
                                  value={item.imageUrl || ''}
                                  onChange={(url) => {
                                    const next = [...grandGridItems];
                                    next[idx].imageUrl = url;
                                    setGrandGridItems(next);
                                  }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <input
                                  type="text"
                                  value={item.title || ''}
                                  onChange={(e) => {
                                    const next = [...grandGridItems];
                                    next[idx].title = e.target.value;
                                    setGrandGridItems(next);
                                  }}
                                  placeholder="Line 1 (e.g. BEST BRAND OFFERS)"
                                  className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={item.subtitle || ''}
                                  onChange={(e) => {
                                    const next = [...grandGridItems];
                                    next[idx].subtitle = e.target.value;
                                    setGrandGridItems(next);
                                  }}
                                  placeholder="Line 2 (e.g. Explore Top Brands)"
                                  className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom 2 Deal Pills */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-amber-700" />
                      <span>Bottom 2 Horizontal Deal Strips</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {grandBottomPills.map((pill, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">Strip #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setProductPickerTarget({ type: 'pill', index: idx });
                                setProductPickerOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                            >
                              <Package className="w-3 h-3 text-emerald-600" />
                              <span>Pick Product</span>
                            </button>
                          </div>
                          <div>
                            <input
                              type="text"
                              value={pill.title || ''}
                              onChange={(e) => {
                                const next = [...grandBottomPills];
                                next[idx].title = e.target.value;
                                setGrandBottomPills(next);
                              }}
                              placeholder="Title (e.g. BUY 2 AT ₹299)"
                              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={pill.subtitle || ''}
                              onChange={(e) => {
                                const next = [...grandBottomPills];
                                next[idx].subtitle = e.target.value;
                                setGrandBottomPills(next);
                              }}
                              placeholder="Subtitle (e.g. on Namkeen & Snacks)"
                              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </div>
                          {idx === 0 && (
                            <div>
                              <ImageUploadInput
                                label="Strip Thumbnail"
                                folder="grand_deals"
                                value={pill.imageUrl || ''}
                                onChange={(url) => {
                                  const next = [...grandBottomPills];
                                  next[idx].imageUrl = url;
                                  setGrandBottomPills(next);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Active Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Visible on Mobile Home Screen (Active)
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
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSection ? 'Save Showcase' : 'Add to Home Screen'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Select Modal for Easy 1-Click Product Addition (Always on top with z-[100]) */}
      <ProductSelectModal
        isOpen={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        onSelect={handleProductSelected}
        items={items}
        categories={categories}
      />
    </div>
  );
}
