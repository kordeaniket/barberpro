import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { auth } from '../redux/slices';
import { Scissors, Phone, Lock, ArrowRight, ShieldCheck, Store, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const d = useDispatch();
  const { user, error, busy } = useSelector((s) => s.auth);
  const [f, setF] = useState({ mobile: '', password: '' });

  if (user) {
    return (
      <Navigate
        to={
          user.role === 'superadmin'
            ? '/admin'
            : user.role === 'barber'
            ? '/barber'
            : '/customer'
        }
      />
    );
  }

  const fillAccount = (mobile, password) => {
    setF({ mobile, password });
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-500 selection:text-white">
      {/* Background Ambience / Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/30 mb-1">
              <Scissors className="w-7 h-7 rotate-45" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Barber<span className="text-amber-500">Pro</span>
            </h1>
            <p className="text-sm text-stone-400">Multi-Tenant Salon & Barber Management</p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              d(auth.actions.loginRequest(f));
            }}
            className="space-y-4"
          >
            {/* Mobile / Identifier Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
                Mobile Number or Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 8806689125"
                  className="w-full bg-stone-800/80 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  value={f.mobile}
                  onChange={(e) => setF({ ...f, mobile: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-stone-800/80 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  value={f.password}
                  onChange={(e) => setF({ ...f, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/30 transition-all duration-150 active:scale-[0.99] disabled:opacity-50"
            >
              <span>{busy ? 'Signing in...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-stone-800/90 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick demo credentials:</span>
              </span>
              <span className="text-[11px] text-stone-500">Tap to auto-fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillAccount('8806689125', 'password')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-800/60 hover:bg-stone-800 border border-stone-700/60 text-left transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-200 group-hover:text-amber-400 truncate">
                    Super Admin
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono">8806689125</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillAccount('9999999991', 'barber123')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-800/60 hover:bg-stone-800 border border-stone-700/60 text-left transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-200 group-hover:text-amber-400 truncate">
                    Demo Barber
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono">9999999991</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
