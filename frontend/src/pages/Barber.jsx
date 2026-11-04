import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import Shell, { fmt } from '../components/Shell';
import ConfirmModal from '../components/Modal';
import Crud, { Stat, StatusBadge } from '../components/Crud';
import { ui } from '../redux/slices';
import {
  Home as HomeIcon,
  Calendar,
  Users,
  Scissors,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Share2,
  Copy,
  Check,
  Plus,
  Phone,
  CreditCard,
  TrendingUp,
  UserCheck,
  Sparkles,
  CalendarDays,
  User,
  Filter,
  Settings,
  Image as ImageIcon,
  MapPin,
  Save,
  Building,
  KeyRound,
  ExternalLink,
  Store
} from 'lucide-react';

const barberLinks = [
  { to: '/barber', label: 'Dashboard', icon: HomeIcon },
  { to: '/barber/appointments', label: 'Appointments', icon: Calendar },
  { to: '/barber/customers', label: 'Clients', icon: Users },
  { to: '/barber/services', label: 'Menu & Services', icon: Scissors },
  { to: '/barber/store', label: 'Store & Profile', icon: Settings }
];

const fetchAppts = { key: 'appts', url: '/barber/appointments' };

function useLive() {
  const d = useDispatch();
  useEffect(() => {
    const s = io({ auth: { token: localStorage.getItem('token') } });
    const ping = (text) => () => {
      d(ui.actions.setMsg({ type: 'ok', text }));
      d(ui.actions.fetchRequest(fetchAppts));
      d(ui.actions.fetchRequest({ key: 'dash', url: '/barber/dashboard' }));
    };
    s.on('booking:new', ping('New booking request received!'));
    s.on('booking:cancelled', ping('A client cancelled their appointment'));
    return () => s.close();
  }, [d]);
}

function Home() {
  const d = useDispatch();
  const s = useSelector((x) => x.ui.data.dash) || {};
  const info = useSelector((x) => x.ui.data.shopinfo);
  const [copied, setCopied] = useState(false);

  useLive();

  useEffect(() => {
    d(ui.actions.fetchRequest({ key: 'dash', url: '/barber/dashboard' }));
    d(ui.actions.fetchRequest({ key: 'shopinfo', url: '/barber/shop' }));
  }, [d]);

  const copyLink = () => {
    if (info?.customerLink) {
      navigator.clipboard.writeText(info.customerLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Shell
      title="Store Dashboard"
      subtitle={info?.shop?.name ? `${info.shop.name} • Shop Code: ${info.shop.shopCode}` : "Today's appointments & live activity"}
      links={barberLinks}
    >
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat l="Today's Appointments" v={s.total} icon={CalendarDays} color="amber" />
        <Stat l="Completed Cuts" v={s.completed} icon={CheckCircle2} color="emerald" />
        <Stat l="Pending Requests" v={s.pending} icon={Clock} color="purple" />
        <Stat l="Cancelled / No-Show" v={s.cancelled} icon={XCircle} color="stone" />
        <Stat l="Today's Sales" v={`₹${(s.todaySales || 0).toLocaleString()}`} icon={DollarSign} color="amber" />
        <Stat l="Monthly Revenue" v={`₹${(s.monthSales || 0).toLocaleString()}`} icon={TrendingUp} color="emerald" />
        <Stat l="Registered Clients" v={s.customers} icon={Users} color="blue" />
        <Stat l="Active Services" v={info?.servicesCount ?? '–'} icon={Scissors} color="stone" />
      </div>

      {/* Customer Booking Link Banner */}
      {info?.customerLink && (
        <div className="card border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  Your Client Booking Portal Link
                </h3>
              </div>
              <p className="text-xs text-stone-500">
                Share this link with your customers to let them book appointments online 24/7.
              </p>
            </div>

            <button
              onClick={copyLink}
              className="btn-brand self-start sm:self-auto shrink-0 text-xs py-2 px-3.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Booking Link'}</span>
            </button>
          </div>

          <div className="bg-white/80 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-700 break-all select-all flex items-center justify-between gap-2">
            <span>{info.customerLink}</span>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Appts() {
  const d = useDispatch();
  const rows = useSelector((x) => x.ui.data.appts) || [];
  const custs = useSelector((x) => x.ui.data.customers) || [];
  const svcs = useSelector((x) => x.ui.data.services) || [];

  const [f, setF] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    customerId: '',
    serviceId: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [billingTarget, setBillingTarget] = useState(null);
  const [payMethod, setPayMethod] = useState('cash');
  const [statusConfirm, setStatusConfirm] = useState(null);

  useLive();

  useEffect(() => {
    d(ui.actions.fetchRequest(fetchAppts));
    d(ui.actions.fetchRequest({ key: 'customers', url: '/barber/customers' }));
    d(ui.actions.fetchRequest({ key: 'services', url: '/barber/services' }));
  }, [d]);

  const setStatus = (id, status) =>
    d(ui.actions.submitRequest({ method: 'patch', url: `/barber/appointments/${id}`, body: { status }, refresh: fetchAppts }));

  const confirmBill = () => {
    if (billingTarget) {
      d(ui.actions.submitRequest({
        url: '/barber/invoices',
        body: { appointmentId: billingTarget._id, method: payMethod },
        refresh: fetchAppts
      }));
      setBillingTarget(null);
    }
  };

  const add = (e) => {
    e.preventDefault();
    const [h, m] = f.time.split(':');
    d(
      ui.actions.submitRequest({
        url: '/barber/appointments',
        body: {
          customerId: f.customerId,
          serviceId: f.serviceId,
          date: f.date,
          startMin: parseInt(h, 10) * 60 + parseInt(m, 10)
        },
        refresh: fetchAppts
      })
    );
    setShowAddForm(false);
  };

  const filtered = rows.filter((r) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'confirmed') return ['confirmed', 'in_progress'].includes(r.status);
    if (activeTab === 'completed') return r.status === 'completed';
    if (activeTab === 'cancelled') return ['cancelled', 'rejected', 'no_show'].includes(r.status);
    return true;
  });

  return (
    <Shell
      title="Appointment Management"
      subtitle="Schedule walk-in bookings and process client requests"
      links={barberLinks}
      actions={
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-brand"
        >
          {showAddForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'Close Form' : 'New Walk-In Booking'}</span>
        </button>
      }
    >
      {/* Walk-in Form Collapsible Card */}
      {showAddForm && (
        <form
          onSubmit={add}
          className="card border-amber-200 bg-amber-50/20 p-5 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-100">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Schedule Walk-In / Manual Appointment</span>
            </h3>
            <span className="text-xs text-stone-500">* Required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Client *</label>
              <select
                required
                className="inp"
                value={f.customerId}
                onChange={(e) => setF({ ...f, customerId: e.target.value })}
              >
                <option value="">Select Client</option>
                {custs.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Service *</label>
              <select
                required
                className="inp"
                value={f.serviceId}
                onChange={(e) => setF({ ...f, serviceId: e.target.value })}
              >
                <option value="">Select Service</option>
                {svcs.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - ₹{c.price} ({c.duration}m)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Date *</label>
              <input
                type="date"
                required
                className="inp"
                value={f.date}
                onChange={(e) => setF({ ...f, date: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Time *</label>
              <input
                type="time"
                required
                className="inp"
                value={f.time}
                onChange={(e) => setF({ ...f, time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-o"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-brand">
              Confirm Booking
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-xl max-w-fit overflow-x-auto text-xs font-medium">
        {[
          { id: 'all', label: `All (${rows.length})` },
          { id: 'pending', label: `Pending (${rows.filter((r) => r.status === 'pending').length})` },
          { id: 'confirmed', label: 'Active & Confirmed' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id
              ? 'bg-white text-stone-900 shadow-sm font-semibold'
              : 'text-stone-600 hover:text-stone-900'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-12 px-4 space-y-2">
            <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="font-semibold text-stone-800 text-sm">No appointments in this view</p>
            <p className="text-xs text-stone-500">
              New client bookings or walk-ins will appear here in real-time.
            </p>
          </div>
        ) : (
          filtered.map((a) => (
            <div
              key={a._id}
              className="card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center justify-center font-bold text-sm shrink-0">
                  {a.customerId?.name ? a.customerId.name[0].toUpperCase() : <User className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-stone-900 text-base">
                      {a.customerId?.name || 'Walk-In Client'}
                    </span>
                    <span className="text-xs font-semibold text-stone-600 px-2 py-0.5 rounded-md bg-stone-100">
                      {a.serviceName}
                    </span>
                    <span className="text-xs font-bold text-amber-800 px-2 py-0.5 rounded-md bg-amber-50">
                      ₹{a.price}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{a.date}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        {fmt(a.startMin)} – {fmt(a.endMin)}
                      </span>
                    </span>
                    {a.customerId?.mobile && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>{a.customerId.mobile}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                {a.status === 'pending' && (
                  <>
                    <button
                      className="btn-brand text-xs py-1.5 px-3"
                      onClick={() => setStatus(a._id, 'confirmed')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      className="btn-danger text-xs py-1.5 px-3"
                      onClick={() =>
                        setStatusConfirm({
                          id: a._id,
                          status: 'rejected',
                          label: `reject appointment for ${a.customerId?.name || 'this client'}`,
                          type: 'danger',
                          confirmText: 'Reject Appointment'
                        })
                      }
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {['confirmed', 'in_progress'].includes(a.status) && (
                  <>
                    <button
                      className="btn-brand text-xs py-1.5 px-3"
                      onClick={() => {
                        setPayMethod('cash');
                        setBillingTarget(a);
                      }}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Complete & Bill</span>
                    </button>
                    <button
                      className="btn-o text-xs py-1.5 px-3"
                      onClick={() =>
                        setStatusConfirm({
                          id: a._id,
                          status: 'no_show',
                          label: `mark ${a.customerId?.name || 'this client'} as No-Show`,
                          type: 'warning',
                          confirmText: 'Mark No-Show'
                        })
                      }
                    >
                      <span>No-Show</span>
                    </button>
                    <button
                      className="btn-danger text-xs py-1.5 px-3"
                      onClick={() =>
                        setStatusConfirm({
                          id: a._id,
                          status: 'cancelled',
                          label: `cancel appointment for ${a.customerId?.name || 'this client'}`,
                          type: 'danger',
                          confirmText: 'Cancel Appointment'
                        })
                      }
                    >
                      <span>Cancel</span>
                    </button>
                  </>
                )}

                {a.status === 'completed' && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Paid & Closed</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Method Billing Modal */}
      <ConfirmModal
        isOpen={Boolean(billingTarget)}
        type="info"
        title="Complete Service & Generate Bill"
        message={
          billingTarget
            ? `Client: ${billingTarget.customerId?.name || 'Walk-in'} • Service: ${billingTarget.serviceName} • Total: ₹${billingTarget.price}`
            : ''
        }
        confirmText="Confirm & Mark Paid"
        cancelText="Cancel"
        confirmButtonClass="btn-brand"
        onConfirm={confirmBill}
        onClose={() => setBillingTarget(null)}
      >
        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-stone-700 block">Select Payment Mode</label>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            {[
              { id: 'cash', label: '💵 Cash' },
              { id: 'upi', label: '📱 UPI / QR' },
              { id: 'card', label: '💳 Card' },
              { id: 'online', label: '🌐 Online' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPayMethod(m.id)}
                className={`py-2 px-3 rounded-xl border text-center transition-all ${payMethod === m.id
                  ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-600'
                  : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </ConfirmModal>

      {/* Appointment Status Action Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(statusConfirm)}
        type={statusConfirm?.type || 'warning'}
        title="Confirm Appointment Action"
        message={statusConfirm ? `Are you sure you want to ${statusConfirm.label}?` : ''}
        confirmText={statusConfirm?.confirmText || 'Confirm'}
        cancelText="Cancel"
        confirmButtonClass={statusConfirm?.type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : undefined}
        onConfirm={() => {
          if (statusConfirm) {
            setStatus(statusConfirm.id, statusConfirm.status);
            setStatusConfirm(null);
          }
        }}
        onClose={() => setStatusConfirm(null)}
      />
    </Shell>
  );
}

const minToTime = (m) => {
  if (m === undefined || m === null) return '09:00';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

const timeToMin = (t) => {
  if (!t) return 600;
  const [h, m] = t.split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};

const DAYS = [
  { idx: 0, label: 'Sun' },
  { idx: 1, label: 'Mon' },
  { idx: 2, label: 'Tue' },
  { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' },
  { idx: 5, label: 'Fri' },
  { idx: 6, label: 'Sat' }
];

function StoreAndProfile() {
  const d = useDispatch();
  const [tab, setTab] = useState('store'); // 'store' | 'profile'
  const [shopForm, setShopForm] = useState({
    name: '',
    ownerName: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    openTime: '10:00',
    closeTime: '21:00',
    holidays: [],
    logoUrl: '',
    description: ''
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    mobile: '',
    avatarUrl: ''
  });
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' });
  const [showPwModal, setShowPwModal] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load shop and profile data
  useEffect(() => {
    Promise.all([api.get('/barber/shop'), api.get('/barber/profile')])
      .then(([shopRes, profRes]) => {
        const s = shopRes.data.shop || {};
        const u = profRes.data.user || {};
        setShopForm({
          name: s.name || '',
          ownerName: s.ownerName || '',
          mobile: s.mobile || '',
          email: s.email || '',
          address: s.address || '',
          city: s.city || '',
          openTime: minToTime(s.openMin ?? 600),
          closeTime: minToTime(s.closeMin ?? 1260),
          holidays: s.holidays || [],
          logoUrl: s.logoUrl || '',
          description: s.description || '',
          shopCode: s.shopCode,
          customerLink: shopRes.data.customerLink
        });
        setUserForm({
          name: u.name || '',
          email: u.email || '',
          mobile: u.mobile || '',
          avatarUrl: u.avatarUrl || ''
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveShop = (e) => {
    e.preventDefault();
    const payload = {
      name: shopForm.name,
      ownerName: shopForm.ownerName,
      mobile: shopForm.mobile,
      email: shopForm.email,
      address: shopForm.address,
      city: shopForm.city,
      openMin: timeToMin(shopForm.openTime),
      closeMin: timeToMin(shopForm.closeTime),
      holidays: shopForm.holidays,
      logoUrl: shopForm.logoUrl,
      description: shopForm.description
    };
    d(ui.actions.submitRequest({
      method: 'patch',
      url: '/barber/shop',
      body: payload,
      refresh: { key: 'shopinfo', url: '/barber/shop' }
    }));
  };

  const saveUser = (e) => {
    e.preventDefault();
    d(ui.actions.submitRequest({
      method: 'patch',
      url: '/barber/profile',
      body: { name: userForm.name, email: userForm.email, avatarUrl: userForm.avatarUrl }
    }));
    // Sync localStorage session name
    const current = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...current, name: userForm.name, email: userForm.email }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) {
      d(ui.actions.setMsg({ type: 'error', text: 'Password must be at least 8 characters long.' }));
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      d(ui.actions.setMsg({ type: 'error', text: 'Passwords do not match.' }));
      return;
    }
    try {
      await api.post('/auth/change-password', { newPassword: pwForm.newPassword });
      d(ui.actions.setMsg({ type: 'ok', text: 'Password successfully changed!' }));
      setShowPwModal(false);
      setPwForm({ newPassword: '', confirm: '' });
    } catch (err) {
      d(ui.actions.setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password' }));
    }
  };

  const toggleHoliday = (dayIdx) => {
    const list = shopForm.holidays || [];
    const exists = list.includes(dayIdx);
    const updated = exists ? list.filter((x) => x !== dayIdx) : [...list, dayIdx];
    setShopForm({ ...shopForm, holidays: updated });
  };

  if (loading) {
    return (
      <Shell title="Store & Profile" subtitle="Manage barbershop profile and business settings" links={barberLinks}>
        <div className="card text-center py-12 text-stone-400 text-sm">Loading configuration...</div>
      </Shell>
    );
  }

  return (
    <Shell
      title="Store & Profile Management"
      subtitle="Customize your barbershop details, logo, operating hours, and personal profile"
      links={barberLinks}
    >
      {/* Top Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setTab('store')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'store'
            ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
        >
          <Building className="w-4 h-4" />
          <span>Barbershop Details & Hours</span>
        </button>

        <button
          onClick={() => setTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'profile'
            ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
        >
          <User className="w-4 h-4" />
          <span>Barber Personal Profile</span>
        </button>
      </div>

      {/* Tab 1: Store Configuration */}
      {tab === 'store' && (
        <form onSubmit={saveShop} className="space-y-6 animate-in fade-in duration-150">
          {/* Logo & Identity Preview Card */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-600" />
              <span>Store Brand & Logo</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden shrink-0">
                {shopForm.logoUrl && !logoImgError ? (
                  <img
                    src={shopForm.logoUrl}
                    alt="Store Logo"
                    onError={() => setLogoImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-stone-400">
                    <Scissors className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px] block">No logo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-1.5">
                <label className="text-xs font-semibold text-stone-600">Logo Image URL</label>
                <input
                  type="url"
                  className="inp"
                  placeholder="https://example.com/logo.png"
                  value={shopForm.logoUrl}
                  onChange={(e) => {
                    setLogoImgError(false);
                    setShopForm({ ...shopForm, logoUrl: e.target.value });
                  }}
                />
                <p className="text-[11px] text-stone-500">
                  Provide a direct web image link (PNG, JPG, SVG). Displayed on your public booking page.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Store Info */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-600" />
              <span>General Store Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Shop Name *</label>
                <input
                  className="inp"
                  required
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Owner Name *</label>
                <input
                  className="inp"
                  required
                  value={shopForm.ownerName}
                  onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Shop Code (Unique ID)</label>
                <input
                  className="inp bg-stone-100 text-stone-500 font-mono"
                  readOnly
                  disabled
                  value={shopForm.shopCode || ''}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Store Contact Mobile *</label>
                <input
                  className="inp"
                  required
                  value={shopForm.mobile}
                  onChange={(e) => setShopForm({ ...shopForm, mobile: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Store Email</label>
                <input
                  className="inp"
                  type="email"
                  value={shopForm.email}
                  onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">City</label>
                <input
                  className="inp"
                  value={shopForm.city}
                  onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-stone-600">Full Store Address</label>
                <input
                  className="inp"
                  placeholder="e.g. Shop 4, High Street Road, Near Metro Station"
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-stone-600">Store Tagline / Bio</label>
                <input
                  className="inp"
                  placeholder="e.g. Premium haircuts, beard grooming, and facial spa treatments."
                  value={shopForm.description}
                  onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Operating Hours & Holidays */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Operating Hours & Weekly Offs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Opening Time</label>
                <input
                  type="time"
                  className="inp"
                  value={shopForm.openTime}
                  onChange={(e) => setShopForm({ ...shopForm, openTime: e.target.value })}
                />
                <span className="text-[11px] text-stone-400 block">
                  Current: {fmt(timeToMin(shopForm.openTime))}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Closing Time</label>
                <input
                  type="time"
                  className="inp"
                  value={shopForm.closeTime}
                  onChange={(e) => setShopForm({ ...shopForm, closeTime: e.target.value })}
                />
                <span className="text-[11px] text-stone-400 block">
                  Current: {fmt(timeToMin(shopForm.closeTime))}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 space-y-2">
              <label className="text-xs font-semibold text-stone-600 block">
                Weekly Off Days (Holidays)
              </label>
              <p className="text-[11px] text-stone-500">
                Click a day to mark it as closed. Customers will not be able to book on these days.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {DAYS.map((d) => {
                  const isOff = (shopForm.holidays || []).includes(d.idx);
                  return (
                    <button
                      key={d.idx}
                      type="button"
                      onClick={() => toggleHoliday(d.idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${isOff
                        ? 'bg-red-50 text-red-700 border border-red-200 line-through'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                    >
                      {d.label} {isOff ? '(Closed)' : '(Open)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button type="submit" className="btn-brand px-6 py-2.5">
              <Save className="w-4 h-4" />
              <span>Save Store Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Barber Personal Profile */}
      {tab === 'profile' && (
        <form onSubmit={saveUser} className="space-y-6 animate-in fade-in duration-150">
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              <span>Personal Account Information</span>
            </h3>

            <div className="flex items-center gap-4 pb-2 border-b border-stone-100">
              <div className="w-16 h-16 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 border border-stone-800">
                {userForm.avatarUrl ? (
                  <img src={userForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{userForm.name ? userForm.name[0].toUpperCase() : 'B'}</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-base">{userForm.name || 'Barber'}</h4>
                <p className="text-xs text-stone-500 font-mono">{userForm.mobile}</p>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 mt-1 inline-block">
                  Store Owner Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Your Full Name *</label>
                <input
                  className="inp"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Registered Mobile (Login ID)</label>
                <input
                  className="inp bg-stone-100 text-stone-500 font-mono"
                  readOnly
                  disabled
                  value={userForm.mobile}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Personal Email</label>
                <input
                  className="inp"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Avatar Image URL</label>
                <input
                  className="inp"
                  placeholder="https://example.com/avatar.jpg"
                  value={userForm.avatarUrl}
                  onChange={(e) => setUserForm({ ...userForm, avatarUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPwModal(true)}
                className="btn-o text-xs py-2 px-3"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>

              <button type="submit" className="btn-brand px-6 py-2.5">
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Change Password Modal */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handlePasswordChange}
            className="card max-w-sm w-full space-y-4 shadow-float border border-stone-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Update Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPwModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">New Password (min 8 chars) *</label>
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
              <label className="text-xs font-semibold text-stone-600">Confirm New Password *</label>
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

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-o"
                onClick={() => setShowPwModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-brand">
                Save Password
              </button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}

export default function Barber() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="appointments" element={<Appts />} />
      <Route path="store" element={<StoreAndProfile />} />
      <Route
        path="customers"
        element={
          <Shell
            title="Client Directory"
            subtitle="Manage client contact records, visit history, and notes"
            links={barberLinks}
          >
            <Crud
              k="customers"
              url="/barber/customers"
              title="Clients"
              newItemLabel="Register Client"
              fields={[
                { n: 'name', l: 'Full Name', req: 1, placeholder: 'e.g. Amit Sharma' },
                { n: 'mobile', l: 'Mobile Number', req: 1, placeholder: 'e.g. 9876543210' },
                { n: 'email', l: 'Email Address', placeholder: 'client@example.com' },
                { n: 'notes', l: 'Preferences & Notes', placeholder: 'e.g. Prefers fade cut' }
              ]}
              cols={[
                { n: 'name', l: 'Client Name' },
                { n: 'mobile', l: 'Mobile' },
                { n: 'loyaltyPoints', l: 'Loyalty Points' },
                { n: 'notes', l: 'Notes' }
              ]}
            />
          </Shell>
        }
      />
      <Route
        path="services"
        element={
          <Shell
            title="Service Menu & Pricing"
            subtitle="Configure haircut packages, duration, and prices"
            links={barberLinks}
          >
            <Crud
              k="services"
              url="/barber/services"
              title="Services"
              newItemLabel="Add Service"
              fields={[
                { n: 'name', l: 'Service Name', req: 1, placeholder: 'e.g. Fade Cut & Beard Trim' },
                { n: 'price', l: 'Price (₹)', req: 1, t: 'number', placeholder: 'e.g. 300' },
                { n: 'duration', l: 'Duration (Minutes)', req: 1, t: 'number', placeholder: 'e.g. 30' },
                { n: 'description', l: 'Description', placeholder: 'e.g. Includes styling & wash' }
              ]}
              cols={[
                { n: 'name', l: 'Service' },
                { n: 'price', l: 'Price (₹)' },
                { n: 'duration', l: 'Duration (Min)' },
                { n: 'description', l: 'Description' }
              ]}
            />
          </Shell>
        }
      />
    </Routes>
  );
}
