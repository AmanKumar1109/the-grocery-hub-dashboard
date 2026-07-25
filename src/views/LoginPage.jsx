import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Truck, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login, currentUser, userRole, authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already logged in → redirect based on role
  if (!authLoading && currentUser) {
    if (userRole === 'superadmin') return <Navigate to="/" replace />;
    if (userRole === 'delivery') return <Navigate to="/rider" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await login(email.trim(), password);
      const loggedEmail = credential.user.email.toLowerCase();
      // Role-based redirect
      if (loggedEmail === 'admin@admin.com') {
        navigate('/', { replace: true });
      } else {
        navigate('/rider', { replace: true });
      }
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError('Invalid email or password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please wait a moment and try again.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Contact support.');
          break;
        default:
          setError('Login failed. Check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-7">

          {/* Logo & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mx-auto">
              <ShoppingBag className="w-8 h-8 text-white stroke-[2]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">The Grocery Hub</h1>
              <p className="text-emerald-400 text-sm font-semibold mt-0.5">Staff Portal · Admin & Delivery</p>
            </div>
          </div>

          {/* Role Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[11px] font-bold text-white">Super Admin</p>
              <p className="text-[10px] text-slate-400 text-center">Full dashboard access</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Truck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] font-bold text-white">Delivery Rider</p>
              <p className="text-[10px] text-slate-400 text-center">Your assigned orders</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl px-4 py-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 tracking-wide uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@admin.com or rider email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/8 border border-white/15 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/8 border border-white/15 text-white placeholder-slate-500 rounded-xl pl-11 pr-12 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-500 font-medium">
            🔒 Authorized personnel only · The Grocery Hub
          </p>
        </div>
      </div>
    </div>
  );
}
