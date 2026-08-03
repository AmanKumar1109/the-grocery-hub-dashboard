import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, Loader2, Phone, Mail, Share2, Globe, Link as LinkIcon, Truck, Receipt, CheckCircle, AlertTriangle, Plus, Trash2, Star, Megaphone } from 'lucide-react';
import ImageUploadInput from '../components/ImageUploadInput';

const SETTINGS_DOC_REF = doc(db, 'settings', 'global');

export default function StoreSettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  const [settings, setSettings] = useState({
    supportPhone: '',
    whatsappNumber: '',
    supportEmail: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
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
          { id: 1, label: 'Dairy & Fresh Milk', url: '/?category=Dairy & Fresh Milk#shop' },
          { id: 2, label: 'Bakery & Breads', url: '/?category=Bakery & Breads#shop' },
          { id: 3, label: 'Rice, Atta & Dals', url: '/?category=Rice, Atta & Dals#shop' },
          { id: 4, label: 'Oils, Ghee & Masalas', url: '/?category=Oils, Ghee & Masalas#shop' },
          { id: 5, label: 'Snacks & Beverages', url: '/?category=Snacks & Beverages#shop' }
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
    ]
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
                  { id: 1, label: 'Dairy & Fresh Milk', url: '/?category=Dairy & Fresh Milk#shop' },
                  { id: 2, label: 'Bakery & Breads', url: '/?category=Bakery & Breads#shop' },
                  { id: 3, label: 'Rice, Atta & Dals', url: '/?category=Rice, Atta & Dals#shop' },
                  { id: 4, label: 'Oils, Ghee & Masalas', url: '/?category=Oils, Ghee & Masalas#shop' },
                  { id: 5, label: 'Snacks & Beverages', url: '/?category=Snacks & Beverages#shop' }
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
      links[linkIndex] = { ...links[linkIndex], [field]: value };
      cols[colIndex] = { ...cols[colIndex], links };
      return { ...prev, footerColumns: cols };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await setDoc(SETTINGS_DOC_REF, {
        ...settings,
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
