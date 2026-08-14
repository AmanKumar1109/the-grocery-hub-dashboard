import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import { Ticket, Plus, Tag, Trash2, Power, PowerOff, Percent, FileDigit, Calendar } from 'lucide-react';
import gsap from 'gsap';

export default function CouponsView() {
  const { coupons, users, addCoupon, toggleCouponStatus, deleteCoupon } = useAdmin();
  
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'flat', // 'flat' or 'percentage'
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '', // only applicable if percentage
    validUntil: '',
    userId: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Animate on load
  React.useEffect(() => {
    gsap.fromTo(".coupon-card", 
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
    );
  }, [coupons.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const code = formData.code.trim().toUpperCase();
      if (!code) throw new Error("Coupon Code is required");
      if (coupons.some(c => c.code === code)) throw new Error("This Coupon Code already exists");

      const val = parseFloat(formData.discountValue);
      if (isNaN(val) || val <= 0) throw new Error("Invalid Discount Value");

      if (formData.discountType === 'percentage' && val > 100) {
        throw new Error("Percentage discount cannot exceed 100%");
      }

      await addCoupon({
        ...formData,
        code,
        discountValue: val,
        minOrderValue: parseFloat(formData.minOrderValue) || 0,
        maxDiscount: parseFloat(formData.maxDiscount) || 0,
        isGlobal: formData.userId ? false : true,
        userId: formData.userId || null,
        isReferralCoupon: false
      });

      setFormData({
        code: '', discountType: 'flat', discountValue: '', minOrderValue: '', maxDiscount: '', validUntil: '', userId: '', isActive: true
      });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = (coupon) => {
    toggleCouponStatus(coupon.id, coupon.isActive);
  };

  const handleDelete = (coupon) => {
    if (window.confirm(`Are you sure you want to permanently delete coupon ${coupon.code}?`)) {
      deleteCoupon(coupon.id, coupon.code);
    }
  };

  const globalCoupons = coupons.filter(c => !c.isReferralCoupon && !c.userId).filter(c => 
    (c.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchesSearch = (assignedUser, userId) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (assignedUser) {
      return (
        (assignedUser.fullName || assignedUser.name || '').toLowerCase().includes(q) ||
        (assignedUser.email || '').toLowerCase().includes(q) ||
        (assignedUser.phone || '').toLowerCase().includes(q)
      );
    }
    return (userId || '').toLowerCase().includes(q);
  };

  const personalCoupons = coupons.filter(c => {
    if (!c.userId) return false;
    const assignedUser = users.find(u => u.id === c.userId);
    if (!matchesSearch(assignedUser, c.userId)) return false;
    
    if (assignedUser && assignedUser.usedCoupons) {
      const isUsed = Array.isArray(assignedUser.usedCoupons)
        ? (assignedUser.usedCoupons.includes(c.id) || assignedUser.usedCoupons.includes(c.code))
        : (typeof assignedUser.usedCoupons === 'string' && (assignedUser.usedCoupons.includes(c.id) || assignedUser.usedCoupons.includes(c.code)));
      if (isUsed) return false;
    }
    return true;
  });
  
  const usedPersonalCoupons = coupons.filter(c => {
    if (!c.userId) return false;
    const assignedUser = users.find(u => u.id === c.userId);
    if (!matchesSearch(assignedUser, c.userId)) return false;
    
    if (assignedUser && assignedUser.usedCoupons) {
      return Array.isArray(assignedUser.usedCoupons)
        ? (assignedUser.usedCoupons.includes(c.id) || assignedUser.usedCoupons.includes(c.code))
        : (typeof assignedUser.usedCoupons === 'string' && (assignedUser.usedCoupons.includes(c.id) || assignedUser.usedCoupons.includes(c.code)));
    }
    return false;
  });

  const activeCount = globalCoupons.filter(c => c.isActive).length;

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 min-h-screen">
      <Header title="Discount Coupons" subtitle="Manage Promo Codes and Offers" />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Top Summary */}
        <div className="flex gap-4 mb-2">
          <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm flex-1 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Coupons</p>
              <p className="text-2xl font-black text-slate-800">{globalCoupons.length}</p>
            </div>
          </div>
          <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm flex-1 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <Power className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Promo Codes</p>
              <p className="text-2xl font-black text-slate-800">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden sticky top-6">
              <div className="bg-slate-900 p-5 text-white">
                <h2 className="text-base font-black flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" /> Create Promo Code
                </h2>
                <p className="text-xs text-slate-400 mt-1">Generate a new discount coupon for your customers.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && (
                  <div className="bg-rose-50 text-rose-600 text-xs font-bold p-3 rounded-xl border border-rose-200">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">Coupon Code *</label>
                  <div className="relative">
                    <FileDigit className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. WELCOME50"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-bold placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">Type *</label>
                    <select
                      value={formData.discountType}
                      onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      <option value="flat">Flat (₹) Off</option>
                      <option value="percentage">Percentage (%) Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">Value *</label>
                    <div className="relative">
                      {formData.discountType === 'percentage' ? (
                        <Percent className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      ) : (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      )}
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        placeholder="e.g. 50"
                        value={formData.discountValue}
                        onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">Max Discount Limit (₹) (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 100 (Max ₹100 off)"
                      value={formData.maxDiscount}
                      onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">Min Order Value (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 499"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">Expiry Date *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={formData.validUntil}
                      onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">Assign to Customer (Optional)</label>
                  <select
                    value={formData.userId}
                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="">Global Coupon (All Users)</option>
                    {users.filter(u => !u.isBlocked).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.name || 'Unnamed User'} ({u.email || u.phone || u.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Coupon'} <Ticket className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Coupons List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-slate-400" /> Existing Coupons
            </h3>
            
            {globalCoupons.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Ticket className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Coupons Yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">Create your first promo code to boost your sales and reward your customers!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {globalCoupons.map(coupon => (
                  <div 
                    key={coupon.id} 
                    className={`coupon-card relative bg-white p-5 rounded-3xl border ${coupon.isActive ? 'border-emerald-200 shadow-sm' : 'border-slate-200 opacity-60'} overflow-hidden transition-all`}
                  >
                    {/* Dashed edge visual */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-slate-50 rounded-full border-r border-slate-200"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-slate-50 rounded-full border-l border-slate-200"></div>
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className={`px-3 py-1 rounded-lg text-xs font-black tracking-widest ${coupon.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {coupon.code}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggle(coupon)}
                          className={`p-1.5 rounded-lg transition-colors ${coupon.isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                          title={coupon.isActive ? 'Pause Coupon' : 'Activate Coupon'}
                        >
                          {coupon.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(coupon)}
                          className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <h4 className="text-xl font-black text-slate-900">
                        {coupon.discountType === 'flat' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`}
                      </h4>
                      <p className="text-xs font-bold text-slate-500">
                        On orders above ₹{coupon.minOrderValue}
                        {coupon.discountType === 'percentage' && coupon.maxDiscount > 0 && ` • Up to ₹${coupon.maxDiscount}`}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 border-dashed flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Valid Till: {new Date(coupon.validUntil).toLocaleDateString()}</span>
                      <span className={coupon.isActive ? 'text-emerald-500' : 'text-slate-400'}>{coupon.isActive ? 'ACTIVE' : 'PAUSED'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Personal Coupons List */}
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" /> Personal Coupons
                </h3>
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search user (Name, Email, Phone)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  />
                </div>
              </div>
              
              {personalCoupons.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-8 flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-slate-500">
                    {searchQuery ? 'No coupons match this user.' : 'No personal coupons assigned yet.'}
                  </p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                    {personalCoupons.map(coupon => {
                      const assignedUser = users.find(u => u.id === coupon.userId);
                      return (
                        <div 
                          key={coupon.id} 
                          className={`coupon-card relative bg-white p-5 rounded-3xl border ${coupon.isActive ? 'border-emerald-200 shadow-sm' : 'border-slate-200 opacity-60'} overflow-hidden transition-all`}
                        >
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-slate-50 rounded-full border-r border-slate-200"></div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-slate-50 rounded-full border-l border-slate-200"></div>
                          
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col gap-1.5">
                              <div className={`px-3 py-1 w-fit rounded-lg text-xs font-black tracking-widest ${coupon.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                {coupon.code}
                              </div>
                              {coupon.isReferralCoupon ? (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider rounded border border-blue-100 w-fit">Referral Reward</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black uppercase tracking-wider rounded border border-purple-100 w-fit">Admin Assigned</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggle(coupon)}
                                className={`p-1.5 rounded-lg transition-colors ${coupon.isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                title={coupon.isActive ? 'Pause Coupon' : 'Activate Coupon'}
                              >
                                {coupon.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleDelete(coupon)}
                                className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1 mb-3">
                            <h4 className="text-xl font-black text-slate-900">
                              {coupon.discountType === 'flat' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`}
                            </h4>
                            <p className="text-xs font-bold text-slate-500">
                              On orders above ₹{coupon.minOrderValue}
                              {coupon.discountType === 'percentage' && coupon.maxDiscount > 0 && ` • Up to ₹${coupon.maxDiscount}`}
                            </p>
                          </div>
                          
                          <div className="mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Assigned To:</p>
                            <p className="text-xs font-black text-slate-800 truncate">
                              {assignedUser ? `${assignedUser.fullName || assignedUser.name || 'User'} (${assignedUser.email || assignedUser.phone})` : coupon.userId}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-slate-100 border-dashed flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Valid Till: {new Date(coupon.validUntil).toLocaleDateString()}</span>
                            <span className={coupon.isActive ? 'text-amber-500' : 'text-slate-400'}>{coupon.isActive ? 'ACTIVE' : 'PAUSED'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Used/Redeemed Personal Coupons List */}
            {usedPersonalCoupons.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-slate-300" /> Used / Redeemed Coupons
                </h3>
                
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                    {usedPersonalCoupons.map(coupon => {
                      const assignedUser = users.find(u => u.id === coupon.userId);
                      return (
                        <div 
                          key={coupon.id} 
                          className="coupon-card relative bg-slate-50 p-5 rounded-3xl border border-slate-200 overflow-hidden"
                        >
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-r border-slate-200"></div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full border-l border-slate-200"></div>
                        
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col gap-1.5">
                              <div className="px-3 py-1 w-fit rounded-lg text-xs font-black tracking-widest bg-slate-200 text-slate-500 line-through">
                                {coupon.code}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider rounded border border-rose-100 w-fit">
                                  Already Used
                                </span>
                                {coupon.isReferralCoupon ? (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider rounded border border-blue-100 w-fit">Referral Reward</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black uppercase tracking-wider rounded border border-purple-100 w-fit">Admin Assigned</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 mb-3 opacity-60">
                            <h4 className="text-xl font-black text-slate-700">
                              {coupon.discountType === 'flat' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`}
                            </h4>
                          </div>
                          
                          <div className="mb-4 bg-white p-2 rounded-lg border border-slate-200 opacity-70">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Redeemed By:</p>
                            <p className="text-xs font-black text-slate-600 truncate">
                              {assignedUser ? `${assignedUser.fullName || assignedUser.name || 'User'} (${assignedUser.email || assignedUser.phone})` : coupon.userId}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
