import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
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
  CalendarDays,
  History,
  Timer,
  ArrowUpRight,
  Bell,
  BellRing,
  Trash2,
  CheckCheck,
  ChevronLeft,
  XCircle,
  RefreshCw,
  LogOutIcon
} from 'lucide-react';

function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch { }
}

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
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        {/* Single Unified Modal with Shop Details and Register/Login */}
        <div className="bg-[#181924] border border-stone-800/90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Shop Header Section */}
          <div className="p-6 bg-gradient-to-b from-stone-800/70 to-transparent border-b border-stone-800/80">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block">
                  Verified Salon
                </span>
                <h1 className="text-2xl font-extrabold text-white mt-1.5 truncate">{info.shop.name}</h1>
                {info.shop.description && (
                  <p className="text-xs text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">{info.shop.description}</p>
                )}
                <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {info.shop.address ? `${info.shop.address}, ` : ''}
                    {info.shop.city || 'City'}
                  </span>
                </p>
                <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>
                    Hours: {fmt(info.shop.openMin)} – {fmt(info.shop.closeMin)}
                  </span>
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-lg shadow-amber-600/30 overflow-hidden shrink-0 border border-amber-400/30">
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
          </div>

          {/* Customer Auth Form Inside Same Modal */}
          <form onSubmit={go} className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-base font-bold text-white">
                  {mode === 'register' ? 'Register to Book' : 'Client Login'}
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {mode === 'register'
                    ? 'Enter your details to schedule your appointment'
                    : 'Sign in to access your bookings'}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {mode === 'register' ? 'New Client' : 'Welcome back'}
              </span>
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300">Full Name *</label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-700 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  placeholder="e.g. Rahul Sharma"
                  required
                  value={f.name || ''}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">Mobile Number *</label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-700 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                placeholder="e.g. 9876543210"
                required
                value={f.mobile || ''}
                onChange={(e) => setF({ ...f, mobile: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">Password *</label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-700 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                type="password"
                placeholder="••••••••"
                required
                value={f.password || ''}
                onChange={(e) => setF({ ...f, password: e.target.value })}
              />
            </div>

            {err && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full py-3 shadow-lg shadow-amber-600/20"
            >
              <span>{loading ? 'Processing...' : mode === 'register' ? 'Register & Continue' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="w-full text-center text-xs text-stone-400 hover:text-amber-400 transition pt-1"
              onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
            >
              {mode === 'register' ? 'Already registered? Sign in' : 'New client? Register here'}
            </button>
          </form>
        </div>
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
    notes: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Customer Notifications State
  const [customerNotifs, setCustomerNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('customer_notifications') || '[]');
    } catch {
      return [];
    }
  });
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [customerNotifTab, setCustomerNotifTab] = useState('unread'); // 'unread' | 'all'
  const [toastNotif, setToastNotif] = useState(null);

  const loadBookings = () => api.get('/customer/bookings').then((r) => setBk(r.data || []));

  const loadNotifications = () => {
    api
      .get('/customer/notifications')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCustomerNotifs((prev) => {
            const readMap = new Map(prev.map((n) => [n.id, n.read]));
            const merged = res.data.map((n) => ({
              ...n,
              read: readMap.has(n.id) ? readMap.get(n.id) : false
            }));
            localStorage.setItem('customer_notifications', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => { });
  };

  const markNotifRead = (id) => {
    setCustomerNotifs((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('customer_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllNotifsAsRead = () => {
    setCustomerNotifs((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('customer_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllNotifs = () => {
    setCustomerNotifs([]);
    localStorage.removeItem('customer_notifications');
  };

  const unreadCount = customerNotifs.filter((n) => !n.read).length;

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
        notes: c.notes || ''
      });
      setUser((prev) => ({ ...prev, name: u.name || c.name }));
    });
  };

  const knownStatusMap = useRef(new Map());
  const knownCustomerNotifIds = useRef(new Set());
  const isCustSyncInit = useRef(false);

  // Real-time synchronization for Customer appointments and live notifications
  const syncCustomerData = async (isInitial = false) => {
    try {
      // 1. Sync Bookings list (for real-time appointment status changes & countdown updates)
      const bkRes = await api.get('/customer/bookings', { skipGlobalLoader: true });
      if (Array.isArray(bkRes.data)) {
        const currentList = bkRes.data;

        if (isInitial || !isCustSyncInit.current) {
          currentList.forEach((b) => knownStatusMap.current.set(b._id, b.status));
          setBk(currentList);
        } else {
          let hasChange = false;
          let changedAppt = null;

          for (const b of currentList) {
            const prev = knownStatusMap.current.get(b._id);
            if (prev && prev !== b.status) {
              hasChange = true;
              changedAppt = b;
              knownStatusMap.current.set(b._id, b.status);
              break;
            } else if (!prev) {
              knownStatusMap.current.set(b._id, b.status);
              hasChange = true;
            }
          }

          if (hasChange) {
            setBk(currentList);
            if (changedAppt) {
              playNotificationChime();
              let notifTitle = 'Booking Status Updated';
              if (changedAppt.status === 'confirmed') notifTitle = '🎉 Booking Confirmed!';
              else if (changedAppt.status === 'in_progress') notifTitle = '✂️ Service In Progress';
              else if (changedAppt.status === 'completed') notifTitle = '✅ Service Completed!';
              else if (['cancelled', 'rejected', 'no_show'].includes(changedAppt.status)) notifTitle = '⚠️ Appointment Cancelled';

              setToastNotif({
                title: notifTitle,
                message: `Your booking for ${changedAppt.serviceName} is now ${changedAppt.status.replace('_', ' ')}!`,
                type: changedAppt.status,
                serviceName: changedAppt.serviceName,
                date: changedAppt.date,
                time: fmt(changedAppt.startMin),
                price: changedAppt.price
              });
              setTimeout(() => setToastNotif(null), 6500);
            }
          }
        }
      }

      // 2. Sync Notifications list
      const notifRes = await api.get('/customer/notifications', { skipGlobalLoader: true });
      if (Array.isArray(notifRes.data)) {
        const incoming = notifRes.data;

        if (isInitial || !isCustSyncInit.current) {
          incoming.forEach((n) => knownCustomerNotifIds.current.add(n.id));
          setCustomerNotifs((prev) => {
            const readMap = new Map(prev.map((n) => [n.id, n.read]));
            const merged = incoming.map((n) => ({
              ...n,
              read: readMap.has(n.id) ? readMap.get(n.id) : false
            }));
            localStorage.setItem('customer_notifications', JSON.stringify(merged));
            return merged;
          });
          isCustSyncInit.current = true;
        } else {
          const newNotifs = incoming.filter((n) => !knownCustomerNotifIds.current.has(n.id));
          if (newNotifs.length > 0) {
            newNotifs.forEach((n) => knownCustomerNotifIds.current.add(n.id));
            playNotificationChime();

            const latest = newNotifs[0];
            setToastNotif(latest);
            setTimeout(() => setToastNotif(null), 6500);

            setCustomerNotifs((prev) => {
              const readMap = new Map(prev.map((n) => [n.id, n.read]));
              const merged = incoming.map((n) => ({
                ...n,
                read: readMap.has(n.id) ? readMap.get(n.id) : false
              }));
              localStorage.setItem('customer_notifications', JSON.stringify(merged));
              return merged;
            });
          }
        }
      }
    } catch {
      // Background silent catch
    }
  };

  useEffect(() => {
    loadProfile();
    syncCustomerData(true);

    // Active real-time background sync interval (every 3.5 seconds)
    const pollInterval = setInterval(() => {
      syncCustomerData(false);
    }, 3500);

    // Immediate sync when tab or window is refocused
    const handleFocus = () => {
      if (!document.hidden) {
        syncCustomerData(false);
      }
    };
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // Also support Socket.IO if connected
    const token = localStorage.getItem('token');
    let socket;
    if (token) {
      try {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined;
        socket = socketUrl ? io(socketUrl, { auth: { token } }) : io({ auth: { token } });

        socket.on('booking:updated', (data) => {
          playNotificationChime();
          syncCustomerData(false);
          setToastNotif(data);
          setTimeout(() => setToastNotif(null), 6000);
        });

        socket.on('appointment:reminder', (data) => {
          playNotificationChime();
          syncCustomerData(false);
          setToastNotif(data);
          setTimeout(() => setToastNotif(null), 6000);
        });
      } catch {
        // Socket.IO optional
      }
    }

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      if (socket) socket.close();
    };
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

  // Appointments Pagination
  const [apptPage, setApptPage] = useState(1);
  const apptPerPage = 5;

  // Reset pagination on filter change
  useEffect(() => {
    setApptPage(1);
  }, [apptFilter]);

  // Appointment list sorted (latest entry on top) & filtered
  const filteredAppointments = [...bk]
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      const dateCmp = (b.date || '').localeCompare(a.date || '');
      if (dateCmp !== 0) return -dateCmp;
      return (b.startMin || 0) - (a.startMin || 0);
    })
    .filter((b) => {
      if (apptFilter === 'all') return true;
      if (apptFilter === 'active') return ['pending', 'confirmed', 'in_progress'].includes(b.status);
      if (apptFilter === 'completed') return b.status === 'completed';
      if (apptFilter === 'cancelled') return ['cancelled', 'rejected', 'no_show'].includes(b.status);
      return true;
    });

  const totalApptPages = Math.ceil(filteredAppointments.length / apptPerPage) || 1;
  const paginatedAppointments = filteredAppointments.slice((apptPage - 1) * apptPerPage, apptPage * apptPerPage);

  // Disable past slots if selected date is today
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === todayStr;
  const nowMinutes = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  const isSlotDisabled = (s) => !s.available || (isToday && s.startMin < nowMinutes);

  // Today's scheduled bookings & current / next upcoming booking
  const todayBookings = bk.filter(
    (b) => b.date === todayStr && ['pending', 'confirmed', 'in_progress'].includes(b.status)
  ).sort((a, b) => a.startMin - b.startMin);

  const currentOrNextToday = todayBookings.find(
    (b) => (b.endMin || b.startMin + (b.duration || 30)) > nowMinutes
  ) || todayBookings[0];

  // Timing Left helper for today's appointment
  const getTimingLeft = (booking) => {
    if (!booking) return null;
    const start = booking.startMin;
    const end = booking.endMin || (start + (booking.duration || 30));

    if (nowMinutes < start) {
      const diff = start - nowMinutes;
      if (diff >= 60) {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return {
          badge: 'Starts Soon',
          text: `${h}h ${m > 0 ? `${m}m` : ''} left`,
          detail: `Appointment in ${h} hr${h > 1 ? 's' : ''} ${m > 0 ? `${m} min` : ''}`,
          isNow: false,
          color: 'text-amber-400 bg-amber-500/20 border-amber-500/30'
        };
      } else {
        return {
          badge: 'Starting Soon',
          text: `${diff}m left`,
          detail: `Your slot starts in ${diff} minutes`,
          isNow: false,
          color: 'text-orange-400 bg-orange-500/20 border-orange-500/30'
        };
      }
    } else if (nowMinutes >= start && nowMinutes < end) {
      const rem = end - nowMinutes;
      return {
        badge: 'In Progress',
        text: 'Happening Now',
        detail: `Service is ongoing (~${rem}m remaining)`,
        isNow: true,
        color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
      };
    } else {
      return {
        badge: 'Today',
        text: 'Time Passed',
        detail: `Scheduled for ${fmt(start)} earlier today`,
        isNow: false,
        color: 'text-stone-400 bg-stone-800 border-stone-700'
      };
    }
  };

  // Customer Previous History (past / completed bookings)
  const pastBookings = bk.filter(
    (b) =>
      ['completed', 'cancelled', 'rejected', 'no_show'].includes(b.status) ||
      b.date < todayStr ||
      (b.date === todayStr && (b.endMin || b.startMin + (b.duration || 30)) <= nowMinutes && b.status === 'completed')
  ).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.startMin || 0) - (a.startMin || 0));

  // Quick rebook handler
  const handleRebook = (pastBooking) => {
    const match = svcs.find((s) => s._id === pastBooking.serviceId || s.name === pastBooking.serviceName);
    if (match) {
      setSelectedServices([match]);
    }
    setActiveTab('book');
  };

  // Slot groups by time of day
  const morningSlots = slots.filter((s) => s.startMin < 720); // before 12 PM
  const afternoonSlots = slots.filter((s) => s.startMin >= 720 && s.startMin < 1020); // 12 PM - 5 PM
  const eveningSlots = slots.filter((s) => s.startMin >= 1020); // 5 PM onwards

  const activeBookingsCount = bk.filter((b) => ['pending', 'confirmed'].includes(b.status)).length;

  // ⏰ 1-Hour Service Reminder Calculation
  const oneHourReminder = (() => {
    if (!bk.length) return null;
    const today = new Date().toISOString().slice(0, 10);
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

    const upcomingSoon = bk.find((b) => {
      if (b.date !== today) return false;
      if (!['pending', 'confirmed'].includes(b.status)) return false;
      const diff = b.startMin - nowMin;
      return diff > 0 && diff <= 60;
    });

    if (!upcomingSoon) return null;
    const diff = upcomingSoon.startMin - nowMin;
    return {
      booking: upcomingSoon,
      minutesLeft: diff,
      text: diff === 1 ? '1 min' : `${diff} mins`,
      formattedTime: fmt(upcomingSoon.startMin)
    };
  })();

  // Sync 1-hour reminder into notifications list
  useEffect(() => {
    if (oneHourReminder) {
      const reminderId = `reminder-1h-${oneHourReminder.booking._id}`;
      setCustomerNotifs((prev) => {
        if (prev.some((n) => n.id === reminderId)) return prev;
        const newReminder = {
          id: reminderId,
          appointmentId: oneHourReminder.booking._id,
          title: '⏰ 1-Hour Service Reminder',
          message: `Your appointment for ${oneHourReminder.booking.serviceName} starts in ${oneHourReminder.text} (${oneHourReminder.formattedTime})! Please arrive on time.`,
          serviceName: oneHourReminder.booking.serviceName,
          date: oneHourReminder.booking.date,
          time: oneHourReminder.formattedTime,
          type: 'reminder',
          isUrgent: true,
          read: false,
          timestamp: new Date().toISOString()
        };
        const updated = [newReminder, ...prev];
        localStorage.setItem('customer_notifications', JSON.stringify(updated));
        return updated;
      });
    }
  }, [oneHourReminder?.booking?._id, oneHourReminder?.minutesLeft]);

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#0a0b0e] text-stone-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 flex justify-center items-center sm:p-4 overflow-hidden">
      {/* Smartphone Frame Container */}
      <div className="w-full max-w-md sm:max-w-lg bg-[#121318] border-x sm:border border-stone-800/90 sm:rounded-[38px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] h-full sm:h-[94vh] sm:max-h-[900px] flex flex-col relative overflow-hidden min-h-0">

        {/* Decorative Phone Speaker Notch on Desktop (Fixed top) */}
        <div className="hidden sm:flex items-center justify-center pt-2 pb-1 bg-[#121318] border-b border-stone-800/40 shrink-0">
          <div className="w-24 h-4 bg-stone-900/90 rounded-full flex items-center justify-center gap-1.5 border border-stone-800/80">
            <div className="w-2 h-2 rounded-full bg-stone-950 border border-stone-800" />
            <div className="w-9 h-1 bg-stone-800 rounded-full" />
          </div>
        </div>

        {/* 1. FIXED HEADER */}
        <header className="shrink-0 z-30 bg-[#16171f]/98 backdrop-blur-md text-white px-4 py-3 shadow-md border-b border-stone-800/80 flex items-center justify-between">
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
              <h1 className="font-bold text-sm tracking-tight truncate leading-tight text-white">
                {shopInfo?.shop?.name || 'BarberPro Salon'}
              </h1>
              <p className="text-[10px] text-amber-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span>{shopInfo?.shop?.city || 'Salon Open'}</span>
              </p>
            </div>
          </div>

          {/* User actions: Notification Bell & Sign out */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNotifDrawer(true)}
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800/80 transition-all relative"
              title="Notifications & Reminders"
            >
              {unreadCount > 0 ? (
                <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {unreadCount > 0 && (
                <span className="absolute 0 top-1 right-1 bg-amber-500 text-stone-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button> */}
          </div>
        </header>

        {/* 2. SCROLLABLE MIDDLE VIEWPORT */}
        <main className="w-full p-4 space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain pb-6">
          {/* ⏰ 1-HOUR APPOINTMENT REMINDER BANNER */}
          {oneHourReminder && (
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/40 rounded-2xl p-3.5 shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Timer className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      Starts in {oneHourReminder.text}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm truncate mt-0.5">
                    {oneHourReminder.booking.serviceName}
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Scheduled today at {oneHourReminder.formattedTime} • Please arrive on time
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('appointments')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shrink-0 transition-colors shadow-sm"
              >
                View
              </button>
            </div>
          )}
          {/* ================= TAB 1: HOME / SALON OVERVIEW ================= */}
          {activeTab === 'home' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Salon Hero Card */}
              <div className="bg-gradient-to-tr from-stone-900 via-[#1a1b24] to-[#14151c] text-white rounded-3xl p-5 shadow-xl border border-stone-800/90 space-y-4 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="space-y-1">

                    <h2 className="text-xl font-extrabold text-white">
                      {shopInfo?.shop?.name || 'BarberPro Lounge'}
                    </h2>
                    <p className="text-xs text-stone-300 leading-relaxed max-w-xs">
                      {shopInfo?.shop?.description || 'Precision haircuts, beard grooming, and luxury styling.'}
                    </p>
                  </div>

                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-800/80 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-lg">
                    {shopInfo?.shop?.logoUrl ? (
                      <img src={shopInfo.shop.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Scissors className="w-6 h-6 text-amber-400 rotate-45" />
                    )}
                  </div>
                </div>

                {/* Info chips */}
                <div className="pt-2 border-t border-stone-800 grid grid-cols-2 gap-2 text-xs text-stone-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px]">
                      {shopInfo?.shop?.openMin ? `${fmt(shopInfo.shop.openMin)} - ${fmt(shopInfo.shop.closeMin)}` : '10 AM - 9 PM'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate text-[11px]">{shopInfo?.shop?.city || 'Pune'}</span>
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
                      className="p-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-amber-400 border border-stone-700 flex items-center justify-center transition-colors"
                      title="Call Salon"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* ⚡ TODAY'S SCHEDULED BOOKING WITH TIMING LEFT */}
              {currentOrNextToday && (() => {
                const timing = getTimingLeft(currentOrNextToday);
                return (
                  <div className="bg-gradient-to-br from-amber-950/40 via-[#1a1b24] to-[#14151c] border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden animate-in fade-in">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Top Badge row */}
                    <div className="flex items-center justify-between gap-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          Today's Appointment
                        </span>
                      </div>
                      {timing && (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-sm ${timing.color}`}>
                          <Timer className="w-3 h-3" />
                          <span>{timing.text}</span>
                        </span>
                      )}
                    </div>

                    {/* Service & Time details */}
                    <div className="flex items-start justify-between gap-3 relative z-10 pt-1">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-extrabold text-white text-sm sm:text-base leading-tight truncate">
                          {currentOrNextToday.serviceName}
                        </h3>
                        <p className="text-xs text-amber-300/90 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            {fmt(currentOrNextToday.startMin)} – {fmt(currentOrNextToday.endMin || currentOrNextToday.startMin + (currentOrNextToday.duration || 30))}
                          </span>
                        </p>
                        {timing?.detail && (
                          <p className="text-[11px] text-stone-400">
                            ⏳ {timing.detail}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-extrabold text-amber-400 block">
                          ₹{currentOrNextToday.price}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {currentOrNextToday.status === 'in_progress' ? 'In Progress' : 'Confirmed'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="pt-2 border-t border-stone-800/80 flex items-center gap-2 relative z-10">
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30 transition-all active:scale-[0.98]"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Track Booking</span>
                      </button>
                      {shopInfo?.shop?.mobile && (
                        <a
                          href={`tel:${shopInfo.shop.mobile}`}
                          className="py-2 px-3 rounded-xl bg-[#22242f] hover:bg-[#2b2d3b] text-amber-300 border border-stone-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Active Upcoming Booking Banner (if not today) */}
              {!currentOrNextToday && activeBookingsCount > 0 && (
                <div
                  onClick={() => setActiveTab('appointments')}
                  className="bg-[#1a1b24] border border-amber-500/30 hover:border-amber-500/50 p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-100 text-xs group-hover:text-amber-300 transition-colors">
                        {activeBookingsCount} Upcoming Booking{activeBookingsCount > 1 ? 's' : ''}
                      </h4>
                      <p className="text-[11px] text-amber-400/80">Tap to track schedule & status</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              )}

              {/* ✨ REDESIGNED SERVICES MENU UI */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-100 text-sm flex items-center gap-1.5">
                      <Scissors className="w-4 h-4 text-amber-500" />
                      <span>Services Menu</span>
                    </h3>
                    <p className="text-[10px] text-stone-400">Professional haircuts & styling</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {svcs.slice(0, 5).map((s) => (
                    <div
                      key={s._id}
                      onClick={() => {
                        setSelectedServices([s]);
                        setActiveTab('book');
                      }}
                      className="bg-[#191a22] border border-stone-800 hover:border-amber-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-xs hover:bg-[#1f202a]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500/25 transition-all">
                          <Scissors className="w-4 h-4 rotate-45" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-stone-100 text-xs sm:text-sm truncate group-hover:text-amber-300 transition-colors">
                            {s.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-500" />
                              {s.duration} mins
                            </span>
                            {s.description && (
                              <span className="text-[10px] text-stone-500 truncate hidden xs:inline max-w-[130px]">
                                • {s.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-extrabold text-amber-400 text-xs sm:text-sm">
                          ₹{s.price}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-xl bg-amber-600/90 group-hover:bg-amber-500 text-white font-semibold text-[10px] shadow-sm flex items-center gap-1 transition-colors"
                        >
                          <span>Book</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 📜 CUSTOMER PREVIOUS HISTORY SECTION */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-100 text-sm flex items-center gap-1.5">
                    <History className="w-4 h-4 text-amber-500" />
                    <span>Previous History</span>
                  </h3>
                  {pastBookings.length > 0 && (
                    <button
                      onClick={() => {
                        setApptFilter('all');
                        setActiveTab('appointments');
                      }}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                    >
                      <span>All History ({pastBookings.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {pastBookings.length === 0 ? (
                  <div className="bg-[#191a22] border border-stone-800/80 rounded-2xl p-4 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-stone-800/80 text-stone-500 flex items-center justify-center mx-auto">
                      <History className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-stone-300">No previous visits yet</p>
                    <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                      Your completed appointments and salon receipts will be saved here.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('book')}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 pt-1 inline-block"
                    >
                      Book Your First Session →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pastBookings.slice(0, 3).map((b) => (
                      <div
                        key={b._id}
                        className="bg-[#191a22] border border-stone-800 hover:border-stone-700 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-200 text-xs truncate">
                              {b.serviceName}
                            </h4>
                            <StatusBadge status={b.status} />
                          </div>
                          <div className="flex items-center gap-2.5 text-[10px] text-stone-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-stone-500" />
                              {b.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-500" />
                              {fmt(b.startMin)}
                            </span>
                            <span className="font-bold text-stone-300">₹{b.price}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRebook(b)}
                          className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-300 border border-stone-700/80 text-[10px] font-semibold transition-all shrink-0 flex items-center gap-1"
                        >
                          <span>Rebook</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 2: BOOKING FLOW ================= */}
          {activeTab === 'book' && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              {/* Step 1: Services — compact single-row items */}
              <div className="bg-[#181920] border border-stone-800 rounded-2xl p-3 space-y-2 text-stone-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                    Choose Services
                  </h3>
                  {selectedServices.length > 0 && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      {selectedServices.length} sel · ₹{totalPrice} · {totalDuration}m
                    </span>
                  )}
                </div>

                {/* Selected pills */}
                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center">
                    {selectedServices.map((s) => (
                      <span key={s._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-medium text-amber-200">
                        {s.name} <span className="text-amber-400 font-bold">₹{s.price}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleService(s); }} className="text-stone-400 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button type="button" onClick={() => setSelectedServices([])} className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline ml-1">Clear</button>
                  </div>
                )}

                {/* Search */}
                {svcs.length > 5 && (
                  <div className="relative">
                    <Search className="w-3 h-3 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search services..." className="inp bg-[#14151b] border-stone-700/80 text-stone-100 placeholder:text-stone-500 pl-7 py-1.5 text-[11px]" value={searchSvc} onChange={(e) => setSearchSvc(e.target.value)} />
                  </div>
                )}

                {/* Service list — single row per item */}
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {filteredServices.map((s) => {
                    const isSelected = selectedServices.some((x) => x._id === s._id);
                    return (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => toggleService(s)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all ${isSelected
                          ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/30 text-stone-100'
                          : 'border-stone-800 bg-[#15161c] hover:border-stone-700 text-stone-300'}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-700 bg-stone-900'}`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-semibold flex-1 truncate">{s.name}</span>
                        <span className="text-[10px] text-stone-400 shrink-0">{s.duration}m</span>
                        <span className="text-[11px] font-bold text-amber-400 shrink-0">₹{s.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Date — compact horizontal strip */}
              <div className="bg-[#181920] border border-stone-800 rounded-2xl p-3 space-y-2 text-stone-100">
                <h3 className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  Choose Date
                </h3>
                <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
                  {upcomingDays.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`min-w-[52px] py-1.5 px-1.5 rounded-xl border text-center transition-all shrink-0 ${isSelected
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md font-bold'
                          : 'bg-[#15161c] text-stone-300 border-stone-800 hover:border-stone-700'}`}
                      >
                        <span className="text-[9px] uppercase font-bold block opacity-80">{d.dayName}</span>
                        <span className="text-sm font-extrabold block">{d.dayNumber}</span>
                        <span className="text-[9px] block opacity-70">{d.month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Time Slots — compact grid */}
              <div className="bg-[#181920] border border-stone-800 rounded-2xl p-3 space-y-2 text-stone-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                    Choose Time
                  </h3>
                  {selectedSlot && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                      {fmt(selectedSlot.startMin)} – {fmt(selectedSlot.startMin + totalDuration)}
                    </span>
                  )}
                </div>

                {selectedServices.length === 0 ? (
                  <p className="text-[11px] text-stone-500 text-center py-3">Select a service first</p>
                ) : slotsLoading ? (
                  <p className="text-[11px] text-stone-400 text-center py-3">Loading available slots...</p>
                ) : slots.length === 0 ? (
                  <div className="text-center py-3 text-[11px] text-stone-400">
                    <p className="font-semibold text-stone-300">No {totalDuration}-min slots available</p>
                    <p className="text-[10px] text-stone-500">Try another date</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {morningSlots.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-stone-400 uppercase flex items-center gap-1 mb-1">
                          <Sun className="w-3 h-3 text-amber-500" /> Morning
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                          {morningSlots.map((s) => {
                            const isPicked = selectedSlot?.startMin === s.startMin;
                            const disabled = isSlotDisabled(s);
                            return (
                              <button key={s.startMin} disabled={disabled} onClick={() => setSelectedSlot(s)}
                                className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${disabled
                                  ? 'bg-[#121317] text-stone-600 line-through cursor-not-allowed opacity-40 border border-stone-900'
                                  : isPicked
                                    ? 'bg-amber-600 text-white shadow-md border border-amber-500'
                                    : 'bg-[#15161c] border border-stone-800 text-stone-300 hover:border-amber-500/40'}`}>
                                {fmt(s.startMin)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {afternoonSlots.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-stone-400 uppercase flex items-center gap-1 mb-1">
                          <Sunset className="w-3 h-3 text-amber-500" /> Afternoon
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                          {afternoonSlots.map((s) => {
                            const isPicked = selectedSlot?.startMin === s.startMin;
                            const disabled = isSlotDisabled(s);
                            return (
                              <button key={s.startMin} disabled={disabled} onClick={() => setSelectedSlot(s)}
                                className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${disabled
                                  ? 'bg-[#121317] text-stone-600 line-through cursor-not-allowed opacity-40 border border-stone-900'
                                  : isPicked
                                    ? 'bg-amber-600 text-white shadow-md border border-amber-500'
                                    : 'bg-[#15161c] border border-stone-800 text-stone-300 hover:border-amber-500/40'}`}>
                                {fmt(s.startMin)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {eveningSlots.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-stone-400 uppercase flex items-center gap-1 mb-1">
                          <Moon className="w-3 h-3 text-indigo-400" /> Evening
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                          {eveningSlots.map((s) => {
                            const isPicked = selectedSlot?.startMin === s.startMin;
                            const disabled = isSlotDisabled(s);
                            return (
                              <button key={s.startMin} disabled={disabled} onClick={() => setSelectedSlot(s)}
                                className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${disabled
                                  ? 'bg-[#121317] text-stone-600 line-through cursor-not-allowed opacity-40 border border-stone-900'
                                  : isPicked
                                    ? 'bg-amber-600 text-white shadow-md border border-amber-500'
                                    : 'bg-[#15161c] border border-stone-800 text-stone-300 hover:border-amber-500/40'}`}>
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

              {/* Confirm bar */}
              {selectedServices.length > 0 && selectedSlot && (
                <div className="bg-gradient-to-r from-amber-950/40 via-[#181920] to-[#181920] border border-amber-500/40 rounded-2xl p-3 space-y-2 text-stone-100">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px]">
                      <span className="font-semibold text-white block">{selectedServices.map((s) => s.name).join(' + ')}</span>
                      <span className="text-stone-400">{selectedDate} · {fmt(selectedSlot.startMin)}–{fmt(selectedSlot.startMin + totalDuration)} · {totalDuration}m</span>
                    </div>
                    <span className="text-base font-extrabold text-amber-400">₹{totalPrice}</span>
                  </div>
                  <button type="button" onClick={() => setShowConfirmBookingModal(true)} className="btn-brand w-full py-2.5 text-xs shadow-md shadow-amber-600/30">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Confirm Booking</span>
                  </button>
                </div>
              )}

              {bookingMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
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
                  <h3 className="font-bold text-white text-base">Your Appointments</h3>
                  <span className="text-xs text-stone-400">{bk.length} total</span>
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
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-[#181920] text-stone-400 border border-stone-800 hover:text-stone-200'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="bg-[#181920] border border-stone-800 rounded-2xl text-center py-12 text-stone-400 text-xs space-y-2">
                  <Calendar className="w-10 h-10 text-stone-600 mx-auto" />
                  <p className="font-semibold text-stone-300 text-sm">No bookings in this category</p>
                  <p className="text-stone-500">Tap "Book" below to schedule a haircut or styling session.</p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="btn-brand text-xs py-2 px-4 mt-2"
                  >
                    Book New Appointment
                  </button>
                </div>
              ) : (
                <div className="bg-[#181920] border border-stone-800 rounded-2xl overflow-hidden shadow-xs">
                  {/* Responsive Table Structure */}
                  <div className="overflow-x-auto [scrollbar-width:thin]">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#13141a] border-b border-stone-800 text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Service</th>
                          <th className="py-2.5 px-3">Date & Time</th>
                          <th className="py-2.5 px-3">Price</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-center">Cancel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/70 text-stone-200">
                        {paginatedAppointments.map((b) => (
                          <tr key={b._id} className="hover:bg-[#1f202a] transition-colors">
                            {/* Service Details */}
                            <td className="py-2.5 px-3 min-w-[120px]">
                              <span className="font-bold text-white block truncate leading-tight">
                                {b.serviceName}
                              </span>
                              <span className="text-[10px] text-stone-500 block truncate mt-0.5">
                                {shopInfo?.shop?.name || 'Salon'}
                              </span>
                            </td>

                            {/* Date & Time */}
                            <td className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">
                              <span className="text-stone-300 font-medium block">
                                {b.date}
                              </span>
                              <span className="text-[10px] text-amber-400 font-mono block">
                                {fmt(b.startMin)}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-2.5 px-3 whitespace-nowrap font-extrabold text-amber-400">
                              ₹{b.price}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <StatusBadge status={b.status} />
                            </td>

                            {/* Cancel Action Icon */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {['pending', 'confirmed'].includes(b.status) ? (
                                <button
                                  type="button"
                                  onClick={() => setCancelBookingTarget(b)}
                                  title="Cancel Appointment"
                                  aria-label="Cancel appointment"
                                  className="p-1.5 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-500/20 border border-red-500/30 transition-all inline-flex items-center justify-center active:scale-95"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-stone-600 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Pagination Footer */}
                  {filteredAppointments.length > 0 && (
                    <div className="bg-[#14151b] border-t border-stone-800 px-3 py-2 flex items-center justify-between text-[11px] text-stone-400">
                      <span>
                        Showing <strong className="text-white">{(apptPage - 1) * apptPerPage + 1}</strong>–<strong className="text-white">{Math.min(apptPage * apptPerPage, filteredAppointments.length)}</strong> of <strong className="text-white">{filteredAppointments.length}</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={apptPage === 1}
                          onClick={() => setApptPage((p) => Math.max(1, p - 1))}
                          className="p-1 rounded-lg border border-stone-800 bg-[#191a22] hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none text-stone-300 transition-colors"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <span className="px-2 py-0.5 rounded bg-[#1a1b24] border border-stone-800 font-bold text-white text-[10px]">
                          {apptPage} / {totalApptPages}
                        </span>

                        <button
                          type="button"
                          disabled={apptPage >= totalApptPages}
                          onClick={() => setApptPage((p) => Math.min(totalApptPages, p + 1))}
                          className="p-1 rounded-lg border border-stone-800 bg-[#191a22] hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none text-stone-300 transition-colors"
                          title="Next Page"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: PROFILE & REWARDS ================= */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Quick Profile Summary Card */}
              <div className="bg-[#181920] border border-stone-800 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 font-extrabold text-lg flex items-center justify-center shrink-0 border border-amber-500/30">
                  {profileData.name ? profileData.name[0].toUpperCase() : 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white text-sm truncate">{profileData.name || 'Client'}</h4>
                  <p className="text-xs text-stone-400 font-mono truncate">{profileData.mobile}</p>
                  {profileData.email && <p className="text-xs text-stone-500 truncate">{profileData.email}</p>}
                </div>
              </div>

              {/* Personal Details Form */}
              <form onSubmit={saveProfile} className="bg-[#181920] border border-stone-800 rounded-2xl p-5 space-y-4 text-stone-100">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500" />
                    <span>Personal Details</span>
                  </h4>
                  <span className="text-xs text-stone-500">Edit info</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-400">Full Name *</label>
                    <input
                      className="inp bg-[#13141b] border-stone-750 text-stone-100 placeholder:text-stone-500"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-400">Registered Mobile</label>
                    <input
                      className="inp bg-stone-900/60 border-stone-800 text-stone-500 font-mono"
                      readOnly
                      disabled
                      value={profileData.mobile}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-400">Email Address</label>
                    <input
                      className="inp bg-[#13141b] border-stone-750 text-stone-100 placeholder:text-stone-500"
                      type="email"
                      placeholder="name@example.com"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-400">Gender</label>
                    <select
                      className="inp bg-[#13141b] border-stone-750 text-stone-100"
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
                    <label className="text-xs font-semibold text-stone-400">Date of Birth</label>
                    <input
                      type="date"
                      className="inp bg-[#13141b] border-stone-750 text-stone-100"
                      value={profileData.dob}
                      onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-400">
                      Hair & Grooming Preferences (Notes for Barber)
                    </label>
                    <textarea
                      rows={2}
                      className="inp bg-[#13141b] border-stone-750 text-stone-100 placeholder:text-stone-500"
                      placeholder="e.g. Low skin fade, beard lining, sensitive skin..."
                      value={profileData.notes}
                      onChange={(e) => setProfileData({ ...profileData, notes: e.target.value })}
                    />
                  </div>
                </div>

                {profileMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
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
              <div className="bg-[#181920] border border-stone-800 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-stone-400 text-xs uppercase tracking-wider pb-1">
                  Account & Security
                </h4>

                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/60 text-left text-xs text-stone-300 font-medium transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-stone-500" />
                    <span>Update Password</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </button>

                {shopInfo?.shop?.mobile && (
                  <a
                    href={`tel:${shopInfo.shop.mobile}`}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/60 text-left text-xs text-stone-300 font-medium transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-stone-500" />
                      <span>Call Salon Contact</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-500" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-red-500/10 text-left text-xs text-red-400 font-medium transition-colors border-t border-stone-800 pt-2"
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

        {/* ================= NATIVE MOBILE BOTTOM NAVIGATION BAR (FIXED FOOTER) ================= */}
        <nav className="shrink-0 z-30 bg-[#16171f]/98 backdrop-blur-md border-t border-stone-800 text-stone-400 w-full flex items-center justify-around pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] px-2 shadow-2xl">
          {[
            { id: 'home', label: 'Salon', icon: Store },
            { id: 'book', label: 'Book', icon: Scissors },
            { id: 'appointments', label: 'Bookings', icon: Calendar, badge: activeBookingsCount },
            { id: 'profile', label: 'Profile', icon: User },
            {
              id: 'logout',
              label: 'Logout',
              icon: LogOutIcon,
              onClick: () => setShowLogoutModal(true)
            }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative transition-all ${isActive
                  ? 'text-amber-400 font-bold scale-[1.05]'
                  : 'hover:text-stone-200'
                  }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />

                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-amber-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        {/* Close Smartphone Frame Container */}
      </div>

      {/* ================= CONFIRMATION MODALS & DRAWERS ================= */}

      {/* 🔔 Customer Notification Center Drawer */}
      {showNotifDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-[#161722] border border-stone-800 rounded-3xl shadow-2xl p-4 space-y-3.5 max-h-[85vh] flex flex-col animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => syncCustomerData(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                  title="Refresh Notifications"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowNotifDrawer(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dual Tabs: [New / Unread] and [Daily All History] */}
            <div className="flex border-b border-stone-800 bg-stone-900/60 p-1 rounded-2xl gap-1 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setCustomerNotifTab('unread')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs ${customerNotifTab === 'unread'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-white'
                  }`}
              >
                <span>Latest (Unread)</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-stone-950 rounded-full text-[10px] font-extrabold">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCustomerNotifTab('all')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs ${customerNotifTab === 'all'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-white'
                  }`}
              >
                <span>Daily All</span>
                <span className="text-[10px] text-stone-500 font-normal">({customerNotifs.length})</span>
              </button>
            </div>

            {/* Actions: Mark read / Clear */}
            {customerNotifs.length > 0 && (
              <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 shrink-0">
                <button
                  type="button"
                  onClick={markAllNotifsAsRead}
                  className="hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
                <button
                  type="button"
                  onClick={clearAllNotifs}
                  className="hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              </div>
            )}

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px] max-h-[360px]">
              {customerNotifTab === 'unread' ? (
                customerNotifs.filter((n) => !n.read).length === 0 ? (
                  <div className="text-center py-8 text-stone-500 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs font-semibold text-white">All caught up!</p>
                    <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                      No new unread alerts. Read notifications are preserved in the <b>Daily All</b> tab.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCustomerNotifTab('all')}
                      className="mt-1 text-xs text-amber-400 hover:text-amber-300 underline font-medium block mx-auto"
                    >
                      View Daily History →
                    </button>
                  </div>
                ) : (
                  customerNotifs
                    .filter((n) => !n.read)
                    .map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotifRead(n.id);
                          setShowNotifDrawer(false);
                          setActiveTab('appointments');
                        }}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${n.isUrgent || n.type === 'reminder'
                          ? 'bg-amber-500/15 border-amber-500/50 hover:bg-amber-500/20'
                          : 'bg-[#1e202c] border-amber-500/30 hover:border-amber-500/50'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {n.type === 'reminder' ? (
                              <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                            ) : n.type === 'confirmed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            )}
                            <h4 className="font-bold text-xs text-white leading-tight">
                              {n.title}
                            </h4>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                        </div>
                        <p className="text-[11px] text-stone-300 mt-1 leading-snug">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-stone-500 mt-2 pt-1 border-t border-stone-800/60">
                          <span>{n.time ? `At ${n.time}` : ''}</span>
                          <span className="text-amber-400/80 font-medium">Tap to view →</span>
                        </div>
                      </div>
                    ))
                )
              ) : customerNotifs.length === 0 ? (
                <div className="text-center py-10 text-stone-500 space-y-2">
                  <Bell className="w-8 h-8 text-stone-700 mx-auto" />
                  <p className="text-xs font-semibold text-stone-400">No notifications yet</p>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    You'll receive 1-hour service reminders and appointment updates here.
                  </p>
                </div>
              ) : (
                (() => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  const yestStr = yest.toISOString().slice(0, 10);
                  const groups = {};

                  customerNotifs.forEach((n) => {
                    const datePart = n.date || (n.timestamp ? n.timestamp.slice(0, 10) : todayStr);
                    let label = datePart;
                    if (datePart === todayStr) label = 'Today';
                    else if (datePart === yestStr) label = 'Yesterday';
                    if (!groups[label]) groups[label] = [];
                    groups[label].push(n);
                  });

                  return Object.entries(groups).map(([dateLabel, groupItems]) => (
                    <div key={dateLabel} className="space-y-1.5">
                      <div className="px-2 py-1 bg-stone-900/90 text-stone-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between rounded-lg border border-stone-800">
                        <span>{dateLabel}</span>
                        <span className="text-[10px] text-stone-500 font-normal">
                          {groupItems.length} alert{groupItems.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {groupItems.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotifRead(n.id);
                              setShowNotifDrawer(false);
                              setActiveTab('appointments');
                            }}
                            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${n.isUrgent || n.type === 'reminder'
                              ? 'bg-amber-500/15 border-amber-500/50 hover:bg-amber-500/20'
                              : n.read
                                ? 'bg-[#191a23] border-stone-800/80 hover:border-stone-700 opacity-80'
                                : 'bg-[#1e202c] border-amber-500/30 hover:border-amber-500/50'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {n.type === 'reminder' ? (
                                  <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                                ) : n.type === 'confirmed' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                )}
                                <h4 className="font-bold text-xs text-white leading-tight">
                                  {n.title}
                                </h4>
                              </div>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                              )}
                            </div>
                            <p className="text-[11px] text-stone-300 mt-1 leading-snug">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-2 pt-1 border-t border-stone-800/60">
                              <span>{n.time ? `At ${n.time}` : ''}</span>
                              <span className="text-amber-400/80 font-medium">Tap to view →</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 Real-time Popup Toast for Customer */}
      {toastNotif && (
        <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-[#1e202c] border border-amber-500/60 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-amber-400 truncate">{toastNotif.title || 'New Notification'}</h4>
              <p className="text-[11px] text-stone-300 truncate">{toastNotif.message}</p>
            </div>
          </div>
          <button
            onClick={() => setToastNotif(null)}
            className="p-1 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
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
