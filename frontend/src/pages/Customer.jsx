import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { saveSession, clearSession } from '../api';
import { fmt } from '../components/Shell';
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
  Edit3
} from 'lucide-react';

const msgOf = (e) => e.response?.data?.message || e.message;

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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto animate-pulse">
            <Scissors className="w-6 h-6 rotate-45" />
          </div>
          <p className="text-sm font-medium text-stone-600">Loading store details...</p>
        </div>
      </div>
    );
  }

  if (err && !info) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="card max-w-sm w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-stone-900">Shop Not Found</h2>
          <p className="text-xs text-stone-500">{err}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/80 p-4 sm:p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-4">
        {/* Shop Info Card with Custom Logo & Hours */}
        <div className="card border-amber-200/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white p-6 space-y-4 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                Verified Barber
              </span>
              <h1 className="text-2xl font-extrabold text-stone-900 mt-1">{info.shop.name}</h1>
              {info.shop.description && (
                <p className="text-xs text-stone-600 mt-0.5 leading-snug">{info.shop.description}</p>
              )}
              <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>
                  {info.shop.address ? `${info.shop.address}, ` : ''}
                  {info.shop.city || 'City'}
                </span>
              </p>
              <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                <span>
                  Hours: {fmt(info.shop.openMin)} – {fmt(info.shop.closeMin)}
                </span>
              </p>
            </div>

            {/* Custom Logo or Default Icon */}
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
          <div className="pt-3 border-t border-stone-200/80 space-y-2">
            <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Popular Services
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {info.services.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-stone-50/80"
                >
                  <div>
                    <span className="font-semibold text-stone-800 block">{s.name}</span>
                    <span className="text-[10px] text-stone-400">{s.duration} mins</span>
                  </div>
                  <span className="font-bold text-amber-700">₹{s.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Auth Card */}
        <form onSubmit={go} className="card p-6 space-y-4 shadow-md">
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
            {mode === 'register' ? 'Already have an account? Sign in' : 'New to this barber? Register here'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Customer() {
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'appointments' | 'profile'
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [svcs, setSvcs] = useState([]);
  const [bk, setBk] = useState([]);
  const [f, setF] = useState({
    date: new Date().toISOString().slice(0, 10),
    serviceId: ''
  });
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState('');
  const [code, setCode] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

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

  const loadBookings = () => api.get('/customer/bookings').then((r) => setBk(r.data));

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
      api.get('/customer/public/shop/' + c).then((r) => setSvcs(r.data.services || []));
    }
  }, []);

  useEffect(() => {
    if (code && f.serviceId) {
      api
        .get('/customer/public/slots', { params: { code, serviceId: f.serviceId, date: f.date } })
        .then((r) => setSlots(r.data))
        .catch(() => setSlots([]));
    } else {
      setSlots([]);
    }
  }, [f.serviceId, f.date, code]);

  const book = async (s) => {
    setBookingLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/customer/bookings', {
        serviceId: f.serviceId,
        date: f.date,
        startMin: s.startMin
      });
      setMsg(data.message || 'Appointment requested successfully!');
      loadBookings();
      setSlots([]);
    } catch (e) {
      setMsg(msgOf(e));
    } finally {
      setBookingLoading(false);
    }
  };

  const cancel = async (id) => {
    if (confirm('Cancel this booking?')) {
      await api.patch(`/customer/bookings/${id}/cancel`);
      loadBookings();
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const { data } = await api.patch('/customer/profile', {
        name: profileData.name,
        email: profileData.email,
        dob: profileData.dob || undefined,
        gender: profileData.gender,
        notes: profileData.notes
      });
      setProfileMsg('Profile saved successfully!');
      // Update local storage session
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

  return (
    <div className="min-h-screen bg-stone-50/70 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
            <Scissors className="w-4 h-4 rotate-45" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-stone-900 leading-none">
              Barber<span className="text-amber-600">Pro</span>
            </h1>
            <p className="text-[11px] text-stone-500 mt-0.5">Hello, {user?.name || 'Client'}</p>
          </div>
        </div>

        <button
          onClick={() => {
            clearSession();
            location.href = '/login';
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 py-1.5 px-3 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-stone-200/70 rounded-2xl max-w-fit mx-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'book'
                ? 'bg-white text-stone-900 shadow-sm font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-amber-600" />
            <span>Book Now</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'appointments'
                ? 'bg-white text-stone-900 shadow-sm font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>My Bookings ({bk.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-stone-900 shadow-sm font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-4 h-4 text-amber-600" />
            <span>My Profile</span>
          </button>
        </div>

        {/* Tab 1: Book Appointment Flow */}
        {activeTab === 'book' && (
          <div className="card space-y-4 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Schedule an Appointment</h2>
                <p className="text-xs text-stone-500">Select service, preferred date, and time</p>
              </div>
            </div>

            {/* Service Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-600">1. Select Service</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {svcs.map((s) => {
                  const isSelected = f.serviceId === s._id;
                  return (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => setF({ ...f, serviceId: s._id })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-1 ring-amber-600'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-xs sm:text-sm text-stone-900">{s.name}</span>
                        <span className="font-bold text-xs sm:text-sm text-amber-700">₹{s.price}</span>
                      </div>
                      <span className="text-[11px] text-stone-500 block mt-1">
                        {s.duration} mins • {s.description || 'Haircut & Grooming'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-600">2. Select Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  className="inp pl-10"
                  value={f.date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setF({ ...f, date: e.target.value })}
                />
              </div>
            </div>

            {/* Time Slots */}
            {f.serviceId && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-stone-600 flex items-center justify-between">
                  <span>3. Choose Time Slot</span>
                  <span className="text-[11px] text-stone-400 font-normal">
                    {slots.filter((s) => s.available).length} slots available
                  </span>
                </label>

                {slots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-stone-50 text-center text-xs text-stone-500">
                    Checking available slots for this date...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.startMin}
                        disabled={!s.available || bookingLoading}
                        onClick={() => book(s)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          s.available
                            ? 'border-stone-200 bg-white hover:bg-amber-600 hover:text-white hover:border-amber-600 shadow-sm'
                            : 'border-stone-100 bg-stone-50 text-stone-400 opacity-40 cursor-not-allowed line-through'
                        }`}
                      >
                        {fmt(s.startMin)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {msg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{msg}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Appointments History */}
        {activeTab === 'appointments' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">Appointment History</h2>
              <span className="text-xs text-stone-500">{bk.length} total</span>
            </div>

            {bk.length === 0 ? (
              <div className="card text-center py-12 text-stone-400 text-xs space-y-2">
                <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="font-semibold text-stone-700">No appointments found</p>
                <p>Click "Book Now" to schedule your first haircut or styling session.</p>
              </div>
            ) : (
              bk.map((b) => (
                <div
                  key={b._id}
                  className="card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm">{b.serviceName}</span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        ₹{b.price}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>{b.date}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{fmt(b.startMin)}</span>
                      </span>
                    </div>
                  </div>

                  {['pending', 'confirmed'].includes(b.status) && (
                    <button
                      className="btn-danger text-xs py-1.5 px-3 self-end sm:self-center"
                      onClick={() => cancel(b._id)}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Customer Profile & Loyalty */}
        {activeTab === 'profile' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Loyalty Points Banner */}
            <div className="card border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Rewards Program
                  </span>
                  <h3 className="font-extrabold text-stone-900 text-lg mt-0.5">
                    {profileData.loyaltyPoints} Loyalty Points
                  </h3>
                  <p className="text-xs text-stone-500">Earn points on every completed visit</p>
                </div>
              </div>
              <Sparkles className="w-8 h-8 text-amber-500/40 shrink-0 hidden sm:block" />
            </div>

            {/* Profile Edit Form */}
            <form onSubmit={saveProfile} className="card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-stone-900 text-base">Personal Details</h3>
                </div>
                <span className="text-xs text-stone-400 font-mono">{profileData.mobile}</span>
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
                  <label className="text-xs font-semibold text-stone-600">Mobile (Login Number)</label>
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

                <div className="space-y-1">
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
                    Grooming Preferences / Hair Notes
                  </label>
                  <textarea
                    rows={2}
                    className="inp"
                    placeholder="e.g. Sensitive skin, low fade, beard trim with clippers only..."
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

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn-brand px-5 py-2.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
