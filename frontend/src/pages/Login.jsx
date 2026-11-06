
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { auth } from '../redux/slices';
import api from '../api';
import {
  Scissors,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  CheckCircle2,
  X,
  Sparkles,
  MapPin,
  User,
  Mail,
  Building2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Check
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

  // Account Role Detection State (Super Admin, Barber, Client)
  const [accountInfo, setAccountInfo] = useState(null);
  const [checkingRole, setCheckingRole] = useState(false);

  // Shop Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    shopName: '',
    ownerName: '',
    mobile: '',
    email: '',
    city: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [regMobileError, setRegMobileError] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regBusy, setRegBusy] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(null);

  const handleRegMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setRegForm((prev) => ({ ...prev, mobile: val }));
    if (val.length > 0 && val.length < 10) {
      setRegMobileError('Must be exactly 10 digits');
    } else {
      setRegMobileError('');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regForm.mobile.length !== 10) {
      setRegMobileError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (regForm.password.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    try {
      setRegBusy(true);
      const res = await api.post('/auth/register-shop', regForm);
      setRegSuccess({
        shopName: regForm.shopName,
        ownerName: regForm.ownerName,
        mobile: regForm.mobile,
        message: res.data?.message || 'Shop registration request submitted!'
      });
    } catch (err) {
      setRegError(err.response?.data?.message || 'Failed to submit registration request. Please try again.');
    } finally {
      setRegBusy(false);
    }
  };

  const resetRegModal = () => {
    setShowRegisterModal(false);
    setRegSuccess(null);
    setRegError('');
    setRegMobileError('');
    setRegForm({
      shopName: '',
      ownerName: '',
      mobile: '',
      email: '',
      city: '',
      address: '',
      password: '',
      confirmPassword: ''
    });
  };

  // Mobile Number Validation & Dynamic Role Detection
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);

    setF((prev) => ({
      ...prev,
      mobile: value,
    }));

    if (value.length > 0 && value.length < 10) {
      setMobileError('Mobile number must be exactly 10 digits');
      setAccountInfo(null);
    } else {
      setMobileError('');
      if (value.length === 10) {
        checkAccountRole(value);
      } else {
        setAccountInfo(null);
      }
    }
  };

  const checkAccountRole = async (mobileNum) => {
    try {
      setCheckingRole(true);
      const res = await api.get(`/auth/lookup/${mobileNum}`, { skipGlobalLoader: true });
      setAccountInfo(res.data);
    } catch {
      setAccountInfo(null);
    } finally {
      setCheckingRole(false);
    }
  };

  // Fill Demo Account
  const fillAccount = (mobile, password) => {
    setF({ mobile, password });
    setMobileError('');
    checkAccountRole(mobile);
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

            <p className="text-xs sm:text-sm text-stone-400">
              Login for Admin, Barbers & Clients
            </p>

          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
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

              {/* Detected Account Type Badge / Indicator */}
              {checkingRole && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/60 text-stone-300 text-xs animate-in fade-in">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>Checking account role for {f.mobile}...</span>
                </div>
              )}

              {/* {!checkingRole && accountInfo?.exists && (
                <div className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs animate-in fade-in zoom-in-95 ${accountInfo.role === 'superadmin'
                  ? 'bg-gradient-to-r from-purple-950/70 to-purple-900/30 border-purple-500/50 text-purple-200 shadow-sm shadow-purple-900/30'
                  : accountInfo.role === 'barber'
                    ? 'bg-gradient-to-r from-amber-950/70 to-amber-900/30 border-amber-500/50 text-amber-200 shadow-sm shadow-amber-900/30'
                    : 'bg-gradient-to-r from-blue-950/70 to-blue-900/30 border-blue-500/50 text-blue-200 shadow-sm shadow-blue-900/30'
                  }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${accountInfo.role === 'superadmin'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                    : accountInfo.role === 'barber'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}>
                    {accountInfo.role === 'superadmin' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : accountInfo.role === 'barber' ? (
                      <Scissors className="w-4 h-4 rotate-45" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">
                        {accountInfo.role === 'superadmin'
                          ? 'Super Admin Account'
                          : accountInfo.role === 'barber'
                            ? 'Barber / Salon Account'
                            : 'Client / Customer Account'}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 truncate mt-0.5">
                      Welcome, <strong className="text-white font-semibold">{accountInfo.name || 'User'}</strong>
                      {accountInfo.shopName ? ` • ${accountInfo.shopName}` : ''}
                    </p>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${accountInfo.role === 'superadmin'
                    ? 'bg-purple-500/30 text-purple-200 border-purple-400/40'
                    : accountInfo.role === 'barber'
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400/40'
                      : 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                    }`}>
                    {accountInfo.role === 'superadmin'
                      ? 'Admin'
                      : accountInfo.role === 'barber'
                        ? 'Barber'
                        : 'Client'}
                  </span>
                </div>
              )} */}

              {!checkingRole && accountInfo?.shopRequest && (
                <div className={`p-3 rounded-2xl border text-xs animate-in fade-in ${accountInfo.shopRequest.status === 'pending'
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                  : 'bg-red-950/60 border-red-500/50 text-red-200'
                  }`}>
                  <div className="flex items-center gap-2 font-bold text-white">
                    {accountInfo.shopRequest.status === 'pending' ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Shop Registration Under Review</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span>Shop Registration Not Approved</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                    {accountInfo.shopRequest.status === 'pending'
                      ? `"${accountInfo.shopRequest.shopName}" is awaiting Super Admin verification. You will receive a WhatsApp message on approval.`
                      : `Reason: ${accountInfo.shopRequest.reason || 'Please submit updated registration details.'}`}
                  </p>
                </div>
              )}

              {!checkingRole && accountInfo && !accountInfo.exists && !accountInfo.shopRequest && f.mobile.length === 10 && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-800/80 border border-stone-700/80 text-stone-300 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-[11px] text-stone-300">
                    Mobile not registered yet. If you own a salon, click "Register Your Shop" below.
                  </span>
                </div>
              )}

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
                  name="bp_login_code"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  spellCheck="false"
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

            {/* Dynamic Role-Based Submit Button */}
            <button
              type="submit"
              disabled={busy || f.mobile.length !== 10}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-lg transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${accountInfo?.role === 'superadmin'
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                : accountInfo?.role === 'customer'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                }`}
            >
              <span>
                {busy
                  ? 'Signing in...'
                  : accountInfo?.role === 'superadmin'
                    ? 'Sign In as Super Admin'
                    : accountInfo?.role === 'barber'
                      ? 'Sign In to Barber Dashboard'
                      : accountInfo?.role === 'customer'
                        ? 'Sign In as Client'
                        : 'Sign In to Dashboard'}
              </span>

              {!busy && (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Register Your Shop CTA */}
          <div className="pt-4 border-t border-stone-800 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
              <span>Barber or Salon Owner?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                resetRegModal();
                setShowRegisterModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-800/90 hover:bg-stone-700/80 border border-stone-700 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 font-semibold text-xs transition-all shadow-sm group"
            >
              <Store className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Register Your Shop With Us</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="text-[11px] text-stone-500">
              Submit your shop for review. Super Admin approval & login link will be sent to your WhatsApp.
            </p>
          </div>

        </div>

      </div>

      {/* Shop Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={resetRegModal}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {regSuccess ? (
              /* Success Confirmation View */
              <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Registration Request Submitted!
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
                    Your request for <b className="text-white font-semibold">"{regSuccess.shopName}"</b> has been submitted to the Super Admin for review.
                  </p>
                </div>

                {/* WhatsApp Notification Notice Box */}
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-left space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>WhatsApp Approval Notification</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Once Super Admin approves your shop, a direct WhatsApp message will be sent to{' '}
                    <b className="text-white font-bold">+91 {regSuccess.mobile}</b> with:
                  </p>
                  <ul className="text-[11px] text-stone-400 space-y-1 list-disc list-inside">
                    <li>Your Barber Login URL</li>
                    <li>Registered Mobile & Credentials</li>
                    <li>Step-by-step instructions to set up your shop</li>
                    <li>Your Customer Booking Page Link</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetRegModal}
                    className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/30 transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Register Your Shop
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Join BarberPro multi-tenant platform. Super Admin will verify and approve your shop.
                    </p>
                  </div>
                </div>

                {regError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {/* Shop Name & Owner Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                        Shop Name *
                      </label>
                      <div className="relative">
                        <Store className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Royal Barber Lounge"
                          className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                          value={regForm.shopName}
                          onChange={(e) => setRegForm({ ...regForm, shopName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                        Owner Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Vikram Sharma"
                          className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                          value={regForm.ownerName}
                          onChange={(e) => setRegForm({ ...regForm, ownerName: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Number (with WhatsApp badge note) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        Owner Mobile Number *
                      </label>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp reminder & approval sent here
                      </span>
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        maxLength={10}
                        placeholder="10 digit mobile number"
                        className={`w-full bg-stone-800/90 border rounded-xl pl-9 pr-14 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 transition-all ${regMobileError
                          ? 'border-red-500 focus:ring-red-500/40'
                          : 'border-stone-700 focus:ring-amber-500/40 focus:border-amber-500'
                          }`}
                        value={regForm.mobile}
                        onChange={handleRegMobileChange}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium ${regForm.mobile.length === 10 ? 'text-emerald-400' : 'text-stone-500'
                        }`}>
                        {regForm.mobile.length}/10
                      </span>
                    </div>
                    {regMobileError && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        {regMobileError}
                      </p>
                    )}
                  </div>

                  {/* City & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                        City *
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Pune, Mumbai"
                          className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                          value={regForm.city}
                          onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                        Email Address (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="owner@example.com"
                          className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                          value={regForm.email}
                          onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                      Shop Address / Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shop #4, Ground Floor, MG Road"
                      className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                      value={regForm.address}
                      onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                    />
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                        Create Password * (min 6)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Choose password"
                          className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Confirm password"
                          className="w-full bg-stone-800/90 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                          value={regForm.confirmPassword}
                          onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={resetRegModal}
                      className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-xs font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={regBusy || regForm.mobile.length !== 10}
                      className="flex items-center gap-2 py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {regBusy ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Store className="w-3.5 h-3.5" />
                          <span>Submit Shop for Approval</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
