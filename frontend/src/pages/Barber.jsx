import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import Shell, { fmt } from '../components/Shell';
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
  Filter
} from 'lucide-react';

const barberLinks = [
  { to: '/barber', label: 'Dashboard', icon: HomeIcon },
  { to: '/barber/appointments', label: 'Appointments', icon: Calendar },
  { to: '/barber/customers', label: 'Clients', icon: Users },
  { to: '/barber/services', label: 'Menu & Services', icon: Scissors }
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

  useLive();

  useEffect(() => {
    d(ui.actions.fetchRequest(fetchAppts));
    d(ui.actions.fetchRequest({ key: 'customers', url: '/barber/customers' }));
    d(ui.actions.fetchRequest({ key: 'services', url: '/barber/services' }));
  }, [d]);

  const setStatus = (id, status) =>
    d(ui.actions.submitRequest({ method: 'patch', url: `/barber/appointments/${id}`, body: { status }, refresh: fetchAppts }));

  const bill = (id) => {
    const method = prompt('Payment method (cash / upi / card / online):', 'cash') || 'cash';
    d(ui.actions.submitRequest({ url: '/barber/invoices', body: { appointmentId: id, method }, refresh: fetchAppts }));
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
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.id
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
                      onClick={() => setStatus(a._id, 'rejected')}
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
                      onClick={() => bill(a._id)}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Complete & Bill</span>
                    </button>
                    <button
                      className="btn-o text-xs py-1.5 px-3"
                      onClick={() => setStatus(a._id, 'no_show')}
                    >
                      <span>No-Show</span>
                    </button>
                    <button
                      className="btn-danger text-xs py-1.5 px-3"
                      onClick={() => setStatus(a._id, 'cancelled')}
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
    </Shell>
  );
}

export default function Barber() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="appointments" element={<Appts />} />
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
