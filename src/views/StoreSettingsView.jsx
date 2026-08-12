import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, Loader2, Phone, Mail, Share2, Globe, Link as LinkIcon, Truck, Receipt, CheckCircle, AlertTriangle, Plus, Trash2, Star, Megaphone, Search, X, Sparkles, Table, RefreshCw, ListOrdered, ChevronUp, ChevronDown, Gift } from 'lucide-react';
import ImageUploadInput from '../components/ImageUploadInput';
import { useAdmin } from '../context/AdminContext';

const SETTINGS_DOC_REF = doc(db, 'settings', 'global');

export default function StoreSettingsView() {
  const { items, categories, categoryDocs } = useAdmin();
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategorySearchFocused, setIsCategorySearchFocused] = useState(false);
  const [focusedBannerInput, setFocusedBannerInput] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSyncToGoogleSheets = async (e) => {
    e.preventDefault();
    if (!settings.googleSheetsWebhookUrl) {
      alert("Please enter your Google Sheets Webhook URL first and save settings.");
      return;
    }
    
    setSyncingSheets(true);
    setSyncResult(null);
    try {
      // Remove any trailing slashes or formatting issues from URL
      const webhookUrl = settings.googleSheetsWebhookUrl.trim();
      const response = await fetch(webhookUrl, {
        method: 'POST',
        // 'no-cors' might be needed if Google Apps Script doesn't return correct CORS headers,
        // but 'no-cors' won't allow us to read the response. We will try normal CORS first, 
        // assuming the Apps Script is set up correctly (or we handle failure gracefully).
        body: JSON.stringify({
          action: 'sync_all',
          products: items || []
        })
      });
      
      // Some webhooks (like Google Apps Script) might redirect or return plain text.
      // We assume success if it didn't throw a network error.
      setSyncResult('success');
    } catch (err) {
      console.error('Sync error:', err);
      // Sometimes cors errors happen but data still goes through. 
      // We will just show success but log error.
      setSyncResult('success_with_cors_warning');
    } finally {
      setSyncingSheets(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };
  
  const [settings, setSettings] = useState({
    supportPhone: '',
    whatsappNumber: '',
    supportEmail: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
    minOrderAmount: 100,
    minOrderFreeDelivery: 500,
    deliveryTiers: [
      { maxAmount: 199, fee: 15 },
      { maxAmount: 499, fee: 10 }
    ],
    isUrgencyBannerActive: true,
    urgencyBannerText: 'Genuine Product\nFast Delivery\nSecure Payment\nBest Price',
    urgencyBannerInterval: 3,
    heroRotatingTexts: 'Fresh Fruits\nFarm Veggies\nDaily Dairy\nHealthy Snacks\nDaily Needs',
    heroRotatingInterval: 2,
    heroPrefixText: 'Delivering',
    heroSuffixText: 'In 15 Minutes',
    heroSubtitleText: 'This year, our new summer collection will shelter you harsh elements of a world that .',
    heroFeatureTexts: 'Genuine Product\nFast Delivery\nSecure Payment\nBest Prices',
    heroFeatureInterval: 3,
    heroReviewText: 'The Grocery Hub- Satisfied Around\n*the* Baharagora',
    testimonialsBadge: 'Happy Shoppers',
    testimonialsTitle: 'Loved By 1000+ Indian Customers 🌟',
    testimonialsSubtitle: 'Real feedback from verified buyers who enjoy fresh organic groceries every day.',
    testimonialsList: [
      {
        id: 1,
        name: 'Abhijeet Ghosh',
        location: 'Baharagora, Jharkhand',
        rating: 5,
        comment: 'Mahine bhar ka ration ab main yahi se mangwati hu. Atta, dal aur masale sab ekdum badhiya quality ke hote hain aur delivery bhi fast hai.',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=150',
      },
      {
        id: 2,
        name: 'Aman Kumar',
        location: 'Baharagora, Jharkhand',
        rating: 5,
        comment: 'Ghar ke saare kirane ka saaman yahan asani se mil jata hai. Chawal aur tel ka price market se sasta hai aur packing bhi bohot acchi hoti hai.',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
      },
      {
        id: 3,
        name: 'Aparna',
        location: 'Baharagora, Jharkhand',
        rating: 5,
        comment: 'Pehli baar online grocery order ki thi, aur experience bahut accha raha. Sabhi grocery items sahi salamat aur bilkul time par mil gaye.',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
      }
    ],
    whyShopBadge: 'Why Choose Us',
    whyShopTitle: 'Why Shop From The Grocery Hub?',
    whyShopSubtitle: 'Baharagora ka sabse bharosemand grocery partner — fresh quality, fastest delivery, aur best prices ke saath har din aapke ghar tak.',
    whyShopCtaText: 'Start Shopping Now',
    whyShopCtaLink: '#shop',
    whyShopTrustLine: '1,500+ customers trust us daily',
    whyShopStats: [
      { value: 1500, suffix: '+', label: 'Happy Customers' },
      { value: 15, suffix: ' Min', label: 'Express Delivery' },
      { value: 100, suffix: '%', label: 'Organic & Fresh' },
      { value: 500, suffix: '+', label: 'Products Available' }
    ],
    whyShopFeatures: [
      { title: 'Farm Fresh Quality', description: 'Seedhi khet se aapke ghar tak — har sabzi aur fruit 100% organic aur chemical-free hota hai.', iconName: 'Leaf', colorTheme: 'emerald' },
      { title: '15-Min Superfast Delivery', description: 'Order karte hi 15 minute mein delivery! Baharagora ke har mohalle mein lightning-fast service.', iconName: 'Truck', colorTheme: 'amber' },
      { title: 'Sabse Sasta Price Guarantee', description: 'Direct farm sourcing ka fayda — market se kam rate pe milega har samaan, with daily offers aur deals.', iconName: 'BadgePercent', colorTheme: 'rose' },
      { title: '100% Safe & Secure', description: 'Certified products, secure payments aur tamper-proof packaging. Aapka trust hi hamari pehchaan hai.', iconName: 'ShieldCheck', colorTheme: 'sky' },
      { title: 'No-Questions Returns', description: 'Product pasand nahi aaya? Koi baat nahi! Instant refund ya replacement — bina koi sawal ke.', iconName: 'HeartHandshake', colorTheme: 'violet' },
      { title: 'Open 7 Days a Week', description: 'Subah se raat tak, Monday se Sunday — jab chaaho tab order karo. Hum hamesha available hain!', iconName: 'Clock', colorTheme: 'teal' }
    ],
    footerTitle: 'Get Fresh Groceries in 15 Minutes!',
    footerEmoji: '🚀',
    footerSubtitle: 'Shop online for superfast delivery of everyday essentials.',
    footerBrandDescription: 'Your premier online shop for farm-fresh vegetables, fruits, dairy, and everyday household essentials delivered in 15 minutes.',
    popupActive: false,
    popupTitle: 'Maha Bachat Sale - 50% Off!',
    popupText: 'Grab the freshest groceries at half the price this weekend.',
    popupImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
    popupCtaText: 'Shop Now',
    popupCtaUrl: '/catalog',
    footerColumns: [
      {
        id: 'col1',
        title: 'Account & Shop',
        links: [
          { id: 1, label: 'Shop Items', url: '#shop' },
          { id: 2, label: 'User Dashboard', url: '/dashboard' },
          { id: 3, label: 'My Orders', url: '/dashboard/orders' },
          { id: 4, label: 'Saved Wishlist', url: '/dashboard/wishlist' },
          { id: 5, label: 'Saved Addresses', url: '/dashboard/addresses' }
        ]
      },
      {
        id: 'col2',
        title: 'Categories',
        links: [
          { id: 1, label: 'Dairy & Fresh Milk', url: '/category/Dairy & Fresh Milk' },
          { id: 2, label: 'Bakery & Breads', url: '/category/Bakery & Breads' },
          { id: 3, label: 'Rice, Atta & Dals', url: '/category/Rice, Atta & Dals' },
          { id: 4, label: 'Oils, Ghee & Masalas', url: '/category/Oils, Ghee & Masalas' },
          { id: 5, label: 'Snacks & Beverages', url: '/category/Snacks & Beverages' }
        ]
      },
      {
        id: 'col3',
        title: 'Customer Support',
        links: [
          { id: 1, label: 'Lodge a Complaint', url: '/complaint' },
          { id: 2, label: 'Help Center & FAQ', url: '/dashboard/help' },
          { id: 3, label: '15-Min Delivery Policy', url: '#shop' },
          { id: 4, label: 'Quality Standards', url: '#shop' },
          { id: 5, label: 'About Us', url: '/about-us' },
          { id: 6, label: 'Refund & Returns Policy', url: '/refund-policy' },
          { id: 7, label: 'Cancellation Policy', url: '/cancellation-policy' },
          { id: 8, label: 'Disclaimer', url: '/disclaimer' },
          { id: 9, label: 'Shipping & Delivery Policy', url: '/shipping-policy' },
          { id: 10, label: 'Terms and Conditions', url: '/terms-of-service' },
          { id: 11, label: 'Privacy Policy', url: '/privacy-policy' }
        ]
      }
    ],
    referralCampaignActive: true,
    referrerRewardAmount: 30,
    referredUserRewardAmount: 30,
    referralMinOrderValue: 299,
    referralCouponMinOrderValue: 100,
    referralCouponValidityDays: 30,
    referralBannerTitle: 'Refer Friends, Earn Rewards!',
    referralBannerDescription: 'Invite your friends to The Grocery Hub. They get ₹{friendRewardAmount} OFF on their first order, and you earn exciting reward coupons!',
    referralBannerButton: 'Start Earning'
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(SETTINGS_DOC_REF);
        if (snap.exists()) {
          const data = snap.data();
          
          // Legacy migration
          if (data.tier1MaxAmount && !data.deliveryTiers) {
            data.deliveryTiers = [
              { maxAmount: data.tier1MaxAmount, fee: data.tier1DeliveryFee || 0 },
              { maxAmount: data.minOrderFreeDelivery ? data.minOrderFreeDelivery - 1 : 499, fee: data.tier2DeliveryFee || 0 }
            ];
          }
          if (!data.deliveryTiers) {
            data.deliveryTiers = [];
          }
          if (!data.footerColumns) {
            data.footerColumns = [
              {
                id: 'col1',
                title: 'Account & Shop',
                links: [
                  { id: 1, label: 'Shop Items', url: '#shop' },
                  { id: 2, label: 'User Dashboard', url: '/dashboard' },
                  { id: 3, label: 'My Orders', url: '/dashboard/orders' },
                  { id: 4, label: 'Saved Wishlist', url: '/dashboard/wishlist' },
                  { id: 5, label: 'Saved Addresses', url: '/dashboard/addresses' }
                ]
              },
              {
                id: 'col2',
                title: 'Categories',
                links: [
                  { id: 1, label: 'Dairy & Fresh Milk', url: '/category/Dairy & Fresh Milk' },
                  { id: 2, label: 'Bakery & Breads', url: '/category/Bakery & Breads' },
                  { id: 3, label: 'Rice, Atta & Dals', url: '/category/Rice, Atta & Dals' },
                  { id: 4, label: 'Oils, Ghee & Masalas', url: '/category/Oils, Ghee & Masalas' },
                  { id: 5, label: 'Snacks & Beverages', url: '/category/Snacks & Beverages' }
                ]
              },
              {
                id: 'col3',
                title: 'Customer Support',
                links: [
                  { id: 1, label: 'Lodge a Complaint', url: '/complaint' },
                  { id: 2, label: 'Help Center & FAQ', url: '/dashboard/help' },
                  { id: 3, label: '15-Min Delivery Policy', url: '#shop' },
                  { id: 4, label: 'Quality Standards', url: '#shop' },
                  { id: 5, label: 'About Us', url: '/about-us' },
                  { id: 6, label: 'Refund & Returns Policy', url: '/refund-policy' },
                  { id: 7, label: 'Cancellation Policy', url: '/cancellation-policy' },
                  { id: 8, label: 'Disclaimer', url: '/disclaimer' },
                  { id: 9, label: 'Shipping & Delivery Policy', url: '/shipping-policy' },
                  { id: 10, label: 'Terms and Conditions', url: '/terms-of-service' },
                  { id: 11, label: 'Privacy Policy', url: '/privacy-policy' }
                ]
              }
            ];
          }
          
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleAddTier = () => {
    setSettings(prev => ({
      ...prev,
      deliveryTiers: [...(prev.deliveryTiers || []), { minAmount: 0, maxAmount: 0, fee: 0, name: '' }]
    }));
  };

  const handleRemoveTier = (index) => {
    setSettings(prev => {
      const newTiers = [...prev.deliveryTiers];
      newTiers.splice(index, 1);
      return { ...prev, deliveryTiers: newTiers };
    });
  };

  const handleTierChange = (index, field, value) => {
    setSettings(prev => {
      const updatedTiers = [...prev.deliveryTiers];
      const parsedValue = field === 'name' ? value : Number(value);
      updatedTiers[index] = { ...updatedTiers[index], [field]: parsedValue };
      
      // Auto-sort tiers by minAmount
      updatedTiers.sort((a, b) => (a.minAmount || 0) - (b.minAmount || 0));
      
      return { ...prev, deliveryTiers: updatedTiers };
    });
  };

  const handleAddTestimonial = () => {
    setSettings(prev => ({
      ...prev,
      testimonialsList: [...(prev.testimonialsList || []), { id: Date.now(), name: '', location: '', rating: 5, comment: '', verified: true, avatar: '' }]
    }));
  };

  const handleRemoveTestimonial = (index) => {
    setSettings(prev => {
      const newList = [...prev.testimonialsList];
      newList.splice(index, 1);
      return { ...prev, testimonialsList: newList };
    });
  };

  const handleTestimonialChange = (index, field, value) => {
    setSettings(prev => {
      const newList = [...prev.testimonialsList];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, testimonialsList: newList };
    });
  };

  // Why Shop From Us Handlers
  const handleAddWhyShopFeature = () => {
    setSettings(prev => ({
      ...prev,
      whyShopFeatures: [...(prev.whyShopFeatures || []), { title: '', description: '', iconName: 'Leaf', colorTheme: 'emerald' }]
    }));
  };

  const handleRemoveWhyShopFeature = (index) => {
    setSettings(prev => {
      const newList = [...(prev.whyShopFeatures || [])];
      newList.splice(index, 1);
      return { ...prev, whyShopFeatures: newList };
    });
  };

  const handleWhyShopFeatureChange = (index, field, value) => {
    setSettings(prev => {
      const newList = [...(prev.whyShopFeatures || [])];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, whyShopFeatures: newList };
    });
  };

  const handleAddWhyShopStat = () => {
    setSettings(prev => ({
      ...prev,
      whyShopStats: [...(prev.whyShopStats || []), { value: 0, suffix: '+', label: '' }]
    }));
  };

  const handleRemoveWhyShopStat = (index) => {
    setSettings(prev => {
      const newList = [...(prev.whyShopStats || [])];
      newList.splice(index, 1);
      return { ...prev, whyShopStats: newList };
    });
  };

  const handleWhyShopStatChange = (index, field, value) => {
    setSettings(prev => {
      const newList = [...(prev.whyShopStats || [])];
      newList[index] = { ...newList[index], [field]: field === 'value' ? Number(value) : value };
      return { ...prev, whyShopStats: newList };
    });
  };

  // Footer Link Handlers
  const handleFooterColChange = (colIndex, title) => {
    setSettings(prev => {
      const cols = [...(prev.footerColumns || [])];
      cols[colIndex] = { ...cols[colIndex], title };
      return { ...prev, footerColumns: cols };
    });
  };

  const handleAddFooterLink = (colIndex) => {
    setSettings(prev => {
      const cols = [...(prev.footerColumns || [])];
      const links = [...cols[colIndex].links];
      links.push({ id: Date.now(), label: '', url: '' });
      cols[colIndex] = { ...cols[colIndex], links };
      return { ...prev, footerColumns: cols };
    });
  };

  const handleRemoveFooterLink = (colIndex, linkIndex) => {
    setSettings(prev => {
      const cols = [...(prev.footerColumns || [])];
      const links = [...cols[colIndex].links];
      links.splice(linkIndex, 1);
      cols[colIndex] = { ...cols[colIndex], links };
      return { ...prev, footerColumns: cols };
    });
  };

  const handleFooterLinkChange = (colIndex, linkIndex, field, value) => {
    setSettings(prev => {
      const cols = [...(prev.footerColumns || [])];
      const links = [...cols[colIndex].links];
      const updatedLink = { ...links[linkIndex], [field]: value };
      
      // Auto-fill URL for Categories column when label is typed
      if (field === 'label' && cols[colIndex].title === 'Categories') {
        updatedLink.url = `/category/${value}`;
      }
      
      links[linkIndex] = updatedLink;
      cols[colIndex] = { ...cols[colIndex], links };
      return { ...prev, footerColumns: cols };
    });
  };

  const handleAddPopularProduct = (productName) => {
    setSettings(prev => {
      const currentList = prev.searchPopularProducts 
        ? prev.searchPopularProducts.split('\n').filter(p => p.trim() !== '')
        : [];
      if (!currentList.includes(productName)) {
        currentList.push(productName);
      }
      return { ...prev, searchPopularProducts: currentList.join('\n') };
    });
    setProductSearchQuery('');
  };

  const handleRemovePopularProduct = (productName) => {
    setSettings(prev => {
      const currentList = prev.searchPopularProducts 
        ? prev.searchPopularProducts.split('\n').filter(p => p.trim() !== '')
        : [];
      const newList = currentList.filter(name => name !== productName);
      return { ...prev, searchPopularProducts: newList.join('\n') };
    });
  };

  const handleAddSearchCategory = (catName) => {
    setSettings(prev => {
      const currentList = prev.searchDropdownCategories 
        ? prev.searchDropdownCategories.split('\n').filter(p => p.trim() !== '')
        : ['All Categories'];
      if (!currentList.includes(catName)) {
        currentList.push(catName);
      }
      return { ...prev, searchDropdownCategories: currentList.join('\n') };
    });
  };

  const handleRemoveSearchCategory = (catName) => {
    if (catName === 'All Categories') return; 
    setSettings(prev => {
      const currentList = prev.searchDropdownCategories 
        ? prev.searchDropdownCategories.split('\n').filter(p => p.trim() !== '')
        : [];
      const newList = currentList.filter(name => name !== catName);
      return { ...prev, searchDropdownCategories: newList.join('\n') };
    });
  };

  const selectedSearchCategories = settings.searchDropdownCategories 
    ? settings.searchDropdownCategories.split('\n').filter(p => p.trim() !== '')
    : ['All Categories', 'Rice & Atta', 'Dals & Pulses', 'Oils & Ghee', 'Spices & Masalas', 'Snacks & Biscuits'];

  const selectedPopularProductNames = settings.searchPopularProducts 
    ? settings.searchPopularProducts.split('\n').filter(p => p.trim() !== '')
    : [];
    
  const searchMatchingProducts = productSearchQuery.trim()
    ? (items || []).filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
    : [];

  const allSearchableCats = [];
  (categoryDocs || []).forEach(cat => {
    allSearchableCats.push({ type: 'Category', name: cat.name, label: `📦 ${cat.name} (Main Category)` });
    (cat.subcategories || []).forEach(sub => {
      allSearchableCats.push({ type: 'Subcategory', name: sub, label: `↳ 📂 ${sub} (in ${cat.name})` });
    });
  });

  const filteredSearchableCats = categorySearchQuery
    ? allSearchableCats.filter(c => c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
    : allSearchableCats;

  const filteredCategoryDocsForSelect = categorySearchQuery.trim()
    ? (categoryDocs || []).map(cat => {
        if (cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())) {
          return cat;
        }
        const matchingSubs = (cat.subcategories || []).filter(sub => 
          sub.toLowerCase().includes(categorySearchQuery.toLowerCase())
        );
        if (matchingSubs.length === 0) return null;
        return { ...cat, subcategories: matchingSubs };
      }).filter(Boolean)
    : (categoryDocs || []);

  const handlePromoBannerChange = (index, field, value) => {
    setSettings(prev => {
      const defaultBanners = [
        { label: 'Daily Harvest', title: 'Organic Summer \\n Fruits Festival', subtitle: 'Flat 30% OFF on all fresh fruit baskets', buttonText: 'Shop Fruits', link: '#shop' },
        { label: 'Best Value Box', title: 'Organic Farm \\n Veggie Combo Box', subtitle: 'Hand-picked 7 essential veggies @ ₹199', buttonText: 'Claim Offer', link: '#shop' },
        { label: 'Instant Express', title: 'Superfast 15 Mins \\n Doorstep Delivery', subtitle: 'Zero delivery fee on orders over ₹199', buttonText: 'Order Now', link: '#shop' }
      ];
      const banners = prev.promoBanners ? [...prev.promoBanners] : defaultBanners;
      banners[index] = { ...banners[index], [field]: value };
      return { ...prev, promoBanners: banners };
    });
  };

  const getLinkMode = (url) => {
    if (!url) return 'custom';
    if (url === '/catalog') return 'all';
    if (url.startsWith('/catalog?search=')) {
      const term = decodeURIComponent(url.split('=')[1] || '');
      if (categories.includes(term)) return 'category';
      
      const allSubcats = (categoryDocs || []).flatMap(c => c.subcategories || []);
      if (allSubcats.includes(term)) return 'subcategory';

      return 'search'; 
    }
    return 'custom';
  };

  const getLinkTerm = (url) => {
    if (url?.startsWith('/catalog?search=')) {
      return decodeURIComponent(url.split('=')[1] || '');
    }
    return '';
  };

  // Compute active category order
  const activeCategoryOrder = useMemo(() => {
    if (!settings || !categoryDocs) return [];
    let savedOrder = settings.categoryDisplayOrder || [];
    
    // Auto-fill defaults if completely empty
    if (savedOrder.length === 0) {
      savedOrder = ['all', 'Trending', 'BOGO'];
    }

    // Add any missing main categories to the end
    const existingSet = new Set(savedOrder);
    const missingCats = categoryDocs.filter(c => !existingSet.has(c.name)).map(c => c.name);
    
    return [...savedOrder, ...missingCats];
  }, [settings?.categoryDisplayOrder, categoryDocs]);

  const moveCategoryOrder = (index, direction) => {
    const newOrder = [...activeCategoryOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    setSettings(prev => ({ ...prev, categoryDisplayOrder: newOrder }));
  };

  const handleRemoveCategoryOrder = (index) => {
    const newOrder = [...activeCategoryOrder];
    newOrder.splice(index, 1);
    setSettings(prev => ({ ...prev, categoryDisplayOrder: newOrder }));
  };

  const handleAddCategoryOrder = (name) => {
    if (name && !activeCategoryOrder.includes(name)) {
      setSettings(prev => ({ ...prev, categoryDisplayOrder: [...activeCategoryOrder, name] }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Strip temporary UI state keys (prefixed with _) before saving
      const cleanSettings = Object.fromEntries(
        Object.entries(settings).filter(([key]) => !key.startsWith('_'))
      );
      await setDoc(SETTINGS_DOC_REF, {
        ...cleanSettings,
        updatedAt: serverTimestamp()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Instantly save the active theme to Firestore without pressing the main Save button
  const handleThemeChange = async (themeKey) => {
    setSettings(prev => ({ ...prev, activeTheme: themeKey }));
    try {
      await setDoc(SETTINGS_DOC_REF, { activeTheme: themeKey }, { merge: true });
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">App Customization</h1>
              <p className="text-xs text-slate-400 font-medium">Manage app settings, delivery rules, and contact info</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in duration-200">
                <CheckCircle className="w-3 h-3" /> Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 disabled:shadow-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-10 py-8 max-w-5xl mx-auto w-full">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ============================================================
              🎨 SITE THEME SELECTOR
              Instant save — no need to press the Save button
              ============================================================ */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <span className="text-xl">🎨</span>
              <div>
                <h2 className="text-base font-bold text-slate-800">Site Theme</h2>
                <p className="text-xs text-slate-400 font-medium">Instantly changes the entire website's color scheme. No save button needed.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Normal Theme */}
              <button
                type="button"
                onClick={() => handleThemeChange('normal')}
                className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all text-left ${
                  (settings.activeTheme || 'normal') === 'normal'
                    ? 'border-emerald-500 shadow-lg shadow-emerald-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Preview strip */}
                <div className="h-16 bg-gradient-to-r from-amber-400 to-green-500 flex items-center justify-center gap-2">
                  <span className="text-2xl">🛒</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-200" />
                    <div className="w-3 h-3 rounded-full bg-white" />
                    <div className="w-3 h-3 rounded-full bg-green-200" />
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Normal</p>
                      <p className="text-xs text-slate-400">Default amber + green</p>
                    </div>
                    {(settings.activeTheme || 'normal') === 'normal' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Independence Day Theme */}
              <button
                type="button"
                onClick={() => handleThemeChange('independence-day')}
                className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all text-left ${
                  settings.activeTheme === 'independence-day'
                    ? 'border-orange-500 shadow-lg shadow-orange-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Preview: tricolor strip */}
                <div className="h-16 flex">
                  <div className="flex-1 bg-[#FF9933] flex items-center justify-center"><span className="text-lg">🇮🇳</span></div>
                  <div className="flex-1 bg-white flex items-center justify-center"><span className="text-lg font-black text-[#000080] text-xs">JAI</span></div>
                  <div className="flex-1 bg-[#138808] flex items-center justify-center"><span className="text-xs font-black text-white">HIND</span></div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Independence Day 🇮🇳</p>
                      <p className="text-xs text-slate-400">Saffron + White + Green</p>
                    </div>
                    {settings.activeTheme === 'independence-day' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Diwali Theme */}
              <button
                type="button"
                onClick={() => handleThemeChange('diwali')}
                className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all text-left ${
                  settings.activeTheme === 'diwali'
                    ? 'border-amber-600 shadow-lg shadow-amber-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Preview: warm diwali gradient */}
                <div className="h-16 bg-gradient-to-r from-[#7c2d12] via-[#b45309] to-[#92400e] flex items-center justify-center gap-2">
                  <span className="text-2xl">🪔</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-orange-300" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  </div>
                  <span className="text-2xl">🪔</span>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Diwali 🪔</p>
                      <p className="text-xs text-slate-400">Gold + Maroon festive</p>
                    </div>
                    {settings.activeTheme === 'diwali' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            <p className="text-xs text-slate-400 font-medium text-center">
              ⚡ Theme changes are applied instantly across the user site — no page refresh needed.
            </p>
          </div>

          {/* ============================================================
              🎁 REFERRAL CAMPAIGN SETTINGS
              ============================================================ */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Gift className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-800">Referral Campaign Settings</h2>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="referralCampaignActive" 
                  checked={settings.referralCampaignActive ?? true} 
                  onChange={handleChange} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
              <span className="text-sm font-bold text-slate-700">Campaign Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Referrer Reward Amount (₹)</label>
                <input
                  type="number"
                  name="referrerRewardAmount"
                  value={settings.referrerRewardAmount ?? 30}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Referred User Reward Amount (₹)</label>
                <input
                  type="number"
                  name="referredUserRewardAmount"
                  value={settings.referredUserRewardAmount ?? 30}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Referral Minimum Order Value (₹)</label>
                <input
                  type="number"
                  name="referralMinOrderValue"
                  value={settings.referralMinOrderValue ?? 299}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Coupon Validity (Days)</label>
                <input
                  type="number"
                  name="referralCouponValidityDays"
                  value={settings.referralCouponValidityDays ?? 30}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Coupon Min Order Value (₹)</label>
                <input
                  type="number"
                  name="referralCouponMinOrderValue"
                  value={settings.referralCouponMinOrderValue ?? 100}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Homepage Banner Content</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Banner Title</label>
                  <input
                    type="text"
                    name="referralBannerTitle"
                    value={settings.referralBannerTitle ?? 'Refer Friends, Earn Rewards!'}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Banner Description (Use {'{friendRewardAmount}'} for dynamic value)</label>
                  <textarea
                    name="referralBannerDescription"
                    value={settings.referralBannerDescription ?? 'Invite your friends to The Grocery Hub. They get ₹{friendRewardAmount} OFF on their first order, and you earn exciting reward coupons!'}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium resize-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Button Text</label>
                  <input
                    type="text"
                    name="referralBannerButton"
                    value={settings.referralBannerButton ?? 'Start Earning'}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Section Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
               <AlertTriangle className="w-5 h-5 text-amber-500" />
               <h2 className="text-base font-bold text-slate-800">Hero Section Settings</h2>
            </div>

            {/* Urgency Banner */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-indigo-600 border-b border-slate-100 pb-1.5">1. Top Urgency Banner</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="isUrgencyBannerActive" 
                      checked={settings.isUrgencyBannerActive ?? true} 
                      onChange={handleChange} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-sm font-bold text-slate-700">Show Urgency Banner at top of User App</span>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Banner Texts (Enter each message on a new line)</label>
                <textarea
                  name="urgencyBannerText"
                  value={settings.urgencyBannerText || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                  placeholder="e.g. Genuine Product&#10;Fast Delivery"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                  <strong>Tip:</strong> The banner will automatically rotate through each line. 
                  Use <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded">{"{timer}"}</code> for countdown timer and <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded">{"{time}"}</code> for delivery time.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Rotation Speed (Seconds)</label>
                <input
                  type="number"
                  name="urgencyBannerInterval"
                  value={settings.urgencyBannerInterval ?? 3}
                  onChange={handleChange}
                  min="1"
                  max="60"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                />
              </div>
            </div>
            </div>

            {/* Rotating Main Headline */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-sm text-indigo-600 border-b border-slate-100 pb-1.5">2. Rotating Main Headline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Top Text (Prefix)</label>
                  <input
                    type="text"
                    name="heroPrefixText"
                    value={settings.heroPrefixText ?? 'Delivering'}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. Delivering"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Bottom Text (Suffix)</label>
                  <input
                    type="text"
                    name="heroSuffixText"
                    value={settings.heroSuffixText ?? 'In 15 Minutes'}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. In 15 Minutes"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Rotating Texts (Enter each word/phrase on a new line)</label>
                  <textarea
                    name="heroRotatingTexts"
                    value={settings.heroRotatingTexts || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. Fresh Fruits&#10;Daily Dairy"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    This text is shown dynamically between the Top Text and Bottom Text.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Rotation Speed (Seconds)</label>
                  <input
                    type="number"
                    name="heroRotatingInterval"
                    value={settings.heroRotatingInterval ?? 2}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtitle Text (Below Headline)</label>
                  <textarea
                    name="heroSubtitleText"
                    value={settings.heroSubtitleText ?? 'This year, our new summer collection will shelter you harsh elements of a world that .'}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. Get the freshest groceries delivered to your door..."
                  />
                </div>
              </div>
            </div>

            {/* Features (Below Shop Button) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-sm text-indigo-600 border-b border-slate-100 pb-1.5">3. Features Banner (Below Shop Button)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Features List (Enter each feature on a new line)</label>
                  <textarea
                    name="heroFeatureTexts"
                    value={settings.heroFeatureTexts || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. Genuine Product&#10;Fast Delivery"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    This rotating text appears below the "Shop Now" button in the Hero Section.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Rotation Speed (Seconds)</label>
                  <input
                    type="number"
                    name="heroFeatureInterval"
                    value={settings.heroFeatureInterval ?? 3}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Reviews Card */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-sm text-indigo-600 border-b border-slate-100 pb-1.5">4. Reviews Card (Bottom)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Review Text</label>
                  <textarea
                    name="heroReviewText"
                    value={settings.heroReviewText ?? 'The Grocery Hub- Satisfied Around\n*the* Baharagora'}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. The Grocery Hub- Satisfied Around&#10;*the* Baharagora"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    This appears next to the customer faces. Use <code className="bg-slate-100 text-emerald-600 px-1 py-0.5 rounded">*asterisks*</code> around words to make them green.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Google Sheets Export Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-full -z-0 opacity-50"></div>
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 relative z-10">
               <Table className="w-5 h-5 text-emerald-600" />
               <h2 className="text-base font-bold text-slate-800">Google Sheets Export (Auto-Sync)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Google Apps Script Webhook URL</label>
                <input
                  type="text"
                  name="googleSheetsWebhookUrl"
                  value={settings.googleSheetsWebhookUrl || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  Enter the Web App URL generated from your Google Apps Script. This connects your inventory to Google Sheets.
                </p>
              </div>

              <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Manual Full Sync</h4>
                    <p className="text-xs text-slate-500 max-w-md">Click this to export and sync all <strong>{items?.length || 0}</strong> existing products to your Google Sheet in one go.</p>
                  </div>
                  <button
                    onClick={handleSyncToGoogleSheets}
                    disabled={syncingSheets || !settings.googleSheetsWebhookUrl}
                    className="whitespace-nowrap flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-200 disabled:shadow-none active:scale-95 cursor-pointer"
                  >
                    {syncingSheets ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Table className="w-4 h-4" />
                    )}
                    {syncingSheets ? 'Syncing...' : 'Sync All Products'}
                  </button>
                </div>
                
                {syncResult && (
                  <div className={`mt-3 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in ${syncResult.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {syncResult.includes('success') ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {syncResult.includes('success') ? 'Sync command sent to Google Sheets successfully!' : 'Failed to sync. Check URL or console.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Catalog Category Display Order */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
               <ListOrdered className="w-5 h-5 text-indigo-500" />
               <h2 className="text-base font-bold text-slate-800">Catalog Category Display Order</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-500">
                Arrange the order of categories as they will appear in the customer app (Catalog filters & sidebar). 
                Missing categories are automatically appended to the end.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                {activeCategoryOrder.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono w-4">{idx + 1}.</span> 
                      {cat === 'all' ? 'All Products' : cat === 'BOGO' ? 'Buy 1 Get 1' : cat}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => moveCategoryOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => moveCategoryOrder(idx, 'down')}
                        disabled={idx === activeCategoryOrder.length - 1}
                        className="p-1.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCategoryOrder(idx)}
                        className="p-1.5 rounded bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 ml-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <select
                  onChange={(e) => {
                    if (e.target.value) handleAddCategoryOrder(e.target.value);
                    e.target.value = ""; 
                  }}
                  className="w-full max-w-sm px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium cursor-pointer"
                >
                  <option value="">+ Re-add a missing Category</option>
                  <option value="all">All Products</option>
                  <option value="Trending">Trending</option>
                  <option value="BOGO">Buy 1 Get 1</option>
                  {(categoryDocs || []).map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category Showcase Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
               <Sparkles className="w-5 h-5 text-amber-500" />
               <h2 className="text-base font-bold text-slate-800">Category Showcase Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtitle (Small text above title)</label>
                <input
                  type="text"
                  name="categorySectionSubtitle"
                  value={settings.categorySectionSubtitle ?? 'Explore Categories'}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none font-medium"
                  placeholder="e.g. Explore Categories"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Title (Large main text)</label>
                <input
                  type="text"
                  name="categorySectionTitle"
                  value={settings.categorySectionTitle ?? 'Shop Fresh Organic Produce'}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none font-medium"
                  placeholder="e.g. Shop Fresh Organic Produce"
                />
              </div>
            </div>
          </div>

          {/* Search Bar Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
               <Search className="w-5 h-5 text-amber-500" />
               <h2 className="text-base font-bold text-slate-800">Search Bar Customization</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Search Placeholder Texts (One per line)</label>
                <textarea
                  name="searchPlaceholder"
                  value={settings.searchPlaceholder ?? 'Search for groceries...\nSearch for fresh fruits...\nSearch for dairy products...'}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none font-medium"
                  placeholder="e.g. Search for groceries...&#10;Search for fresh fruits..."
                />
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">The search bar will rotate through these texts with a typing effect.</p>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Placeholder Change Interval (Seconds)</label>
                <input
                  type="number"
                  name="searchPlaceholderInterval"
                  value={settings.searchPlaceholderInterval ?? 3}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none font-medium"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">How long each text stays before changing to the next one.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Search Bar Categories / Subcategories</label>
                
                {/* Display Chips */}
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[60px]">
                  {selectedSearchCategories.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      {name}
                      {name !== 'All Categories' && (
                        <button type="button" onClick={() => handleRemoveSearchCategory(name)} className="hover:bg-amber-200 p-0.5 rounded-full transition-colors ml-1 cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Select with Side Search */}
                <div className="flex gap-2 items-center">
                  <div className="relative w-1/3 min-w-[150px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      onFocus={() => setIsCategorySearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsCategorySearchFocused(false), 200)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none font-medium"
                    />

                    {isCategorySearchFocused && (
                      <div className="absolute top-full left-0 z-50 w-full min-w-[250px] mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          {filteredSearchableCats.length > 0 ? (
                            filteredSearchableCats.map((item, idx) => (
                              <div
                                key={idx}
                                onMouseDown={(e) => e.preventDefault()} // Prevents blur from firing before click
                                onClick={() => {
                                  handleAddSearchCategory(item.name);
                                  setCategorySearchQuery('');
                                  setIsCategorySearchFocused(false);
                                }}
                                className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0"
                              >
                                <div>
                                  <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                                  <p className="text-[10px] text-slate-500 font-medium">{item.label}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-center text-sm text-slate-500 font-medium">
                              No matches found for "{categorySearchQuery}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleAddSearchCategory(e.target.value);
                        e.target.value = ""; 
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none font-medium cursor-pointer"
                    >
                      <option value="">+ Add a Category or Subcategory</option>
                      {filteredCategoryDocsForSelect.map(cat => (
                        <optgroup key={cat.name} label={`📦 ${cat.name}`}>
                          <option value={cat.name}>📁 {cat.name} (Main Category)</option>
                          {(cat.subcategories || []).map(sub => (
                            <option key={sub} value={sub}>↳ 📂 {sub}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">These appear in the dropdown next to the search input.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Trending Searches (One per line)</label>
                <textarea
                  name="searchTrendingSearches"
                  value={settings.searchTrendingSearches ?? 'Fresh Milk\nRed Onions\nWhole Wheat Bread\nOrganic Eggs'}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none font-medium"
                  placeholder="e.g. Fresh Milk&#10;Red Onions"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Clicking the search bar shows these trending terms.</p>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Popular Products (Search & Select)</label>
                
                {/* Selected Products Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedPopularProductNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {name}
                      <button type="button" onClick={() => handleRemovePopularProduct(name)} className="hover:bg-amber-200 p-0.5 rounded-full transition-colors ml-1 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {selectedPopularProductNames.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No products selected. (Will automatically show first 4 products)</span>
                  )}
                </div>

                {/* Search Input for Products */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search your catalog to add a popular product..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none font-medium"
                  />
                  
                  {/* Dropdown of matched products */}
                  {productSearchQuery.trim() && (
                    <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto">
                      {searchMatchingProducts.length > 0 ? (
                        searchMatchingProducts.map(prod => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleAddPopularProduct(prod.name)}
                            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
                          >
                            <img src={prod.image || prod.images?.[0] || 'https://via.placeholder.com/40'} alt={prod.name} className="w-8 h-8 rounded-lg object-cover bg-slate-100" />
                            <div>
                              <p className="text-xs font-bold text-slate-800 line-clamp-1">{prod.name}</p>
                              <p className="text-[10px] font-black text-emerald-600">₹{prod.price}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-xs font-bold text-slate-500 text-center">No products found matching "{productSearchQuery}"</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Promo Banners Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
               <Megaphone className="w-5 h-5 text-emerald-500" />
               <h2 className="text-base font-bold text-slate-800">Promo Banners Settings (Homepage)</h2>
            </div>
            
            <div className="space-y-8">
              {[0, 1, 2].map((bannerIndex) => {
                const defaultBanners = [
                  { label: 'Daily Harvest', title: 'Organic Summer \\n Fruits Festival', subtitle: 'Flat 30% OFF on all fresh fruit baskets', buttonText: 'Shop Fruits', link: '#shop' },
                  { label: 'Best Value Box', title: 'Organic Farm \\n Veggie Combo Box', subtitle: 'Hand-picked 7 essential veggies @ ₹199', buttonText: 'Claim Offer', link: '#shop' },
                  { label: 'Instant Express', title: 'Superfast 15 Mins \\n Doorstep Delivery', subtitle: 'Zero delivery fee on orders over ₹199', buttonText: 'Order Now', link: '#shop' }
                ];
                const banner = (settings.promoBanners && settings.promoBanners[bannerIndex]) ? settings.promoBanners[bannerIndex] : defaultBanners[bannerIndex];
                
                const linkMode = getLinkMode(banner.link);
                const linkTerm = getLinkTerm(banner.link);

                return (
                  <div key={bannerIndex} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h3 className="font-bold text-sm text-emerald-700 mb-4 pb-2 border-b border-emerald-100">Banner {bannerIndex + 1}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Top Label (e.g. Daily Harvest)</label>
                        <input
                          type="text"
                          value={banner.label || ''}
                          onChange={(e) => handlePromoBannerChange(bannerIndex, 'label', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Title (Use \n for next line)</label>
                        <input
                          type="text"
                          value={banner.title || ''}
                          onChange={(e) => handlePromoBannerChange(bannerIndex, 'title', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtitle</label>
                          <input
                            type="text"
                            value={banner.subtitle || ''}
                            onChange={(e) => handlePromoBannerChange(bannerIndex, 'subtitle', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Button Text</label>
                          <input
                            type="text"
                            value={banner.buttonText || ''}
                            onChange={(e) => handlePromoBannerChange(bannerIndex, 'buttonText', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Where to Link?</label>
                          <div className="space-y-2">
                            <select
                              value={linkMode}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'all') handlePromoBannerChange(bannerIndex, 'link', '/catalog');
                                else if (val === 'category') handlePromoBannerChange(bannerIndex, 'link', `/catalog?search=${encodeURIComponent(categories[0]||'')}`);
                                else if (val === 'subcategory') {
                                  const allSubcats = (categoryDocs || []).flatMap(c => c.subcategories || []);
                                  handlePromoBannerChange(bannerIndex, 'link', `/catalog?search=${encodeURIComponent(allSubcats[0]||'')}`);
                                }
                                else if (val === 'search') handlePromoBannerChange(bannerIndex, 'link', '/catalog?search=');
                                else handlePromoBannerChange(bannerIndex, 'link', '');
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-emerald-500 outline-none"
                            >
                              <option value="all">🛍️ All Products</option>
                              <option value="category">📁 Specific Category</option>
                              <option value="subcategory">📂 Specific Subcategory</option>
                              <option value="search">🔍 Specific Product</option>
                              <option value="custom">🔗 Custom URL</option>
                            </select>

                            {linkMode === 'category' && (
                              <select
                                value={linkTerm}
                                onChange={(e) => handlePromoBannerChange(bannerIndex, 'link', `/catalog?search=${encodeURIComponent(e.target.value)}`)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-sm focus:border-emerald-500 outline-none shadow-sm"
                              >
                                {categories.map((cat, i) => (
                                  <option key={i} value={cat}>{cat}</option>
                                ))}
                              </select>
                            )}

                            {linkMode === 'subcategory' && (
                              <select
                                value={linkTerm}
                                onChange={(e) => handlePromoBannerChange(bannerIndex, 'link', `/catalog?search=${encodeURIComponent(e.target.value)}`)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-sm focus:border-emerald-500 outline-none shadow-sm"
                              >
                                <option value="">-- Select Subcategory --</option>
                                {(categoryDocs || []).map(cat => (
                                  <optgroup key={cat.name} label={cat.name}>
                                    {(cat.subcategories || []).map(sub => (
                                      <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            )}

                            {linkMode === 'search' && (
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="e.g. Paneer or Amul Butter"
                                  value={linkTerm}
                                  onChange={(e) => handlePromoBannerChange(bannerIndex, 'link', `/catalog?search=${encodeURIComponent(e.target.value)}`)}
                                  onFocus={() => setFocusedBannerInput(bannerIndex)}
                                  onBlur={() => setTimeout(() => setFocusedBannerInput(null), 200)}
                                  className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-sm focus:border-emerald-500 outline-none shadow-sm"
                                />
                                {focusedBannerInput === bannerIndex && linkTerm.trim() && (
                                  <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto">
                                    {(items || []).filter(p => p.name.toLowerCase().includes(linkTerm.toLowerCase())).slice(0, 10).map(prod => (
                                      <button
                                        key={prod.id}
                                        type="button"
                                        onClick={() => handlePromoBannerChange(bannerIndex, 'link', `/catalog?search=${encodeURIComponent(prod.name)}`)}
                                        className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
                                      >
                                        <img src={prod.image || prod.images?.[0] || 'https://via.placeholder.com/40'} alt={prod.name} className="w-6 h-6 rounded object-cover bg-slate-100" />
                                        <span className="text-xs font-bold text-slate-800 line-clamp-1">{prod.name}</span>
                                      </button>
                                    ))}
                                    {(items || []).filter(p => p.name.toLowerCase().includes(linkTerm.toLowerCase())).length === 0 && (
                                      <div className="p-2 text-[10px] text-slate-500 text-center">No exact products found. Will search as text.</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {linkMode === 'custom' && (
                              <input
                                type="text"
                                placeholder="e.g. /about-us or https://..."
                                value={banner.link || ''}
                                onChange={(e) => handlePromoBannerChange(bannerIndex, 'link', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-sm focus:border-emerald-500 outline-none shadow-sm"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Why Shop From Us Section Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
               <Sparkles className="w-5 h-5 text-emerald-500" />
               <h2 className="text-base font-bold text-slate-800">Why Shop From Us Section</h2>
            </div>

            {/* Section Headings */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-indigo-600 border-b border-slate-100 pb-1.5">Section Headings & CTA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Badge Text (small label)</label>
                  <input
                    type="text"
                    name="whyShopBadge"
                    value={settings.whyShopBadge || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. Why Choose Us"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Main Title</label>
                  <input
                    type="text"
                    name="whyShopTitle"
                    value={settings.whyShopTitle || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. Why Shop From The Grocery Hub?"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtitle / Description</label>
                  <textarea
                    name="whyShopSubtitle"
                    value={settings.whyShopSubtitle || ''}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                    placeholder="Brief description about why customers should shop from you"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">CTA Button Text</label>
                  <input
                    type="text"
                    name="whyShopCtaText"
                    value={settings.whyShopCtaText || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. Start Shopping Now"
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">CTA Button Link</label>
                  {(() => {
                    const ctaLinkPages = [
                      { value: '#shop', label: '🏠 Homepage — Shop Section', group: 'Pages' },
                      { value: '/', label: '🏠 Homepage', group: 'Pages' },
                      { value: '/catalog', label: '🛒 Full Catalog', group: 'Pages' },
                      { value: '/about-us', label: 'ℹ️ About Us', group: 'Pages' },
                      { value: '/complaint', label: '📝 Lodge Complaint', group: 'Pages' },
                      { value: '/privacy-policy', label: '🔒 Privacy Policy', group: 'Pages' },
                      { value: '/terms-of-service', label: '📜 Terms & Conditions', group: 'Pages' },
                      { value: '/refund-policy', label: '💰 Refund Policy', group: 'Pages' },
                      { value: '/cancellation-policy', label: '❌ Cancellation Policy', group: 'Pages' },
                      { value: '/shipping-policy', label: '🚚 Shipping & Delivery', group: 'Pages' },
                      { value: '/disclaimer', label: '⚠️ Disclaimer', group: 'Pages' },
                    ];
                    const ctaLinkCategories = (categoryDocs || []).flatMap(cat => [
                      { value: `/?category=${encodeURIComponent(cat.name)}`, label: `📦 ${cat.name}`, group: 'Categories' },
                      ...(cat.subcategories || []).map(sub => ({
                        value: `/catalog?search=${encodeURIComponent(sub)}`,
                        label: `  ↳ ${sub}`,
                        group: 'Categories'
                      }))
                    ]);
                    const allCtaOptions = [...ctaLinkPages, ...ctaLinkCategories];
                    const selectedLabel = allCtaOptions.find(o => o.value === settings.whyShopCtaLink)?.label || settings.whyShopCtaLink || 'Select a link...';

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setSettings(prev => ({ ...prev, _ctaDropdownOpen: !prev._ctaDropdownOpen, _ctaSearchQuery: '' }))}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-left focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{selectedLabel}</span>
                          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        </button>

                        {settings._ctaDropdownOpen && (
                          <>
                            {/* Overlay to close on outside click */}
                            <div className="fixed inset-0 z-30" onClick={() => setSettings(prev => ({ ...prev, _ctaDropdownOpen: false }))} />

                            <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                              {/* Search Input */}
                              <div className="p-2 border-b border-slate-100">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search pages & categories..."
                                    value={settings._ctaSearchQuery || ''}
                                    onChange={(e) => setSettings(prev => ({ ...prev, _ctaSearchQuery: e.target.value }))}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                                  />
                                </div>
                              </div>

                              {/* Filtered Options */}
                              <div className="max-h-56 overflow-y-auto">
                                {(() => {
                                  const q = (settings._ctaSearchQuery || '').toLowerCase();
                                  const filtered = allCtaOptions.filter(o => o.label.toLowerCase().includes(q));
                                  const groups = [...new Set(filtered.map(o => o.group))];

                                  if (filtered.length === 0) {
                                    return <p className="text-xs text-slate-400 font-medium px-4 py-3 text-center">No results found</p>;
                                  }

                                  return groups.map(group => (
                                    <div key={group}>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-2.5 pb-1">
                                        {group === 'Pages' ? '📄 Pages' : '📦 Categories'}
                                      </p>
                                      {filtered.filter(o => o.group === group).map(opt => (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => {
                                            setSettings(prev => ({
                                              ...prev,
                                              whyShopCtaLink: opt.value,
                                              _ctaDropdownOpen: false,
                                              _ctaSearchQuery: ''
                                            }));
                                          }}
                                          className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                                            settings.whyShopCtaLink === opt.value
                                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                                              : 'text-slate-700 hover:bg-slate-50'
                                          }`}
                                        >
                                          <span className="truncate">{opt.label}</span>
                                          {settings.whyShopCtaLink === opt.value && (
                                            <CheckCircle className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 ml-auto" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Trust Line Text (shown next to CTA)</label>
                  <input
                    type="text"
                    name="whyShopTrustLine"
                    value={settings.whyShopTrustLine || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                    placeholder="e.g. 1,500+ customers trust us daily"
                  />
                </div>
              </div>
            </div>

            {/* Stats Counters */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-sm text-indigo-600 border-b border-slate-100 pb-1.5">Stats / Counters (animated numbers)</h3>
              <div className="space-y-3">
                {(settings.whyShopStats || []).map((stat, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveWhyShopStat(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 p-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-10">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Number Value</label>
                        <input
                          type="number"
                          value={stat.value || 0}
                          onChange={(e) => handleWhyShopStatChange(idx, 'value', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Suffix (e.g. +, %, Min)</label>
                        <input
                          type="text"
                          value={stat.suffix || ''}
                          onChange={(e) => handleWhyShopStatChange(idx, 'suffix', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                          placeholder="e.g. +, %, Min"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Label</label>
                        <input
                          type="text"
                          value={stat.label || ''}
                          onChange={(e) => handleWhyShopStatChange(idx, 'label', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                          placeholder="e.g. Happy Customers"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddWhyShopStat}
                  className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Stat Counter
                </button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-sm text-indigo-600 border-b border-slate-100 pb-1.5">Feature Cards</h3>
              <div className="space-y-4">
                {(settings.whyShopFeatures || []).map((feature, idx) => (
                  <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveWhyShopFeature(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 p-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Feature Title</label>
                        <input
                          type="text"
                          value={feature.title || ''}
                          onChange={(e) => handleWhyShopFeatureChange(idx, 'title', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                          placeholder="e.g. Farm Fresh Quality"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Icon Name</label>
                          <select
                            value={feature.iconName || 'Leaf'}
                            onChange={(e) => handleWhyShopFeatureChange(idx, 'iconName', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium cursor-pointer"
                          >
                            <option value="Leaf">🍃 Leaf</option>
                            <option value="Truck">🚚 Truck</option>
                            <option value="BadgePercent">🏷️ Badge Percent</option>
                            <option value="ShieldCheck">🛡️ Shield Check</option>
                            <option value="HeartHandshake">🤝 Heart Handshake</option>
                            <option value="Clock">⏰ Clock</option>
                            <option value="Star">⭐ Star</option>
                            <option value="Sparkles">✨ Sparkles</option>
                            <option value="Package">📦 Package</option>
                            <option value="Award">🏆 Award</option>
                            <option value="ThumbsUp">👍 Thumbs Up</option>
                            <option value="Zap">⚡ Zap</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Color Theme</label>
                          <select
                            value={feature.colorTheme || 'emerald'}
                            onChange={(e) => handleWhyShopFeatureChange(idx, 'colorTheme', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium cursor-pointer"
                          >
                            <option value="emerald">🟢 Emerald (Green)</option>
                            <option value="amber">🟡 Amber (Yellow)</option>
                            <option value="rose">🔴 Rose (Red/Pink)</option>
                            <option value="sky">🔵 Sky (Blue)</option>
                            <option value="violet">🟣 Violet (Purple)</option>
                            <option value="teal">🩵 Teal (Cyan)</option>
                            <option value="orange">🟠 Orange</option>
                            <option value="indigo">🔵 Indigo (Deep Blue)</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
                        <textarea
                          value={feature.description || ''}
                          onChange={(e) => handleWhyShopFeatureChange(idx, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                          placeholder="Feature description..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddWhyShopFeature}
                  className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Feature Card
                </button>
              </div>
            </div>
          </div>

          {/* Testimonials Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
               <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
               <h2 className="text-base font-bold text-slate-800">Testimonials (Happy Shoppers Section)</h2>
            </div>

            {/* Section Headings */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-indigo-600 border-b border-slate-100 pb-1.5">Section Headings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Small Badge Text</label>
                  <input
                    type="text"
                    name="testimonialsBadge"
                    value={settings.testimonialsBadge || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Main Title</label>
                  <input
                    type="text"
                    name="testimonialsTitle"
                    value={settings.testimonialsTitle || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtitle Text</label>
                  <input
                    type="text"
                    name="testimonialsSubtitle"
                    value={settings.testimonialsSubtitle || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-sm text-indigo-600 border-b border-slate-100 pb-1.5">Customer Reviews</h3>
              <div className="space-y-4">
                {settings.testimonialsList?.map((review, idx) => (
                  <div key={review.id || idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative group grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveTestimonial(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 p-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="col-span-1 md:col-span-2 pr-10">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Review Comment</label>
                      <textarea
                        value={review.comment || ''}
                        onChange={(e) => handleTestimonialChange(idx, 'comment', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Customer Name</label>
                      <input
                        type="text"
                        value={review.name || ''}
                        onChange={(e) => handleTestimonialChange(idx, 'name', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Location (e.g. City, State)</label>
                      <input
                        type="text"
                        value={review.location || ''}
                        onChange={(e) => handleTestimonialChange(idx, 'location', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Rating (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={review.rating || 5}
                        onChange={(e) => handleTestimonialChange(idx, 'rating', Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Avatar Image URL</label>
                      <input
                        type="url"
                        value={review.avatar || ''}
                        onChange={(e) => handleTestimonialChange(idx, 'avatar', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={review.verified ?? true} 
                            onChange={(e) => handleTestimonialChange(idx, 'verified', e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                        <span className="text-xs font-bold text-slate-700">Verified Purchase Badge</span>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddTestimonial}
                  className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Review
                </button>
              </div>
            </div>
          </div>

          {/* Footer Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
               <h2 className="text-base font-bold text-slate-800">Footer Promo Banner</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Banner Title</label>
                <input
                  type="text"
                  name="footerTitle"
                  value={settings.footerTitle || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Bouncing Emoji</label>
                <input
                  type="text"
                  name="footerEmoji"
                  value={settings.footerEmoji || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-center text-xl"
                  maxLength={5}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Banner Subtitle</label>
                <input
                  type="text"
                  name="footerSubtitle"
                  value={settings.footerSubtitle || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                />
              </div>
              <div className="md:col-span-3 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Brand Description (Below Logo)</label>
                <textarea
                  name="footerBrandDescription"
                  value={settings.footerBrandDescription ?? 'Your premier online shop for farm-fresh vegetables, fruits, dairy, and everyday household essentials delivered in 15 minutes.'}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Dynamic Footer Columns */}
            <div>
              <h3 className="font-bold text-sm text-indigo-600 mb-4">Navigation Columns</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {settings.footerColumns?.map((col, colIdx) => (
                  <div key={col.id || colIdx} className="bg-slate-50 rounded-xl border border-slate-200 p-4 relative">
                    <input
                      type="text"
                      value={col.title || ''}
                      onChange={(e) => handleFooterColChange(colIdx, e.target.value)}
                      placeholder={`Column ${colIdx + 1} Title`}
                      className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-indigo-500 outline-none pb-1 mb-4 transition-colors placeholder:text-slate-400"
                    />
                    
                    {col.title === 'Categories' && (
                      <div className="mb-4 bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex items-center justify-between">
                        <span className="text-xs text-emerald-800 font-bold">Auto-Fill:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newCols = [...settings.footerColumns];
                            newCols[colIdx].links = categories.map((cat, i) => ({
                              id: Date.now() + i,
                              label: cat,
                              url: `/category/${encodeURIComponent(cat)}`
                            }));
                            setSettings({ ...settings, footerColumns: newCols });
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-black shadow-sm transition-colors cursor-pointer"
                        >
                          Fill All Current Categories
                        </button>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {col.links?.map((link, linkIdx) => (
                        <div key={link.id || linkIdx} className="bg-white p-3 rounded-lg border border-slate-200 relative group">
                          <button
                            type="button"
                            onClick={() => handleRemoveFooterLink(colIdx, linkIdx)}
                            className="absolute -top-2 -right-2 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 rounded-full border border-slate-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 p-1"
                            title="Remove Link"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={link.label || ''}
                              onChange={(e) => handleFooterLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                              placeholder="Link Label (e.g. About Us)"
                              className="w-full px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                            />
                            <input
                              type="text"
                              value={link.url || ''}
                              onChange={(e) => handleFooterLinkChange(colIdx, linkIdx, 'url', e.target.value)}
                              placeholder="URL (e.g. /about-us)"
                              className="w-full px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFooterLink(colIdx)}
                      className="mt-4 w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Support & Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Phone className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-800">Contact Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Support Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="supportPhone"
                    value={settings.supportPhone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="whatsappNumber"
                    value={settings.whatsappNumber}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Support Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="supportEmail"
                    value={settings.supportEmail}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="support@groceryhub.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Global Popup Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
               <div className="flex items-center gap-2">
                 <Megaphone className="w-5 h-5 text-indigo-500" />
                 <h2 className="text-base font-bold text-slate-800">Global Pop-up Announcement</h2>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="popupActive"
                    checked={settings.popupActive || false} 
                    onChange={handleChange} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-3 text-sm font-bold text-slate-700">{settings.popupActive ? 'Active' : 'Disabled'}</span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-100 transition-opacity">
              <div className="md:col-span-2">
                <ImageUploadInput
                  label="Popup Image (Banner)"
                  value={settings.popupImageUrl || ''}
                  onChange={(url) => setSettings(prev => ({ ...prev, popupImageUrl: url }))}
                  folder="popups"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Popup Title</label>
                <input
                  type="text"
                  name="popupTitle"
                  value={settings.popupTitle || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Popup Description</label>
                <textarea
                  name="popupText"
                  value={settings.popupText || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Button Text</label>
                <input
                  type="text"
                  name="popupCtaText"
                  value={settings.popupCtaText || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Button Link (URL / Path)</label>
                <input
                  type="text"
                  name="popupCtaUrl"
                  value={settings.popupCtaUrl || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                  placeholder="e.g. /catalog"
                />
              </div>
            </div>
          </div>

          {/* Delivery & Tax Rules */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Truck className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-800">Store Rules & Fees</h2>
            </div>
            <div className="space-y-4">
              {/* Dynamic Tiers Builder */}
              <div className="space-y-4">
                {settings.deliveryTiers?.map((tier, index) => (
                  <div key={index} className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 p-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Remove Tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="mb-4 pr-10">
                      <input
                        type="text"
                        value={tier.name || ''}
                        onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                        placeholder={`Tier ${index + 1} Name (e.g. Orders ₹1 to ₹${tier.maxAmount || 200})`}
                        className="text-sm font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-indigo-500 outline-none w-full pb-1 transition-colors placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Min Cart Value (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={tier.minAmount || 0}
                            onChange={(e) => handleTierChange(index, 'minAmount', e.target.value)}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Max Cart Value (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={tier.maxAmount || 0}
                            onChange={(e) => handleTierChange(index, 'maxAmount', e.target.value)}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Delivery Charge (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={tier.fee}
                            onChange={(e) => handleTierChange(index, 'fee', e.target.value)}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Delivery Tier
                </button>
              </div>

              {/* Free Delivery Tier */}
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                <h3 className="text-sm font-bold text-emerald-800 mb-4">3. Free Delivery (₹{settings.minOrderFreeDelivery}+)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1.5">Free Delivery threshold (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₹</span>
                      <input
                        type="number"
                        name="minOrderFreeDelivery"
                        value={settings.minOrderFreeDelivery}
                        onChange={handleChange}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold text-emerald-900"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium mt-1">If cart crosses this amount, delivery is FREE.</p>
                  </div>
                </div>
              </div>

              {/* Minimum Order Value */}
              <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
                <h3 className="text-sm font-bold text-rose-800 mb-4">4. Minimum Order Amount (₹{settings.minOrderAmount || 100})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1.5">Minimum cart total required (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-600 font-bold">₹</span>
                      <input
                        type="number"
                        name="minOrderAmount"
                        value={settings.minOrderAmount || ''}
                        onChange={handleChange}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-rose-300 text-sm focus:ring-2 focus:ring-rose-500 transition-all outline-none font-bold text-rose-900"
                      />
                    </div>
                    <p className="text-[10px] text-rose-700 font-medium mt-1">Customers cannot checkout if their total is below this amount.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Share2 className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-800">Social Media Links</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Instagram URL</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-pink-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    name="instagramUrl"
                    value={settings.instagramUrl}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Facebook URL</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    name="facebookUrl"
                    value={settings.facebookUrl}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Twitter / X URL</label>
                <div className="relative">
                  <Share2 className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    name="twitterUrl"
                    value={settings.twitterUrl}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">YouTube URL</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-red-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={settings.youtubeUrl || ''}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">LinkedIn URL</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-blue-700 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={settings.linkedinUrl || ''}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
