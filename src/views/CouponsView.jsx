import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import { Ticket, Plus, Tag, Trash2, Power, PowerOff, Percent, FileDigit, Calendar } from 'lucide-react';
import gsap from 'gsap';

export default function CouponsView() {
  const { coupons, addCoupon, toggleCouponStatus, deleteCoupon } = useAdmin();
  
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'flat', // 'flat' or 'percentage'
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '', // only applicable if percentage
    validUntil: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
      });

      setFormData({
        code: '', discountType: 'flat', discountValue: '', minOrderValue: '', maxDiscount: '', validUntil: '', isActive: true
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

  const globalCoupons = coupons.filter(c => !c.isReferralCoupon && !c.userId);
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
          </div>
        </div>

      </div>
    </div>
  );
}
