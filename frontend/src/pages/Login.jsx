
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { auth } from '../redux/slices';
import {
  Scissors,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Login() {
  const d = useDispatch();
  const { user, error, busy } = useSelector((s) => s.auth);

  const [f, setF] = useState({
    mobile: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [mobileError, setMobileError] = useState('');

  // Mobile Number Validation
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);

    setF((prev) => ({
      ...prev,
      mobile: value,
    }));

    if (value.length > 0 && value.length < 10) {
      setMobileError('Mobile number must be exactly 10 digits');
    } else {
      setMobileError('');
    }
  };

  // Fill Demo Account
  const fillAccount = (mobile, password) => {
    setF({ mobile, password });
    setMobileError('');
  };

  // Redirect Based on User Role
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

  // Login Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (f.mobile.length !== 10) {
      setMobileError('Please enter a valid 10 digit mobile number');
      return;
    }

    if (!f.password.trim()) {
      return;
    }

    d(auth.actions.loginRequest(f));
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

            <p className="text-sm text-stone-400">
              Multi-Tenant Salon & Barber Management
            </p>

          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Mobile Number Input */}
            <div className="space-y-1.5">

              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
                Mobile Number
              </label>

              <div className="relative">

                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10 digit mobile number"
                  maxLength={10}
                  className={`w-full bg-stone-800/80 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 transition-all ${mobileError
                      ? 'border-red-500 focus:ring-red-500/40'
                      : 'border-stone-700 focus:ring-amber-500/40 focus:border-amber-500'
                    }`}
                  value={f.mobile}
                  onChange={handleMobileChange}
                  required
                />

              </div>

              {/* Mobile Validation & Counter */}
              <div className="flex justify-between items-center min-h-4">

                {mobileError ? (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {mobileError}
                  </p>
                ) : (
                  <p className="text-xs text-stone-500">
                    Enter exactly 10 digits
                  </p>
                )}

                <span className={`text-xs ${f.mobile.length === 10
                    ? 'text-green-400'
                    : 'text-stone-500'
                  }`}>
                  {f.mobile.length}/10
                </span>

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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full bg-stone-800/80 border border-stone-700 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  value={f.password}
                  onChange={(e) =>
                    setF((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />

                {/* Show / Hide Password Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-500 transition-colors focus:outline-none"
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  title={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>

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
              disabled={busy || f.mobile.length !== 10}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/30 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >

              <span>
                {busy ? 'Signing in...' : 'Sign In to Dashboard'}
              </span>

              {!busy && (
                <ArrowRight className="w-4 h-4" />
              )}

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
