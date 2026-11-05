import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import { auth, ui, notifications } from '../redux/slices';
import ConfirmModal from './Modal';
import {
  Scissors,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  ExternalLink,
  ChevronRight,
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  Sparkles,
  CalendarCheck,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';

export const fmt = (m) => {
  if (m === undefined || m === null) return '--:--';
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(min).padStart(2, '0')} ${ampm}`;
};

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    // Audio context may require prior user interaction
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Just now';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationMenu({ isMobile = false }) {
  const d = useDispatch();
  const nav = useNavigate();
  const notifs = useSelector((s) => s.notifications?.items) || [];
  const unreadCount = useSelector((s) => s.notifications?.unreadCount) || 0;
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('unread'); // 'unread' | 'all'
  const menuRef = useRef(null);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/barber/notifications', { skipGlobalLoader: true });
      if (Array.isArray(res.data)) {
        d(notifications.actions.setNotifications(res.data));
      }
      d(ui.actions.fetchRequest({ key: 'dash', url: '/barber/dashboard' }));
      d(ui.actions.fetchRequest({ key: 'appts', url: '/barber/appointments' }));
      d(ui.actions.triggerRefresh());
    } catch {
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Filter only unread items for the "New / Unread" tab
  const unreadNotifs = notifs.filter((n) => !n.read);

  // Helper to group all notifications day-by-day
  const todayStr = new Date().toISOString().slice(0, 10);
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yestStr = yest.toISOString().slice(0, 10);

  const dailyGroups = {};
  notifs.forEach((n) => {
    const dateKey = n.date || (n.timestamp ? n.timestamp.slice(0, 10) : todayStr);
    let label = dateKey;
    if (dateKey === todayStr) label = 'Today';
    else if (dateKey === yestStr) label = 'Yesterday';
    if (!dailyGroups[label]) dailyGroups[label] = [];
    dailyGroups[label].push(n);
  });

  const renderCard = (n) => {
    const isCancellation = n.type === 'cancellation';
    const isCompleted = n.type === 'completed';

    return (
      <div
        key={n.id}
        onClick={() => {
          d(notifications.actions.markAsRead(n.id));
          setOpen(false);
          nav('/barber/appointments');
        }}
        className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-stone-50 ${
          !n.read ? 'bg-amber-50/40' : 'bg-white'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isCancellation
              ? 'bg-red-100 text-red-700'
              : isCompleted
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-800'
          }`}
        >
          {isCancellation ? (
            <AlertCircle className="w-4 h-4" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Scissors className="w-4 h-4 rotate-45" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-stone-900 text-xs truncate">
              {n.title}
            </span>
            <span className="text-[10px] text-stone-400 shrink-0">
              {timeAgo(n.timestamp)}
            </span>
          </div>

          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {n.message}
          </p>

          {n.date && (
            <div className="flex items-center gap-2 text-[10px] text-stone-500 font-medium">
              <span>📅 {n.date}</span>
              {n.time && <span>• ⏰ {n.time}</span>}
              {n.price && <span className="font-bold text-amber-800">• ₹{n.price}</span>}
            </div>
          )}
        </div>

        {!n.read && (
          <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0 mt-1.5" />
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-xl transition-all ${
          isMobile
            ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
            : 'border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 shadow-sm'
        }`}
        title="Real-Time Booking Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-stone-900 text-sm">Notifications</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="p-1 rounded-lg hover:bg-stone-200 text-stone-600 text-xs flex items-center gap-1 font-medium transition-colors"
                title="Refresh notifications & table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => d(notifications.actions.markAllAsRead())}
                  className="p-1 rounded-lg hover:bg-stone-200 text-stone-600 text-xs flex items-center gap-1 font-medium"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  type="button"
                  onClick={() => d(notifications.actions.clearAll())}
                  className="p-1 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 text-xs flex items-center gap-1"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dual Tabs: [New / Unread] and [Daily All History] */}
          <div className="flex border-b border-stone-200 bg-stone-100/60 p-1 gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'unread'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <span>Latest (Unread)</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <span>Daily All</span>
              <span className="text-[10px] text-stone-400 font-normal">({notifs.length})</span>
            </button>
          </div>

          {/* Notifications List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {activeTab === 'unread' ? (
              unreadNotifs.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto stroke-1" />
                  <p className="font-semibold text-stone-800 text-sm">All caught up!</p>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    You have read all new notifications. Check the <b>Daily All</b> tab to review past notifications.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="mt-1 text-xs font-semibold text-amber-700 hover:text-amber-800 underline block mx-auto"
                  >
                    View Daily History →
                  </button>
                </div>
              ) : (
                unreadNotifs.map(renderCard)
              )
            ) : notifs.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 space-y-1">
                <Bell className="w-8 h-8 text-stone-300 mx-auto mb-1 stroke-1" />
                <p className="font-semibold text-stone-700">No notifications yet</p>
                <p className="text-[11px] text-stone-400">
                  New appointment bookings will appear here.
                </p>
              </div>
            ) : (
              Object.entries(dailyGroups).map(([dateLabel, groupItems]) => (
                <div key={dateLabel}>
                  <div className="px-3.5 py-1.5 bg-stone-100/80 text-stone-600 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border-y border-stone-200/60 sticky top-0 z-10">
                    <span>{dateLabel}</span>
                    <span className="text-[10px] font-normal text-stone-400">
                      {groupItems.length} alert{groupItems.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {groupItems.map(renderCard)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View Appointments */}
          <div className="p-2.5 bg-stone-50 border-t border-stone-200 text-center">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                nav('/barber/appointments');
              }}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1"
            >
              <span>View Appointment Manager</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserProfileMenu({ onLogout, isMobile = false }) {
  const u = useSelector((s) => s.auth.user);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const isBarber = u?.role === 'barber';
  const roleLabel = u?.role === 'superadmin' ? 'Super Admin' : isBarber ? 'Barber Store' : 'Customer';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all ${
          isMobile
            ? 'border-stone-700 bg-stone-800 text-white hover:bg-stone-700'
            : 'border-stone-200/90 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-300 shadow-xs'
        }`}
        aria-label="User profile menu"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
          {u?.avatarUrl ? (
            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
          ) : u?.name ? (
            u.name[0].toUpperCase()
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>
        <div className="hidden sm:block text-left min-w-0 max-w-[120px]">
          <span className="text-xs font-bold text-stone-900 block truncate leading-tight">
            {u?.name || 'Account'}
          </span>
          <span className="text-[10px] text-amber-700 font-medium block truncate leading-tight">
            {roleLabel}
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3.5 py-2.5 border-b border-stone-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
              {u?.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
              ) : u?.name ? (
                u.name[0].toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-stone-900 truncate">{u?.name || 'User'}</p>
              <p className="text-[11px] text-stone-500 truncate">{u?.mobile || u?.email || ''}</p>
              <span className="inline-block mt-0.5 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="p-1 space-y-0.5">
            {isBarber && (
              <button
                onClick={() => {
                  setOpen(false);
                  nav('/barber/store');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors text-left"
              >
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>Store & Profile Settings</span>
              </button>
            )}

            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Toast() {
  const m = useSelector((s) => s.ui.msg);
  const d = useDispatch();

  useEffect(() => {
    if (m) {
      const t = setTimeout(() => d(ui.actions.setMsg(null)), 5000);
      return () => clearTimeout(t);
    }
  }, [m, d]);

  if (!m) return null;

  const isErr = m.type === 'error';

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl shadow-float border ${isErr
            ? 'bg-red-50/95 border-red-200 text-red-900 backdrop-blur-sm'
            : 'bg-emerald-50/95 border-emerald-200 text-emerald-900 backdrop-blur-sm'
          }`}
      >
        {isErr ? (
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 text-sm font-medium leading-relaxed">{m.text}</div>
        <button
          onClick={() => d(ui.actions.setMsg(null))}
          className="p-1 rounded-lg hover:bg-black/5 text-stone-500 hover:text-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Shell({ title, links, children, actions, subtitle }) {
  const d = useDispatch();
  const nav = useNavigate();
  const location = useLocation();
  const u = useSelector((s) => s.auth.user);
  const shopData = useSelector((s) => s.ui.data.shopinfo?.shop);
  const activeShop = shopData || u?.shop;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarLogoFailed, setSidebarLogoFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Monitor fullscreen status
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle:', err);
    }
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setSidebarLogoFailed(false);
  }, [activeShop?.logoUrl]);

  const confirmLogout = () => {
    d(auth.actions.logout());
    nav('/login');
  };

  const roleLabel =
    u?.role === 'superadmin' ? 'Super Admin' : u?.role === 'barber' ? 'Barber Store' : 'Customer';

  const isBarber = u?.role === 'barber';
  const displayTitle = isBarber && activeShop?.name ? activeShop.name : 'BarberPro';
  const displaySubtitle = isBarber
    ? activeShop?.shopCode
      ? `Code: ${activeShop.shopCode}`
      : 'Barber Store'
    : roleLabel;
  const storeLogo = isBarber ? activeShop?.logoUrl : null;

  const knownNotifIds = useRef(new Set());
  const isSyncInitialized = useRef(false);

  // Real-time Notification Engine for Barber Store (Works 100% on Vercel production + Socket.io)
  useEffect(() => {
    if (!isBarber) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const syncNotifications = async (isInitial = false) => {
      try {
        const res = await api.get('/barber/notifications', { skipGlobalLoader: true });
        if (Array.isArray(res.data)) {
          const incoming = res.data;

          if (isInitial || !isSyncInitialized.current) {
            // Register existing notification IDs on first load
            incoming.forEach((n) => knownNotifIds.current.add(n.id));
            d(notifications.actions.setNotifications(incoming));
            isSyncInitialized.current = true;
          } else {
            // Check for brand new notifications
            const newItems = incoming.filter((n) => !knownNotifIds.current.has(n.id));
            if (newItems.length > 0) {
              newItems.forEach((n) => knownNotifIds.current.add(n.id));
              playNotificationChime();

              const latest = newItems[0];
              const toastText =
                latest.type === 'cancellation'
                  ? `⚠️ Booking Cancelled: ${latest.customer} (${latest.serviceName})`
                  : latest.type === 'completed'
                    ? `✅ Service Completed: ${latest.customer} (${latest.serviceName})`
                    : `🔔 New Online Booking: ${latest.customer} booked ${latest.serviceName}!`;

              d(
                ui.actions.setMsg({
                  type: latest.type === 'cancellation' ? 'error' : 'ok',
                  text: toastText
                })
              );

              d(notifications.actions.setNotifications(incoming));

              // Real-time table and dashboard refresh without page reload
              d(ui.actions.fetchRequest({ key: 'dash', url: '/barber/dashboard' }));
              d(ui.actions.fetchRequest({ key: 'appts', url: '/barber/appointments' }));
              d(ui.actions.triggerRefresh());
            } else {
              d(notifications.actions.setNotifications(incoming));
            }
          }
        }
      } catch {
        // Silent background sync
      }
    };

    // Initial load
    syncNotifications(true);

    // Active real-time background sync interval (every 3.5 seconds on production)
    const pollTimer = setInterval(() => {
      syncNotifications(false);
    }, 3500);

    // Instant sync when user refocuses browser window or tab
    const handleFocus = () => {
      if (!document.hidden) {
        syncNotifications(false);
      }
    };
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // Also support Socket.IO if a persistent connection is available
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined;
    let socket;
    try {
      socket = socketUrl ? io(socketUrl, { auth: { token } }) : io({ auth: { token } });

      socket.on('booking:new', (data) => {
        if (!knownNotifIds.current.has(data.id)) {
          knownNotifIds.current.add(data.id);
          d(notifications.actions.addNotification(data));
          playNotificationChime();
          d(
            ui.actions.setMsg({
              type: 'ok',
              text: `🔔 New Booking: ${data.customer} booked ${data.serviceName}!`
            })
          );
          d(ui.actions.fetchRequest({ key: 'dash', url: '/barber/dashboard' }));
          d(ui.actions.fetchRequest({ key: 'appts', url: '/barber/appointments' }));
          d(ui.actions.triggerRefresh());
        }
      });

      socket.on('booking:cancelled', (data) => {
        if (!knownNotifIds.current.has(data.id)) {
          knownNotifIds.current.add(data.id);
          d(notifications.actions.addNotification(data));
          d(
            ui.actions.setMsg({
              type: 'error',
              text: `⚠️ Booking Cancelled: ${data.customer} (${data.serviceName})`
            })
          );
          d(ui.actions.fetchRequest({ key: 'dash', url: '/barber/dashboard' }));
          d(ui.actions.fetchRequest({ key: 'appts', url: '/barber/appointments' }));
          d(ui.actions.triggerRefresh());
        }
      });
    } catch {
      // Socket.IO optional
    }

    return () => {
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      if (socket) socket.close();
    };
  }, [isBarber, d]);

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900">
      {/* Desktop Sidebar - Fixed, does not scroll with page */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 h-screen flex-col bg-stone-900 text-stone-200 border-r border-stone-800 select-none z-30">
        {/* Brand Logo Header with Store Logo & Name */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {storeLogo && !sidebarLogoFailed ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/70 bg-stone-800 shrink-0 shadow-md shadow-amber-600/20">
                <img
                  src={storeLogo}
                  alt={displayTitle}
                  onError={() => setSidebarLogoFailed(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-600/30 shrink-0">
                <Scissors className="w-5 h-5 rotate-45" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="font-bold text-base tracking-tight text-white block leading-tight truncate">
                {displayTitle}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 mt-0.5 block truncate">
                {displaySubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links - no visible scrollbar */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end !== false}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30 font-semibold'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`
                }
              >
                {Icon && <Icon className="w-4 h-4 shrink-0 opacity-90" />}
                <span className="truncate">{l.label}</span>
                {l.badge && (
                  <span className="ml-auto bg-stone-800 text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">
                    {l.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area - offset for fixed sidebar on desktop */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Top App Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md text-white border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {storeLogo && !sidebarLogoFailed ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/70 bg-stone-800 shrink-0">
              <img
                src={storeLogo}
                alt={displayTitle}
                onError={() => setSidebarLogoFailed(true)}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shrink-0">
              <Scissors className="w-4 h-4 rotate-45" />
            </div>
          )}
          <span className="font-bold text-sm sm:text-base tracking-tight text-white truncate max-w-[180px]">
            {displayTitle}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Mobile Full Screen View Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen View'}
            aria-label="Toggle full screen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {isBarber && <NotificationMenu isMobile={true} />}
          <UserProfileMenu onLogout={() => setShowLogoutModal(true)} isMobile={true} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-stone-900 text-white flex flex-col h-full shadow-2xl z-50 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                {storeLogo && !sidebarLogoFailed ? (
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/70 bg-stone-800 shrink-0">
                    <img
                      src={storeLogo}
                      alt={displayTitle}
                      onError={() => setSidebarLogoFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shrink-0">
                    <Scissors className="w-4 h-4 rotate-45" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="font-bold text-sm text-white block truncate">{displayTitle}</span>
                  <span className="text-[10px] block text-stone-400 uppercase tracking-wider truncate">
                    {displaySubtitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {links.map((l) => {
                const Icon = l.icon;
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end !== false}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-stone-300 hover:bg-stone-800'
                      }`
                    }
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                    <span>{l.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-stone-800 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  toggleFullscreen();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
                <span>{isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen View'}</span>
              </button>
              <div className="text-xs text-stone-400">
                Logged in as <b className="text-white">{u?.name}</b>
              </div>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-950/40 text-red-400 text-sm font-medium border border-red-900/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Top Header / Breadcrumb Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-20 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-center">
            {actions}
            {/* Notification & Profile hidden on mobile — already in mobile top bar */}
            {isBarber && <div className="hidden md:block"><NotificationMenu /></div>}
            <div className="hidden md:block"><UserProfileMenu onLogout={() => setShowLogoutModal(true)} /></div>
          </div>
        </div>

        {/* Page Inner Container */}
        <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">{children}</div>
      </main>

      {/* Mobile Bottom Quick-Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-stone-200 text-stone-600 flex items-center justify-around z-30 py-1.5 px-2 shadow-lg">
        {links.slice(0, 4).map((l) => {
          const Icon = l.icon || Scissors;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end !== false}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${isActive ? 'text-amber-600 font-semibold' : 'text-stone-500 hover:text-stone-900'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{l.label}</span>
            </NavLink>
          );
        })}
      </nav>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        type="warning"
        title="Sign Out Confirmation"
        message={`Are you sure you want to sign out, ${u?.name || 'User'}? You will need to log in again to access your account.`}
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={confirmLogout}
        onClose={() => setShowLogoutModal(false)}
      />

      <Toast />
    </div>
  );
}
