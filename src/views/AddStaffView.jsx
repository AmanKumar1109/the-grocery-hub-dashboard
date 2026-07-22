import React, { useState } from 'react';
import { UserPlus, ArrowLeft, Check, Lock, Mail, Phone, FileText, Truck, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import { useNavigate, Link } from 'react-router-dom';

export default function AddStaffView() {
  const { addStaff } = useAdmin();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    aadhaarNumber: '',
    vehicle: 'Motorcycle (E-Bike)'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setErrorMsg('Please fill in all required fields (Name, Email, Phone, Password).');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addStaff(formData);
      setSuccessMsg(true);
      setTimeout(() => {
        navigate('/staff');
      }, 1500);
    } catch (err) {
      console.error("Error adding staff:", err);
      setErrorMsg(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Add Delivery Personnel"
        subtitle="Register a new delivery partner into the system"
      />

      <main className="p-8 max-w-3xl w-full mx-auto flex-1 space-y-6">
        <Link
          to="/staff"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Delivery Staff
        </Link>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Delivery Partner Registered Successfully!</p>
              <p className="text-xs text-emerald-600">Saved successfully. Redirecting to staff list...</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-fade-in">
            {errorMsg}
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address (For Login) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="driver@groceryhub.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Password & Aadhaar Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Password * (Min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" /> Aadhaar Number
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1234 5678 9012"
                    value={formData.aadhaarNumber}
                    onChange={e => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" /> Vehicle Type *
                </label>
                <select
                  value={formData.vehicle}
                  onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Motorcycle (E-Bike)">Motorcycle (E-Bike)</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Car (Hybrid)">Car (Hybrid)</option>
                  <option value="Bicycle">Bicycle</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/staff')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'Registering...' : 'Register Staff Member'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
