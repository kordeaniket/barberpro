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
  ArrowRight
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
        {/* Shop Info Card */}
        <div className="card border-amber-200/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white p-6 space-y-4 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                Verified Salon
              </span>
              <h1 className="text-2xl font-extrabold text-stone-900 mt-1">{info.shop.name}</h1>
              <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>
                  {info.shop.address ? `${info.shop.address}, ` : ''}
                  {info.shop.city}
                </span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 shrink-0">
              <Scissors className="w-6 h-6 rotate-45" />
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
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-50/80"
                >
                  <span className="font-medium text-stone-800">{s.name}</span>
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
  const user = JSON.parse(localStorage.getItem('user'));
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

  const load = () => api.get('/customer/bookings').then((r) => setBk(r.data));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const c = localStorage.getItem('shopCode');
    if (c) {
      setCode(c);
      api.get('/customer/public/shop/' + c).then((r) => setSvcs(r.data.services));
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
      load();
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
      load();
    }
  };

  const selectedService = svcs.find((s) => s._id === f.serviceId);

  return (
    <div className="min-h-screen bg-stone-50/70 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
            <Scissors className="w-4 h-4 rotate-45" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-stone-900 leading-none">
              Barber<span className="text-amber-600">Pro</span>
            </h1>
            <p className="text-[11px] text-stone-500 mt-0.5">Welcome, {user?.name}</p>
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
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Book Appointment Card */}
        <div className="card space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Book an Appointment</h2>
              <p className="text-xs text-stone-500">Pick a service and your preferred slot</p>
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
                      {s.duration} mins • {s.description || 'Haircut & Styling'}
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
                  Checking available slots...
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

        {/* My Bookings History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">My Appointments</h2>
            <span className="text-xs text-stone-500">{bk.length} total</span>
          </div>

          {bk.length === 0 ? (
            <div className="card text-center py-8 text-stone-400 text-xs space-y-1">
              <Calendar className="w-8 h-8 text-stone-300 mx-auto" />
              <p>You have no past or upcoming bookings yet.</p>
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
      </main>
    </div>
  );
}
