import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { saveSession, clearSession } from '../api';
import { fmt } from '../components/Shell';
import ConfirmModal from '../components/Modal';
import { StatusBadge } from '../components/Crud';
import {
  Scissors,
  Calendar,
  Clock,
  MapPin,
  Phone,
  LogOut,
  CheckCircle2,
  Sparkles,
  User,
  AlertCircle,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Award,
  Save,
  Store,
  X,
  Tag,
  Star,
  KeyRound,
  Compass,
  Sun,
  Sunset,
  Moon,
  Search,
  Check,
  CalendarDays
} from 'lucide-react';

const msgOf = (e) => e.response?.data?.message || e.message;

const getUpcomingDays = () => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: d.toISOString().slice(0, 10),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' })
    });
  }
  return days;
};

export function ShopPage() {
  const { code } = useParams();
  const nav = useNavigate();
  const [info, setInfo] = useState(null);
  const [mode, setMode] = useState('register');
  const [f, setF] = useState({});
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoErr, setLogoErr] = useState(false);

  useEffect(() => {
    api
      .get('/customer/public/shop/' + code)
      .then((r) => setInfo(r.data))
      .catch((e) => setErr(msgOf(e)));
  }, [code]);

  const go = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { data } = await api.post(
        mode === 'register' ? '/auth/register-customer' : '/auth/login',
        { ...f, shopCode: code }
      );
      saveSession(data);
      localStorage.setItem('shopCode', code);
      nav('/customer');
    } catch (x) {
      setErr(msgOf(x));
    } finally {
      setLoading(false);
    }
  };

  if (!info && !err) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
            <Scissors className="w-6 h-6 rotate-45" />
          </div>
          <p className="text-sm font-medium text-stone-300">Loading store...</p>
        </div>
      </div>
    );
  }

  if (err && !info) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="card max-w-sm w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-stone-900">Salon Not Found</h2>
          <p className="text-xs text-stone-500">{err}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 p-4 sm:p-6 flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Shop Info Card with Custom Logo & Hours */}
        <div className="bg-stone-800/90 border border-stone-700/80 rounded-3xl p-6 space-y-4 shadow-2xl backdrop-blur-xl text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md inline-block">
                Verified Salon
              </span>
              <h1 className="text-2xl font-extrabold text-white mt-1">{info.shop.name}</h1>
              {info.shop.description && (
                <p className="text-xs text-stone-400 mt-0.5 leading-snug">{info.shop.description}</p>
              )}
              <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>
                  {info.shop.address ? `${info.shop.address}, ` : ''}
                  {info.shop.city || 'City'}
                </span>
              </p>
              <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>
                  Hours: {fmt(info.shop.openMin)} – {fmt(info.shop.closeMin)}
                </span>
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 overflow-hidden shrink-0 border border-amber-500">
              {info.shop.logoUrl && !logoErr ? (
                <img
                  src={info.shop.logoUrl}
                  alt={info.shop.name}
                  onError={() => setLogoErr(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Scissors className="w-6 h-6 rotate-45" />
              )}
            </div>
          </div>

          {/* Services Menu Preview */}
          <div className="pt-3 border-t border-stone-700/80 space-y-2">
            <p className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Popular Services
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {info.services.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-stone-700/50"
                >
                  <div>
                    <span className="font-semibold text-stone-200 block">{s.name}</span>
                    <span className="text-[10px] text-stone-400">{s.duration} mins</span>
                  </div>
                  <span className="font-bold text-amber-400">₹{s.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Auth Card */}
        <form onSubmit={go} className="card p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-base font-bold text-stone-900">
              {mode === 'register' ? 'Register to Book' : 'Client Login'}
            </h2>
            <span className="text-xs text-stone-400">
              {mode === 'register' ? 'Step 1 of 2' : 'Welcome back'}
            </span>
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Full Name *</label>
              <input
                className="inp"
                placeholder="e.g. Rahul Sharma"
                required
                value={f.name || ''}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-600">Mobile Number *</label>
            <input
              className="inp"
              placeholder="e.g. 9876543210"
              required
              value={f.mobile || ''}
              onChange={(e) => setF({ ...f, mobile: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-600">Password *</label>
            <input
              className="inp"
              type="password"
              placeholder="••••••••"
              required
              value={f.password || ''}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          </div>

          {err && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-brand w-full py-3"
          >
            <span>{loading ? 'Processing...' : mode === 'register' ? 'Register & Continue' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="w-full text-center text-xs text-stone-500 hover:text-stone-900 pt-1"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          >
            {mode === 'register' ? 'Already registered? Sign in' : 'New client? Register here'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Customer() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'book' | 'appointments' | 'profile'
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [shopInfo, setShopInfo] = useState(null);
  const [svcs, setSvcs] = useState([]);
  const [bk, setBk] = useState([]);
  const [code, setCode] = useState('');
  const [searchSvc, setSearchSvc] = useState('');

  // Booking Flow State
  const upcomingDays = getUpcomingDays();
  const [selectedDate, setSelectedDate] = useState(upcomingDays[0].dateStr);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');
  const [showConfirmBookingModal, setShowConfirmBookingModal] = useState(false);

  // Multi-select computed total duration and price
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  const toggleService = (s) => {
    setSelectedServices((prev) => {
      const exists = prev.some((x) => x._id === s._id);
      return exists ? prev.filter((x) => x._id !== s._id) : [...prev, s];
    });
  };

  // Modals
  const [cancelBookingTarget, setCancelBookingTarget] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  // Appointments Filter
  const [apptFilter, setApptFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'cancelled'

  // Customer Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: '',
    dob: '',
    gender: 'unspecified',
    notes: '',
    loyaltyPoints: 0
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const loadBookings = () => api.get('/customer/bookings').then((r) => setBk(r.data || []));

  const loadProfile = () => {
    api.get('/customer/profile').then((r) => {
      const u = r.data.user || {};
      const c = r.data.customer || {};
      setProfileData({
        name: u.name || c.name || '',
        email: u.email || c.email || '',
        mobile: u.mobile || c.mobile || '',
        dob: c.dob ? c.dob.slice(0, 10) : '',
        gender: c.gender || 'unspecified',
        notes: c.notes || '',
        loyaltyPoints: c.loyaltyPoints || 0
      });
      setUser((prev) => ({ ...prev, name: u.name || c.name }));
    });
  };

  useEffect(() => {
    loadBookings();
    loadProfile();
  }, []);

  useEffect(() => {
    const c = localStorage.getItem('shopCode');
    if (c) {
      setCode(c);
      api.get('/customer/public/shop/' + c).then((r) => {
        setShopInfo(r.data);
        setSvcs(r.data.services || []);
      });
    }
  }, []);

  // Fetch slots whenever selected services, date, or shop changes
  useEffect(() => {
    if (code && selectedServices.length > 0 && selectedDate) {
      setSlotsLoading(true);
      setSelectedSlot(null);
      const svcIds = selectedServices.map((s) => s._id).join(',');
      api
        .get('/customer/public/slots', {
          params: { code, serviceIds: svcIds, duration: totalDuration, date: selectedDate }
        })
        .then((r) => {
          setSlots(r.data || []);
          setSlotsLoading(false);
        })
        .catch(() => {
          setSlots([]);
          setSlotsLoading(false);
        });
    } else {
      setSlots([]);
    }
  }, [selectedServices, selectedDate, code, totalDuration]);

  const confirmAndBook = async () => {
    if (selectedServices.length === 0 || !selectedSlot) return;
    setBookingLoading(true);
    setBookingMsg('');
    try {
      const { data } = await api.post('/customer/bookings', {
        serviceIds: selectedServices.map((s) => s._id),
        serviceId: selectedServices[0]._id,
        date: selectedDate,
        startMin: selectedSlot.startMin
      });
      setBookingMsg(data.message || 'Appointment booked successfully!');
      loadBookings();
      loadProfile();
      setShowConfirmBookingModal(false);
      setSelectedSlot(null);
      // Switch to bookings tab after short delay
      setTimeout(() => {
        setActiveTab('appointments');
      }, 1200);
    } catch (e) {
      setBookingMsg(msgOf(e));
    } finally {
      setBookingLoading(false);
    }
  };

  const executeCancel = async () => {
    if (cancelBookingTarget) {
      await api.patch(`/customer/bookings/${cancelBookingTarget._id}/cancel`);
      loadBookings();
      setCancelBookingTarget(null);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await api.patch('/customer/profile', {
        name: profileData.name,
        email: profileData.email,
        dob: profileData.dob || undefined,
        gender: profileData.gender,
        notes: profileData.notes
      });
      setProfileMsg('Profile updated successfully!');
      const current = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...current, name: profileData.name }));
      setUser((prev) => ({ ...prev, name: profileData.name }));
      loadProfile();
    } catch (err) {
      setProfileMsg(msgOf(err));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword.length < 8) {
      setPwError('Password must be at least 8 characters long.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('Passwords do not match.');
      return;
    }
    try {
      await api.post('/auth/change-password', { newPassword: pwForm.newPassword });
      setShowPasswordModal(false);
      setPwForm({ newPassword: '', confirm: '' });
      setPwError('');
      setProfileMsg('Password changed successfully!');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    }
  };

  // Service list filtered by search
  const filteredServices = svcs.filter((s) => {
    if (!searchSvc) return true;
    return s.name.toLowerCase().includes(searchSvc.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchSvc.toLowerCase());
  });

  // Appointment list filtered
  const filteredAppointments = bk.filter((b) => {
    if (apptFilter === 'all') return true;
    if (apptFilter === 'active') return ['pending', 'confirmed', 'in_progress'].includes(b.status);
    if (apptFilter === 'completed') return b.status === 'completed';
    if (apptFilter === 'cancelled') return ['cancelled', 'rejected', 'no_show'].includes(b.status);
    return true;
  });

  // Disable past slots if selected date is today
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const nowMinutes = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  const isSlotDisabled = (s) => !s.available || (isToday && s.startMin < nowMinutes);

  // Slot groups by time of day
  const morningSlots = slots.filter((s) => s.startMin < 720); // before 12 PM
  const afternoonSlots = slots.filter((s) => s.startMin >= 720 && s.startMin < 1020); // 12 PM - 5 PM
  const eveningSlots = slots.filter((s) => s.startMin >= 1020); // 5 PM onwards

  // Loyalty Tier Calculation
  const pts = profileData.loyaltyPoints;
  const tier = pts >= 300 ? 'Gold' : pts >= 100 ? 'Silver' : 'Bronze';
  const tierColor =
    tier === 'Gold'
      ? 'from-amber-400 to-amber-600 text-amber-950'
      : tier === 'Silver'
        ? 'from-stone-300 to-stone-400 text-stone-900'
        : 'from-amber-700/80 to-amber-800 text-white';

  const activeBookingsCount = bk.filter((b) => ['pending', 'confirmed'].includes(b.status)).length;

  return (
    <div className="min-h-screen bg-stone-100/60 pb-24 text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Mobile App Top App Bar */}
      <header className="sticky top-0 z-30 bg-stone-900 text-white px-4 py-3 shadow-md max-w-md sm:max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {shopInfo?.shop?.logoUrl ? (
            <img
              src={shopInfo.shop.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover border border-amber-500/60 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 rotate-45" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-sm tracking-tight truncate leading-tight">
              {shopInfo?.shop?.name || 'BarberPro Salon'}
            </h1>
            <p className="text-[10px] text-amber-400 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>{shopInfo?.shop?.city || 'Salon Open'}</span>
            </p>
          </div>
        </div>

        {/* User points chip & sign out */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{pts} pts</span>
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main App Content Viewport */}
      <main className="max-w-md sm:max-w-xl mx-auto p-4 space-y-4">
        {/* ================= TAB 1: HOME / SALON OVERVIEW ================= */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Salon Hero Card */}
            <div className="bg-gradient-to-tr from-stone-900 via-stone-850 to-stone-800 text-white rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full inline-block">
                    ★ Premium Salon
                  </span>
                  <h2 className="text-xl font-extrabold text-white">
                    {shopInfo?.shop?.name || 'BarberPro Lounge'}
                  </h2>
                  <p className="text-xs text-stone-300 leading-relaxed max-w-xs">
                    {shopInfo?.shop?.description || 'Precision haircuts, beard grooming, and luxury styling.'}
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-800 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-lg">
                  {shopInfo?.shop?.logoUrl ? (
                    <img src={shopInfo.shop.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Scissors className="w-6 h-6 text-amber-400 rotate-45" />
                  )}
                </div>
              </div>

              {/* Info chips */}
              <div className="pt-2 border-t border-stone-700/80 grid grid-cols-2 gap-2 text-xs text-stone-300">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {shopInfo?.shop?.openMin ? `${fmt(shopInfo.shop.openMin)} - ${fmt(shopInfo.shop.closeMin)}` : '10 AM - 9 PM'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{shopInfo?.shop?.city || 'Pune'}</span>
                </div>
              </div>

              {/* CTA Quick Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('book')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/30 transition-all active:scale-[0.98]"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>
                {shopInfo?.shop?.mobile && (
                  <a
                    href={`tel:${shopInfo.shop.mobile}`}
                    className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 flex items-center justify-center transition-colors"
                    title="Call Salon"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Stats / Active Appointment Banner */}
            {activeBookingsCount > 0 && (
              <div
                onClick={() => setActiveTab('appointments')}
                className="card border-amber-200 bg-amber-50/70 p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-50 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs">
                      {activeBookingsCount} Upcoming Booking{activeBookingsCount > 1 ? 's' : ''}
                    </h4>
                    <p className="text-[11px] text-amber-800">Tap to track status & details</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </div>
            )}

            {/* Service Showcase */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-sm">Services Menu</h3>
                <button
                  onClick={() => setActiveTab('book')}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  View All & Book →
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {svcs.slice(0, 4).map((s) => (
                  <div
                    key={s._id}
                    className="card p-3.5 flex items-center justify-between gap-3 hover:border-amber-300 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedServices([s]);
                      setActiveTab('book');
                    }}
                  >
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm">{s.name}</h4>
                      <p className="text-[11px] text-stone-500">
                        {s.duration} mins • {s.description || 'Haircut & Styling'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-amber-700 text-sm block">₹{s.price}</span>
                      <span className="text-[10px] text-stone-500 font-semibold bg-stone-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Book
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: BOOKING FLOW ================= */}
        {activeTab === 'book' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Step 1: Multi-Service Selection */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Choose Services</h3>
                    <p className="text-[11px] text-stone-500">Multi-select any combination of services</p>
                  </div>
                </div>
                {selectedServices.length > 0 && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    {selectedServices.length} selected (₹{totalPrice})
                  </span>
                )}
              </div>

              {/* Service Selection Summary Pill Strip */}
              {selectedServices.length > 0 && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Selected Services ({selectedServices.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedServices([])}
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedServices.map((s) => (
                      <span
                        key={s._id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-amber-200 text-stone-800 text-xs font-medium shadow-sm"
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] text-amber-700 font-bold">₹{s.price} ({s.duration}m)</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleService(s);
                          }}
                          className="text-stone-400 hover:text-red-500 ml-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/60 text-xs">
                    <span className="text-amber-900 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>
                        Approx Time: <strong className="text-stone-900">{totalDuration >= 60 ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60 ? `${totalDuration % 60}m` : ''}` : `${totalDuration} mins`}</strong>
                      </span>
                    </span>
                    <span className="text-amber-950 font-extrabold text-sm">
                      Total: ₹{totalPrice}
                    </span>
                  </div>
                </div>
              )}

              {/* Service Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search haircut, trim, beard, spa..."
                  className="inp pl-9 py-2 text-xs"
                  value={searchSvc}
                  onChange={(e) => setSearchSvc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredServices.map((s) => {
                  const isSelected = selectedServices.some((x) => x._id === s._id);
                  return (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${isSelected
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-600/30 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${isSelected
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'border-stone-300 bg-stone-50'
                            }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-stone-900 block leading-tight">
                            {s.name}
                          </span>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            ⏱️ {s.duration} mins • {s.description || 'Professional grooming'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-amber-700 text-sm block">₹{s.price}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${isSelected
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-100 text-stone-500'
                            }`}
                        >
                          {isSelected ? 'Selected' : '+ Add'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Date Picker (Horizontal Day Strip) */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">Choose Date</h3>
                </div>
                <span className="text-xs font-medium text-stone-500">{selectedDate}</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {upcomingDays.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`min-w-[62px] py-2.5 px-2 rounded-2xl border text-center transition-all shrink-0 ${isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/25 font-bold scale-[1.02]'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                        }`}
                    >
                      <span className="text-[10px] uppercase font-bold block opacity-80">{d.dayName}</span>
                      <span className="text-base font-extrabold block my-0.5">{d.dayNumber}</span>
                      <span className="text-[10px] block opacity-80">{d.month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Time Slot Picker Grouped by Time of Day */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">Choose Time Slot</h3>
                </div>
                {selectedSlot && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {fmt(selectedSlot.startMin)} – {fmt(selectedSlot.startMin + totalDuration)} ({totalDuration}m)
                  </span>
                )}
              </div>

              {selectedServices.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400 space-y-1">
                  <Scissors className="w-6 h-6 mx-auto opacity-40" />
                  <p>Please select at least one service above to view available slots</p>
                </div>
              ) : slotsLoading ? (
                <div className="p-6 text-center text-xs text-stone-400">Loading available slots for {totalDuration} min service...</div>
              ) : slots.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl space-y-1">
                  <Clock className="w-6 h-6 text-stone-300 mx-auto" />
                  <p className="font-semibold text-stone-700">No continuous {totalDuration}-minute slots available for this date</p>
                  <p className="text-[11px] text-stone-400">
                    The salon may be fully booked or closed. Try picking another date.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Morning Section */}
                  {morningSlots.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Morning (Before 12 PM)</span>
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {morningSlots.map((s) => {
                          const isPicked = selectedSlot?.startMin === s.startMin;
                          const disabled = isSlotDisabled(s);
                          return (
                            <button
                              key={s.startMin}
                              disabled={disabled}
                              onClick={() => setSelectedSlot(s)}
                              className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${disabled
                                ? 'bg-stone-50 border border-stone-100 text-stone-300 line-through cursor-not-allowed opacity-50'
                                : isPicked
                                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-[1.02] border-amber-600'
                                  : 'bg-white border border-stone-200 text-stone-800 hover:border-amber-400'
                                }`}
                            >
                              {fmt(s.startMin)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Afternoon Section */}
                  {afternoonSlots.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Sunset className="w-3.5 h-3.5 text-amber-600" />
                        <span>Afternoon (12 PM - 5 PM)</span>
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {afternoonSlots.map((s) => {
                          const isPicked = selectedSlot?.startMin === s.startMin;
                          const disabled = isSlotDisabled(s);
                          return (
                            <button
                              key={s.startMin}
                              disabled={disabled}
                              onClick={() => setSelectedSlot(s)}
                              className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${disabled
                                ? 'bg-stone-50 border border-stone-100 text-stone-300 line-through cursor-not-allowed opacity-50'
                                : isPicked
                                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-[1.02] border-amber-600'
                                  : 'bg-white border border-stone-200 text-stone-800 hover:border-amber-400'
                                }`}
                            >
                              {fmt(s.startMin)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Evening Section */}
                  {eveningSlots.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Evening (5 PM Onwards)</span>
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {eveningSlots.map((s) => {
                          const isPicked = selectedSlot?.startMin === s.startMin;
                          const disabled = isSlotDisabled(s);
                          return (
                            <button
                              key={s.startMin}
                              disabled={disabled}
                              onClick={() => setSelectedSlot(s)}
                              className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${disabled
                                ? 'bg-stone-50 border border-stone-100 text-stone-300 line-through cursor-not-allowed opacity-50'
                                : isPicked
                                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-[1.02] border-amber-600'
                                  : 'bg-white border border-stone-200 text-stone-800 hover:border-amber-400'
                                }`}
                            >
                              {fmt(s.startMin)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Booking Summary Card / Proceed Button */}
            {selectedServices.length > 0 && selectedSlot && (
              <div className="card border-amber-300 bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900 block text-sm">
                      {selectedServices.map((s) => s.name).join(' + ')}
                    </span>
                    <span className="text-stone-500">
                      {selectedDate} at {fmt(selectedSlot.startMin)} – {fmt(selectedSlot.startMin + totalDuration)} ({totalDuration} mins approx)
                    </span>
                  </div>
                  <span className="text-lg font-extrabold text-amber-800">₹{totalPrice}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmBookingModal(true)}
                  className="btn-brand w-full py-3 text-sm shadow-lg shadow-amber-600/25"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Review & Confirm Booking</span>
                </button>
              </div>
            )}

            {bookingMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{bookingMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: APPOINTMENTS ================= */}
        {activeTab === 'appointments' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header with Filter Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-base">Your Appointments</h3>
                <span className="text-xs text-stone-500">{bk.length} total</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: `Active (${bk.filter((b) => ['pending', 'confirmed'].includes(b.status)).length})` },
                  { id: 'completed', label: 'Completed' },
                  { id: 'cancelled', label: 'Cancelled' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setApptFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${apptFilter === tab.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="card text-center py-12 text-stone-400 text-xs space-y-2">
                <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="font-semibold text-stone-700 text-sm">No bookings in this category</p>
                <p>Tap "Book" below to schedule a haircut or styling session.</p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="btn-brand text-xs py-2 px-4 mt-2"
                >
                  Book New Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((b) => (
                  <div
                    key={b._id}
                    className="card p-4 space-y-3 shadow-xs hover:border-amber-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                      <div>
                        <span className="font-bold text-stone-900 text-sm sm:text-base block">
                          {b.serviceName}
                        </span>
                        <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                          <Store className="w-3 h-3 text-stone-400" />
                          <span>{shopInfo?.shop?.name || 'Salon'}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-amber-700 text-sm sm:text-base block">
                          ₹{b.price}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-600 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{b.date}</span>
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{fmt(b.startMin)}</span>
                        </span>
                      </div>

                      {['pending', 'confirmed'].includes(b.status) && (
                        <button
                          className="btn-danger text-xs py-1 px-3"
                          onClick={() => setCancelBookingTarget(b)}
                        >
                          Cancel Booking
                        </button>
                      )}

                      {b.status === 'completed' && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Earned +{Math.floor(b.price / 100)} pts</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: PROFILE & REWARDS ================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* VIP Loyalty Rewards Card */}
            {/* <div className={`rounded-3xl p-5 shadow-xl bg-gradient-to-r ${tierColor} space-y-3 relative overflow-hidden`}>
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/20 inline-block">
                    {tier} Member
                  </span>
                  <h3 className="text-2xl font-black tracking-tight">{pts} Points</h3>
                  <p className="text-xs opacity-90">Earn 1 pt for every ₹100 spent at salon</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/15 shrink-0">
                  <Award className="w-8 h-8" />
                </div>
              </div> */}

            {/* Tier Progress Bar */}
            {/* {/* <div className="space-y-1 relative z-10 pt-1">
                <div className="flex justify-between text-[11px] font-semibold opacity-90">
                  <span>{tier} Tier</span>
                  <span>{tier === 'Gold' ? 'Max VIP Status' : `${300 - pts} pts to ${tier === 'Bronze' ? 'Silver' : 'Gold'}`}</span>
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, (pts / 300) * 100))}%` }}
                  />
                </div>
              </div> 
            </div> */}

            {/* Quick Profile Summary Card */}
            <div className="card p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-400 font-extrabold text-lg flex items-center justify-center shrink-0 border border-stone-800">
                {profileData.name ? profileData.name[0].toUpperCase() : 'C'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-stone-900 text-sm truncate">{profileData.name || 'Client'}</h4>
                <p className="text-xs text-stone-500 font-mono truncate">{profileData.mobile}</p>
                {profileData.email && <p className="text-xs text-stone-400 truncate">{profileData.email}</p>}
              </div>
            </div>

            {/* Personal Details Form */}
            <form onSubmit={saveProfile} className="card p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Personal Details</span>
                </h4>
                <span className="text-xs text-stone-400">Edit info</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Full Name *</label>
                  <input
                    className="inp"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Registered Mobile</label>
                  <input
                    className="inp bg-stone-100 text-stone-500 font-mono"
                    readOnly
                    disabled
                    value={profileData.mobile}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Email Address</label>
                  <input
                    className="inp"
                    type="email"
                    placeholder="name@example.com"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Gender</label>
                  <select
                    className="inp"
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  >
                    <option value="unspecified">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-600">Date of Birth</label>
                  <input
                    type="date"
                    className="inp"
                    value={profileData.dob}
                    onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-600">
                    Hair & Grooming Preferences (Notes for Barber)
                  </label>
                  <textarea
                    rows={2}
                    className="inp"
                    placeholder="e.g. Low skin fade, beard lining, sensitive skin, prefers scissors over clippers..."
                    value={profileData.notes}
                    onChange={(e) => setProfileData({ ...profileData, notes: e.target.value })}
                  />
                </div>
              </div>

              {profileMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{profileMsg}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn-brand px-5 py-2.5 text-xs sm:text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>

            {/* Quick Actions & Security */}
            <div className="card p-4 space-y-2">
              <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-500 pb-1">
                Account & Security
              </h4>

              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 text-left text-xs text-stone-800 font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-stone-400" />
                  <span>Update Password</span>
                </span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {shopInfo?.shop?.mobile && (
                <a
                  href={`tel:${shopInfo.shop.mobile}`}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 text-left text-xs text-stone-800 font-medium transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-400" />
                    <span>Call Salon Contact</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-red-50 text-left text-xs text-red-600 font-medium transition-colors border-t border-stone-100 pt-2"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </span>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ================= NATIVE MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 text-stone-500 max-w-md sm:max-w-xl mx-auto flex items-center justify-around py-2 px-2 shadow-2xl">
        {[
          { id: 'home', label: 'Salon', icon: Store },
          { id: 'book', label: 'Book', icon: Scissors },
          { id: 'appointments', label: 'Bookings', icon: Calendar, badge: activeBookingsCount },
          { id: 'profile', label: 'Profile', icon: User }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative transition-all ${isActive ? 'text-amber-600 font-bold scale-[1.05]' : 'hover:text-stone-900'
                }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 bg-amber-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ================= CONFIRMATION MODALS ================= */}

      {/* 1. Review & Confirm Booking Modal */}
      <ConfirmModal
        isOpen={showConfirmBookingModal}
        type="info"
        title="Review & Confirm Booking"
        message=""
        confirmText="Confirm & Request Appointment"
        cancelText="Change Time"
        confirmButtonClass="btn-brand"
        onConfirm={confirmAndBook}
        onClose={() => setShowConfirmBookingModal(false)}
      >
        {selectedServices.length > 0 && selectedSlot && (
          <div className="space-y-3 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
                <span className="text-stone-500">Salon</span>
                <span className="font-bold text-stone-900">{shopInfo?.shop?.name || 'Salon'}</span>
              </div>

              {/* Multi-service breakdown */}
              <div className="space-y-1 py-1 border-b border-stone-200">
                <span className="text-stone-500 font-semibold block text-[11px]">Selected Services ({selectedServices.length})</span>
                {selectedServices.map((s) => (
                  <div key={s._id} className="flex justify-between items-center pl-1 text-[11px]">
                    <span className="text-stone-800 font-medium">• {s.name} <span className="text-stone-400">({s.duration}m)</span></span>
                    <span className="text-stone-900 font-bold">₹{s.price}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500">Date & Time</span>
                <span className="font-bold text-amber-700">
                  {selectedDate} at {fmt(selectedSlot.startMin)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Approx. Duration</span>
                <span className="text-stone-700 font-bold">
                  {totalDuration} mins ({fmt(selectedSlot.startMin)} – {fmt(selectedSlot.startMin + totalDuration)})
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-stone-200 text-sm">
                <span className="font-bold text-stone-900">Total Amount</span>
                <span className="font-extrabold text-amber-800 text-base">₹{totalPrice}</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 text-center">
              Pay upon completion with Cash, UPI, or Card at the salon.
            </p>
          </div>
        )}
      </ConfirmModal>

      {/* 2. Cancel Booking Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(cancelBookingTarget)}
        type="danger"
        title="Cancel Appointment"
        message={
          cancelBookingTarget
            ? `Are you sure you want to cancel your ${cancelBookingTarget.serviceName} booking on ${cancelBookingTarget.date
            } at ${fmt(cancelBookingTarget.startMin)}?`
            : ''
        }
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={executeCancel}
        onClose={() => setCancelBookingTarget(null)}
      />

      {/* 3. Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        type="warning"
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out from your BarberPro client account?"
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={() => {
          clearSession();
          location.href = '/login';
        }}
        onClose={() => setShowLogoutModal(false)}
      />

      {/* 4. Update Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handlePasswordChange}
            className="card max-w-sm w-full space-y-4 shadow-float border border-stone-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Change Password</span>
              </h3>
              <button
                type="button"
                onClick={() => { setShowPasswordModal(false); setPwError(''); setPwForm({ newPassword: '', confirm: '' }); }}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                className="inp"
                placeholder="••••••••"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="inp"
                placeholder="••••••••"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              />
            </div>

            {pwError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                className="btn-o"
                onClick={() => { setShowPasswordModal(false); setPwError(''); setPwForm({ newPassword: '', confirm: '' }); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-brand">
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
