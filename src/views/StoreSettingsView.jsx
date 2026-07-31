import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, Loader2, Phone, Mail, Share2, Globe, Link as LinkIcon, Truck, Receipt, CheckCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react';

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
    minOrderFreeDelivery: 500,
    deliveryTiers: [
      { maxAmount: 199, fee: 15 },
      { maxAmount: 499, fee: 10 }
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
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
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
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
