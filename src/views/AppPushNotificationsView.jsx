import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ImageUploadInput from '../components/ImageUploadInput';
import {
  Bell,
  Send,
  Smartphone,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Layers,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronRight,
  Flame,
  ShoppingBag,
  Zap,
  Info,
  Check,
  Loader2
} from 'lucide-react';

const CAMPAIGN_PRESETS = [
  {
    name: 'Flash Sale (30% Off)',
    icon: Flame,
    title: '🔥 Flash Deal Alert! Flat 30% OFF',
    body: 'Grab fresh farm vegetables, fruits & daily snacks in the next 30 minutes at rock-bottom prices!',
    route: '/catalog',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop'
  },
  {
    name: 'Morning Freshness',
    icon: Zap,
    title: '☀️ Morning Fresh Essentials in 10 Mins!',
    body: 'Start your day with farm fresh milk, oven-fresh bread, eggs & butter delivered right to your doorstep.',
    route: '/home',
    imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&auto=format&fit=crop'
  },
  {
    name: 'Grocery Deals Showcase',
    icon: Sparkles,
    title: '✨ The Grocery Deals: Save Big Today!',
    body: 'Exclusive combo offers on Shivam Namkeens, Gourmet Spices & Pantry staples. Order now!',
    route: '/deals',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop'
  },
  {
    name: 'Tea & Snacks Evening',
    icon: ShoppingBag,
    title: '☕ Evening Chai & Crispy Snacks',
    body: 'Craving evening chai? Get biscuits, namkeens, chips & cookies delivered in 10 minutes flat!',
    route: '/catalog',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop'
  }
];

const ROUTE_OPTIONS = [
  { label: '🏠 Home Screen', value: '/home' },
  { label: '🏷️ The Grocery Deals', value: '/deals' },
  { label: '🛍️ Offers & Deals Catalog', value: '/catalog' },
  { label: '🛒 Customer Cart Screen', value: '/cart' },
  { label: '💬 Support & Complaints', value: '/complaints' }
];

export default function AppPushNotificationsView() {
  const { currentUser } = useAuth();

  // Campaign Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [route, setRoute] = useState('/home');
  const [targetAudience, setTargetAudience] = useState('all');

  // Stats & History
  const [registeredDevicesCount, setRegisteredDevicesCount] = useState(0);
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Real-time Listeners for Device Tokens and Campaign History
  useEffect(() => {
    // Listen to registered device tokens
    const unsubTokens = onSnapshot(
      collection(db, 'fcm_tokens'),
      (snap) => {
        setRegisteredDevicesCount(snap.size);
        let userCount = 0;
        snap.forEach((d) => {
          if (d.data().userId) userCount++;
        });
        setRegisteredUsersCount(userCount);
      },
      (err) => console.warn('Error reading fcm_tokens count:', err)
    );

    // Listen to broadcast campaigns history
    const q = query(
      collection(db, 'broadcast_notifications'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsubCampaigns = onSnapshot(
      q,
      (snap) => {
        const loaded = snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        setCampaigns(loaded);
        setLoading(false);
      },
      (err) => {
        console.warn('Error reading broadcast_notifications:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubTokens();
      unsubCampaigns();
    };
  }, []);

  // Preset Applicator
  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setBody(preset.body);
    setRoute(preset.route);
    setImageUrl(preset.imageUrl || '');
    showToast(`Loaded preset "${preset.name}"`, 'success');
  };

  // Submit Broadcast Notification
  const handleSendBroadcast = async () => {
    if (!title.trim()) {
      showToast('Please enter a notification title', 'error');
      return;
    }
    if (!body.trim()) {
      showToast('Please enter a notification message', 'error');
      return;
    }

    setSending(true);
    setShowConfirmModal(false);

    try {
      // Writing to 'broadcast_notifications' collection triggers the backend Cloud Function
      // which sends to FCM topic 'all_users' + performs device multicast.
      const docRef = await addDoc(collection(db, 'broadcast_notifications'), {
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || null,
        route: route.trim() || '/home',
        targetAudience,
        status: 'pending',
        sentBy: currentUser?.email || 'admin',
        createdAt: serverTimestamp()
      });

      showToast(`🚀 Broadcast dispatched! Trigger ID: ${docRef.id.slice(0, 6)}...`, 'success');

      // Clear form
      setTitle('');
      setBody('');
      setImageUrl('');
      setRoute('/home');
    } catch (err) {
      console.error('Failed to send broadcast notification:', err);
      showToast('Failed to dispatch notification: ' + err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-900/10'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-900/10'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Top Banner / Breadcrumb */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 shadow-xs">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  Firebase Cloud Messaging (FCM)
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Mobile Push Blaster</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                Broadcast Push Notifications
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Topic: all_users (Ready)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Metric Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900">
                {registeredDevicesCount > 0 ? registeredDevicesCount : 'Listening...'}
              </div>
              <div className="text-xs text-slate-500 font-medium">Registered Devices (FCM)</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900">
                {registeredUsersCount}
              </div>
              <div className="text-xs text-slate-500 font-medium">Logged-in App Users</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900">{campaigns.length}</div>
              <div className="text-xs text-slate-500 font-medium">Total Broadcasts Sent</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-700">Google Cloud Backend</div>
              <div className="text-[11px] text-slate-500 font-medium">Automatic ADC Service Auth</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Composer (Left) & Mobile Push Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Composer Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Create New Push Campaign</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatch an instant push banner to every customer with the GroceryHub mobile app.
              </p>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Quick Campaign Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CAMPAIGN_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition group cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-400">Click to use</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Notification Title *</label>
                <span className="text-[11px] text-slate-400">{title.length}/65</span>
              </div>
              <input
                type="text"
                maxLength={65}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🔥 Flash Deal: 40% Off on Fresh Mangoes!"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold"
              />
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Message / Description *</label>
                <span className="text-[11px] text-slate-400">{body.length}/180</span>
              </div>
              <textarea
                rows={3}
                maxLength={180}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Order fresh groceries, bakery items and crispy snacks in the next 30 minutes. Delivered in 10 minutes flat!"
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 leading-relaxed"
              />
            </div>

            {/* Image URL (Rich Push Banner) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Banner Image URL (Optional Rich Notification)</span>
                </label>
                <span className="text-[11px] text-slate-400">16:9 ratio recommended</span>
              </div>
              <div className="space-y-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or paste image URL"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>Or upload directly:</span>
                  <div className="w-full max-w-xs">
                    <ImageUploadInput
                      value={imageUrl}
                      onChange={(url) => setImageUrl(url)}
                      placeholder="Upload push image"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Route & Audience in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  On-Tap Destination Screen
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold"
                >
                  {ROUTE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold"
                >
                  <option value="all">📢 All App Users (all_users topic + devices)</option>
                  <option value="customers">👤 Registered Customers Only</option>
                </select>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="button"
                disabled={sending || !title.trim() || !body.trim()}
                onClick={() => setShowConfirmModal(true)}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {sending
                    ? 'Dispatching Push Notification...'
                    : `🚀 Send Broadcast to All Users (${registeredDevicesCount} Devices)`}
                </span>
              </button>
            </div>
          </div>

          {/* Live Mobile Push Preview (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Mobile Preview
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Android / iOS Lock Screen</span>
              </div>

              {/* Realistic Mobile Device Push Card */}
              <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-4 shadow-2xl space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#F7C415] flex items-center justify-center font-black text-slate-900 text-[10px] shadow-xs">
                      GH
                    </div>
                    <span className="font-bold text-slate-200 text-xs">The Grocery Hub</span>
                    <span className="text-[10px] text-slate-400">• Delivering in 10 mins</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>

                {/* Title & Body */}
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-white leading-snug">
                    {title.trim() || '🔥 Flash Deal Alert! Flat 30% OFF'}
                  </h4>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed">
                    {body.trim() ||
                      'Order fresh fruits, vegetables, dairy & snacks right now. Delivered to your doorstep in 10 minutes flat!'}
                  </p>
                </div>

                {/* Image Preview (if provided) */}
                {imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-700 aspect-video max-h-40 bg-slate-900">
                    <img
                      src={imageUrl}
                      alt="Push Banner"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  </div>
                )}

                {/* Footer / Destination */}
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/50">
                  <span className="flex items-center gap-1 text-purple-400 font-semibold">
                    <ExternalLink className="w-3 h-3" />
                    <span>Tapping opens: {ROUTE_OPTIONS.find((r) => r.value === route)?.label}</span>
                  </span>
                  <span className="text-slate-500">Slide to view</span>
                </div>
              </div>
            </div>

            {/* Architecture Explainer Badge */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Service-Account Setup Needed</span>
              </div>
              <p className="leading-relaxed">
                Cloud Function automatically uses Google Cloud Application Default Credentials (ADC) to broadcast to topic <code className="text-purple-300">all_users</code> and direct multicast to all registered tokens.
              </p>
            </div>
          </div>
        </div>

        {/* Sent Campaigns History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Broadcast Campaigns</h3>
              <p className="text-xs text-slate-500">Live delivery records and status</p>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Total Campaigns: {campaigns.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/70 text-[10px]">
                <tr>
                  <th className="py-3 px-6">Campaign Info</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Dispatched At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No broadcast notifications sent yet. Create your first campaign above!
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => {
                    const dateStr = camp.createdAt?.toDate
                      ? camp.createdAt.toDate().toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : 'Just now';

                    return (
                      <tr key={camp.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-6">
                          <div className="flex items-start gap-3">
                            {camp.imageUrl ? (
                              <img
                                src={camp.imageUrl}
                                alt="thumb"
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                <Bell className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-slate-900 line-clamp-1">
                                {camp.title}
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {camp.body}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {ROUTE_OPTIONS.find((r) => r.value === camp.route)?.label || camp.route}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                            {camp.targetAudience === 'all' ? '📢 All Devices' : '👤 Customers'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {dateStr}
                        </td>

                        <td className="py-3.5 px-4">
                          {camp.status === 'sent' || camp.status === 'delivered' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Sent & Delivered
                            </span>
                          ) : camp.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Processing
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setTitle(camp.title);
                              setBody(camp.body);
                              setImageUrl(camp.imageUrl || '');
                              setRoute(camp.route || '/home');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              showToast('Campaign copied to composer!', 'success');
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition cursor-pointer"
                          >
                            Reuse
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Broadcast Dispatch
                </h3>
                <p className="text-xs text-slate-500">Send push notification to all users</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="font-extrabold text-slate-900">{title}</div>
              <div className="text-slate-600 line-clamp-2">{body}</div>
              <div className="text-[11px] text-purple-700 font-semibold pt-1">
                Target: {registeredDevicesCount} active device(s) on topic "all_users"
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm cursor-pointer"
              >
                Confirm & Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
