import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ImageUploadInput from '../components/ImageUploadInput';
import {
  Bell,
  Send,
  Smartphone,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Image as ImageIcon,
  Check,
  Loader2,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Copy
} from 'lucide-react';

const CAMPAIGN_PRESETS = [
  {
    name: 'Flash Sale (30% Off)',
    title: 'Flash Sale Alert: Flat 30% OFF',
    body: 'Grab fresh farm vegetables, fruits and daily groceries in the next 30 minutes at discounted prices!',
    route: '/catalog',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop'
  },
  {
    name: 'Morning Essentials',
    title: 'Fresh Milk & Breakfast in 10 Mins',
    body: 'Start your morning with fresh dairy, warm bakery items, eggs & bread delivered to your door.',
    route: '/home',
    imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&auto=format&fit=crop'
  },
  {
    name: 'Curated Deals',
    title: 'The Grocery Deals: Top Offers Today',
    body: 'Special combo savings on snacks, namkeens and kitchen staples. Limited stock available.',
    route: '/deals',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop'
  },
  {
    name: 'Evening Snacks',
    title: 'Tea & Crispy Snacks Delivery',
    body: 'Hot tea companions, cookies, chips and mixtures delivered in 10 minutes flat.',
    route: '/catalog',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop'
  }
];

const ROUTE_OPTIONS = [
  { label: 'Home Screen', value: '/home' },
  { label: 'The Grocery Deals Showcase', value: '/deals' },
  { label: 'Offers & Catalog', value: '/catalog' },
  { label: 'Cart Screen', value: '/cart' },
  { label: 'Customer Support & Help', value: '/complaints' }
];

export default function AppPushNotificationsView() {
  const { currentUser } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [route, setRoute] = useState('/home');
  const [targetAudience, setTargetAudience] = useState('all');

  // Stats & History
  const [registeredDevicesCount, setRegisteredDevicesCount] = useState(null);
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    // 1. Listen to device tokens
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
      (err) => console.warn('Error reading fcm_tokens:', err)
    );

    // 2. Listen to sent campaigns
    const q = query(
      collection(db, 'broadcast_notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
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

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setBody(preset.body);
    setRoute(preset.route);
    setImageUrl(preset.imageUrl || '');
    showToast(`Loaded "${preset.name}" template`);
  };

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

      showToast('Broadcast notification sent successfully!');
      setTitle('');
      setBody('');
      setImageUrl('');
      setRoute('/home');
    } catch (err) {
      console.error('Failed to send broadcast:', err);
      showToast('Error sending broadcast: ' + err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Standard Header */}
      <Header
        title="Push Notifications"
        subtitle="Compose and broadcast push notifications to Android and iOS mobile app customers"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Clean, Unified KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active App Devices</span>
              <Smartphone className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {registeredDevicesCount !== null ? registeredDevicesCount : '...'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Registered for push alerts</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Logged-in Users</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {registeredUsersCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Linked customer accounts</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Broadcasts Sent</span>
              <Send className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {campaigns.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total push campaigns</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Broadcast Channel</span>
              <Radio className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-bold text-slate-800">all_users</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Connected & Ready</p>
          </div>
        </div>

        {/* 2-Column Composer & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Compose Broadcast</h3>
                <p className="text-xs text-slate-500">
                  Deliver an instant notification to all active devices simultaneously
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                FCM Protocol
              </span>
            </div>

            {/* Quick Templates - Clean, Minimal Horizontal Pills */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Quick Templates
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CAMPAIGN_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap transition cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Notification Title *</label>
                <span className="text-[11px] text-slate-400">{title.length}/60</span>
              </div>
              <input
                type="text"
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Flash Deal: Flat 30% Off on Fresh Mangoes"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 font-medium"
              />
            </div>

            {/* Notification Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Message Description *</label>
                <span className="text-[11px] text-slate-400">{body.length}/160</span>
              </div>
              <textarea
                rows={3}
                maxLength={160}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Order fresh vegetables, bakery and snacks in the next 30 minutes. Delivered to your doorstep in 10 minutes flat!"
                className="w-full p-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 leading-relaxed"
              />
            </div>

            {/* Banner Image URL (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rich Image Banner (Optional)</span>
                </label>
                <span className="text-[11px] text-slate-400">16:9 ratio</span>
              </div>
              <div className="space-y-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or paste image link"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                />
                <div className="pt-1">
                  <ImageUploadInput
                    value={imageUrl}
                    onChange={(url) => setImageUrl(url)}
                    placeholder="Upload banner image from computer"
                  />
                </div>
              </div>
            </div>

            {/* In-App Target Screen & Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  On-Tap Target Screen
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                >
                  {ROUTE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                >
                  <option value="all">All Devices (Topic all_users)</option>
                  <option value="customers">Registered Customers Only</option>
                </select>
              </div>
            </div>

            {/* Action Button - Solid, Confident, Clean */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Audience:{' '}
                <strong className="text-slate-800">
                  {registeredDevicesCount !== null ? `${registeredDevicesCount} Devices` : 'All Users'}
                </strong>
              </span>

              <button
                type="button"
                disabled={sending || !title.trim() || !body.trim()}
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Broadcast</span>
              </button>
            </div>
          </div>

          {/* Right Column: Realistic Clean Phone Mockup (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <span className="text-xs font-bold text-slate-800">Device Preview</span>
              <span className="text-[11px] text-slate-400">Lock Screen Banner</span>
            </div>

            {/* Smartphone Mockup */}
            <div className="w-full max-w-[320px] rounded-[2.2rem] bg-slate-950 p-3.5 shadow-xl border-4 border-slate-800">
              {/* Phone Speaker & Dynamic Island */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-950 mr-2" />
                  <div className="w-2 h-2 rounded-full bg-slate-950" />
                </div>
              </div>

              {/* Wallpaper Canvas with Notification Banner */}
              <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-3 space-y-3 min-h-[380px] flex flex-col justify-between">
                {/* Simulated Time */}
                <div className="text-center pt-2 text-white">
                  <div className="text-3xl font-light tracking-tight">09:41</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Wednesday, 13 November</div>
                </div>

                {/* The Floating Notification Card */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-white/20 text-slate-900 space-y-2 transition-all">
                  {/* Card Header */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-[#F7C415] flex items-center justify-center font-black text-slate-900 text-[8px] shadow-2xs">
                        GH
                      </div>
                      <span className="font-bold text-slate-800">GroceryHub</span>
                    </div>
                    <span className="text-[10px] text-slate-400">now</span>
                  </div>

                  {/* Title & Body */}
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {title.trim() || 'Flash Sale: Flat 30% OFF'}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-3">
                      {body.trim() ||
                        'Order fresh vegetables, bakery and snacks in the next 30 minutes. Delivered in 10 minutes flat!'}
                    </div>
                  </div>

                  {/* Optional Banner Image */}
                  {imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video max-h-32 bg-slate-100 mt-1">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    </div>
                  )}

                  {/* Destination Tag */}
                  <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100">
                    <span>Opens: {ROUTE_OPTIONS.find((r) => r.value === route)?.label}</span>
                    <span>Tap to view</span>
                  </div>
                </div>

                {/* Bottom lock screen actions */}
                <div className="flex items-center justify-between px-3 text-[10px] text-slate-500 pb-2">
                  <span>Swipe up to open</span>
                  <div className="w-20 h-1 bg-white/30 rounded-full mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campaign History</h3>
              <p className="text-xs text-slate-500">Record of previously dispatched broadcasts</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {campaigns.length} Total Campaigns
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/70 text-[11px]">
                <tr>
                  <th className="py-3 px-6">Campaign</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No broadcast campaigns sent yet.
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
                      <tr key={camp.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-6">
                          <div className="flex items-start gap-3">
                            {camp.imageUrl ? (
                              <img
                                src={camp.imageUrl}
                                alt="thumb"
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                <Bell className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 line-clamp-1">
                                {camp.title}
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {camp.body}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {ROUTE_OPTIONS.find((r) => r.value === camp.route)?.label || camp.route}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {camp.targetAudience === 'all' ? 'All Devices' : 'Customers'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {dateStr}
                        </td>

                        <td className="py-3.5 px-4">
                          {camp.status === 'sent' || camp.status === 'delivered' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Delivered
                            </span>
                          ) : camp.status === 'failed' ? (
                            <span
                              title={camp.error ? `Error: ${camp.error}` : 'Failed to dispatch'}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Processing
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setTitle(camp.title);
                              setBody(camp.body);
                              setImageUrl(camp.imageUrl || '');
                              setRoute(camp.route || '/home');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              showToast('Campaign copied to composer');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Reuse</span>
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
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Confirm Broadcast Dispatch
                </h3>
                <p className="text-xs text-slate-500">Send push notification to all users</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-900">{title}</div>
              <div className="text-slate-600 line-clamp-2">{body}</div>
              <div className="text-[11px] text-slate-500 pt-1">
                Target: {registeredDevicesCount !== null ? registeredDevicesCount : 'All'} active device(s)
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
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition shadow-sm cursor-pointer"
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
