import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  ScheduleComponent,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
  Inject
} from '@syncfusion/ej2-react-schedule';
import '@syncfusion/ej2/tailwind.css';
import api from '../api';
import Shell, { fmt } from '../components/Shell';
import ConfirmModal from '../components/Modal';
import Crud, { Stat, StatusBadge } from '../components/Crud';
import { auth, ui } from '../redux/slices';
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
  Store,
  Table,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw
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
  const custs = useSelector((x) => x.ui.data.customers) || [];
  const svcs = useSelector((x) => x.ui.data.services) || [];

  // Top View Toggle: 'table' | 'calendar'
  const [viewMode, setViewMode] = useState('table');

  // Backend Pagination State for Table View
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar State for Syncfusion Schedule
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedCalAppt, setSelectedCalAppt] = useState(null);

  // Walk-in / Manual Booking Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [walkInCustId, setWalkInCustId] = useState('');
  const [walkInServiceIds, setWalkInServiceIds] = useState([]);
  const [walkInDate, setWalkInDate] = useState(new Date().toISOString().slice(0, 10));
  const [walkInTime, setWalkInTime] = useState('10:00');
  const [walkInStaff, setWalkInStaff] = useState('');

  // Modals
  const [billingTarget, setBillingTarget] = useState(null);
  const [payMethod, setPayMethod] = useState('cash');
  const [statusConfirm, setStatusConfirm] = useState(null);

  useLive();

  // Load clients and services
  useEffect(() => {
    d(ui.actions.fetchRequest({ key: 'customers', url: '/barber/customers' }));
    d(ui.actions.fetchRequest({ key: 'services', url: '/barber/services' }));
  }, [d]);

  // Load backend paginated table data
  const loadTableData = async () => {
    setTableLoading(true);
    try {
      const params = {
        page,
        limit,
        paginate: 'true'
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter === 'today') {
        params.date = new Date().toISOString().slice(0, 10);
      } else if (dateFilter === 'tomorrow') {
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        params.date = tmr.toISOString().slice(0, 10);
      } else if (dateFilter !== 'all' && dateFilter) {
        params.date = dateFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get('/barber/appointments', { params });
      if (res.data && res.data.appointments) {
        setTableData(res.data.appointments);
        setTotalCount(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      } else if (Array.isArray(res.data)) {
        setTableData(res.data);
        setTotalCount(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setTableLoading(false);
    }
  };

  // Load full list for Syncfusion Calendar View
  const loadCalendarData = async () => {
    setCalendarLoading(true);
    try {
      const res = await api.get('/barber/appointments', { params: { calendar: 'true' } });
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.appointments || []);
      
      const mapped = rawList.map((a) => {
        const [y, m, d] = (a.date || new Date().toISOString().slice(0, 10)).split('-').map(Number);
        const sH = Math.floor(a.startMin / 60);
        const sM = a.startMin % 60;
        const eH = Math.floor((a.endMin || a.startMin + (a.duration || 30)) / 60);
        const eM = (a.endMin || a.startMin + (a.duration || 30)) % 60;

        const start = new Date(y, m - 1, d, sH, sM);
        const end = new Date(y, m - 1, d, eH, eM);

        let color = '#d97706'; // amber
        if (a.status === 'completed') color = '#059669'; // emerald
        else if (a.status === 'in_progress') color = '#4f46e5'; // indigo
        else if (a.status === 'pending') color = '#ea580c'; // orange
        else if (['cancelled', 'rejected', 'no_show'].includes(a.status)) color = '#78716c'; // stone

        return {
          Id: a._id,
          Subject: `${a.customerId?.name || 'Walk-in'} • ${a.serviceName}`,
          StartTime: start,
          EndTime: end,
          Description: `Client: ${a.customerId?.name || 'Walk-in'} (${a.customerId?.mobile || 'No mobile'})\nStatus: ${a.status}\nPrice: ₹${a.price}`,
          CategoryColor: color,
          Location: a.staffName ? `Staff: ${a.staffName}` : 'Main Chair',
          Raw: a
        };
      });

      setCalendarEvents(mapped);
    } catch (err) {
      console.error('Failed to load calendar events', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Reload table data when pagination/filters change
  useEffect(() => {
    if (viewMode === 'table') {
      loadTableData();
    }
  }, [page, limit, statusFilter, dateFilter, searchQuery, viewMode]);

  // Reload calendar data when switching to calendar
  useEffect(() => {
    if (viewMode === 'calendar') {
      loadCalendarData();
    }
  }, [viewMode]);

  // Refresh both views
  const refreshAll = () => {
    loadTableData();
    if (viewMode === 'calendar') loadCalendarData();
  };

  // Status changer
  const setStatus = async (id, status) => {
    try {
      await api.patch(`/barber/appointments/${id}`, { status });
      d(ui.actions.setMsg({ type: 'ok', text: `Appointment status updated to ${status}` }));
      refreshAll();
    } catch (e) {
      d(ui.actions.setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to update' }));
    }
  };

  // Invoice / Bill complete
  const confirmBill = async () => {
    if (billingTarget) {
      try {
        const res = await api.post('/barber/invoices', {
          appointmentId: billingTarget._id,
          method: payMethod
        });
        d(ui.actions.setMsg({ type: 'ok', text: res.data.message || 'Invoice generated' }));
        setBillingTarget(null);
        setSelectedCalAppt(null);
        refreshAll();
      } catch (e) {
        d(ui.actions.setMsg({ type: 'error', text: e.response?.data?.message || 'Billing failed' }));
      }
    }
  };

  // Multi-service walk-in calculations
  const selectedWalkInSvcs = svcs.filter((s) => walkInServiceIds.includes(s._id));
  const walkInTotalDuration = selectedWalkInSvcs.reduce((sum, s) => sum + (s.duration || 30), 0);
  const walkInTotalPrice = selectedWalkInSvcs.reduce((sum, s) => sum + (s.price || 0), 0);

  const toggleWalkInService = (id) => {
    setWalkInServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Add Walk-in / Manual Booking
  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInCustId) {
      d(ui.actions.setMsg({ type: 'error', text: 'Please select a client' }));
      return;
    }
    if (walkInServiceIds.length === 0) {
      d(ui.actions.setMsg({ type: 'error', text: 'Please select at least one service' }));
      return;
    }

    const [h, m] = walkInTime.split(':');
    const startMin = parseInt(h, 10) * 60 + parseInt(m, 10);

    try {
      await api.post('/barber/appointments', {
        customerId: walkInCustId,
        serviceIds: walkInServiceIds,
        serviceId: walkInServiceIds[0],
        date: walkInDate,
        startMin,
        staffName: walkInStaff || undefined
      });
      d(ui.actions.setMsg({ type: 'ok', text: 'Walk-in appointment scheduled successfully!' }));
      setShowAddForm(false);
      setWalkInServiceIds([]);
      setWalkInCustId('');
      refreshAll();
    } catch (err) {
      d(ui.actions.setMsg({ type: 'error', text: err.response?.data?.message || 'Booking conflict or error' }));
    }
  };

  return (
    <Shell
      title="Appointment Management"
      subtitle="Comprehensive scheduling, calendar planner & server-side paginated records"
      links={barberLinks}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshAll()}
            className="btn-o p-2.5 text-stone-600 hover:text-stone-900"
            title="Refresh Appointments"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-brand"
          >
            {showAddForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Close Form' : 'New Walk-In Booking'}</span>
          </button>
        </div>
      }
    >
      {/* Walk-in Form Collapsible Card with Multi-Service Selection & Duration Calculation */}
      {showAddForm && (
        <form
          onSubmit={handleAddWalkIn}
          className="card border-amber-200 bg-amber-50/20 p-5 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-100">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Schedule Walk-In / Manual Appointment</span>
            </h3>
            <span className="text-xs text-stone-500">* All fields required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Client selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Client *</label>
              <select
                required
                className="inp"
                value={walkInCustId}
                onChange={(e) => setWalkInCustId(e.target.value)}
              >
                <option value="">Select Client</option>
                {custs.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Date *</label>
              <input
                type="date"
                required
                className="inp"
                value={walkInDate}
                onChange={(e) => setWalkInDate(e.target.value)}
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Start Time *</label>
              <input
                type="time"
                required
                className="inp"
                value={walkInTime}
                onChange={(e) => setWalkInTime(e.target.value)}
              />
            </div>

            {/* Optional Staff */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Assigned Stylist / Staff</label>
              <input
                type="text"
                placeholder="e.g. Master Barber Alex"
                className="inp"
                value={walkInStaff}
                onChange={(e) => setWalkInStaff(e.target.value)}
              />
            </div>
          </div>

          {/* Multi-Service Selector with Duration Calculation */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">
                Select Services (Multi-select) *
              </label>
              {selectedWalkInSvcs.length > 0 && (
                <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-md">
                  {selectedWalkInSvcs.length} selected • ⏱️ {walkInTotalDuration} mins approx • Total: ₹{walkInTotalPrice}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {svcs.map((s) => {
                const isChecked = walkInServiceIds.includes(s._id);
                return (
                  <button
                    type="button"
                    key={s._id}
                    onClick={() => toggleWalkInService(s._id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 text-xs ${
                      isChecked
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-1 ring-amber-600/50'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <span className="block truncate">{s.name}</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        ⏱️ {s.duration}m • ₹{s.price}
                      </span>
                    </div>
                    {isChecked && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-amber-100">
            <button
              type="button"
              className="btn-o"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-brand">
              <span>Schedule Walk-In ({walkInTotalDuration}m • ₹{walkInTotalPrice})</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Tabs Header: Table List View vs Calendar View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-stone-200">
        <div className="flex items-center gap-2 p-1 bg-stone-200/70 rounded-2xl w-fit">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Table className="w-4 h-4 text-amber-600" />
            <span>Table View (Paginated)</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Calendar Planner (Syncfusion)</span>
          </button>
        </div>

        <span className="text-xs font-medium text-stone-500">
          {viewMode === 'table' ? `Total Appointments: ${totalCount}` : `Scheduled Events: ${calendarEvents.length}`}
        </span>
      </div>

      {/* ================= VIEW 1: TABLE VIEW (SERVER-SIDE PAGINATION) ================= */}
      {viewMode === 'table' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Table Filters & Search Bar */}
          <div className="card p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by client name, mobile phone, service..."
                  className="inp pl-9 text-xs"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Status and Date Quick Selectors */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="inp w-auto text-xs py-2 px-3"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed & In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  className="inp w-auto text-xs py-2 px-3"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                </select>

                <select
                  className="inp w-auto text-xs py-2 px-3"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paginated Data Table */}
          <div className="card p-0 overflow-hidden border border-stone-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Service & Duration</th>
                    <th className="py-3.5 px-4">Date & Slot</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {tableLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                        <span>Loading appointments...</span>
                      </td>
                    </tr>
                  ) : tableData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                        <p className="font-semibold text-stone-700 text-sm">No matching appointments found</p>
                        <p className="text-xs text-stone-400 mt-1">Try resetting filters or scheduling a walk-in booking.</p>
                      </td>
                    </tr>
                  ) : (
                    tableData.map((a) => {
                      const duration = a.duration || (a.endMin - a.startMin) || 30;
                      return (
                        <tr key={a._id} className="hover:bg-amber-50/30 transition-colors">
                          {/* Client */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-xs">
                                {a.customerId?.name ? a.customerId.name[0].toUpperCase() : 'C'}
                              </div>
                              <div>
                                <span className="font-bold text-stone-900 block leading-tight">
                                  {a.customerId?.name || 'Walk-In Client'}
                                </span>
                                {a.customerId?.mobile && (
                                  <a
                                    href={`tel:${a.customerId.mobile}`}
                                    className="text-[11px] text-stone-500 hover:text-amber-700 flex items-center gap-1 mt-0.5"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{a.customerId.mobile}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Services & Duration */}
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-semibold text-stone-900 block leading-tight">
                                {a.serviceName}
                              </span>
                              <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-stone-400" />
                                <span>{duration} mins approx</span>
                                {a.staffName && <span className="text-amber-700 font-medium">• {a.staffName}</span>}
                              </span>
                            </div>
                          </td>

                          {/* Date & Slot */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-stone-800 block text-xs">{a.date}</span>
                            <span className="text-[11px] text-stone-500">
                              {fmt(a.startMin)} – {fmt(a.endMin)}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-stone-900 block text-xs">₹{a.price}</span>
                            <span className="text-[10px] text-stone-400 uppercase font-semibold">
                              {a.source === 'online' ? 'Online' : 'Walk-in'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={a.status} />
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {a.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => setStatus(a._id, 'confirmed')}
                                    className="btn-brand text-xs py-1 px-2.5"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      setStatusConfirm({
                                        id: a._id,
                                        status: 'rejected',
                                        label: `reject appointment for ${a.customerId?.name || 'this client'}`,
                                        type: 'danger',
                                        confirmText: 'Reject'
                                      })
                                    }
                                    className="btn-danger text-xs py-1 px-2.5"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {['confirmed', 'in_progress'].includes(a.status) && (
                                <>
                                  {a.status === 'confirmed' && (
                                    <button
                                      onClick={() => setStatus(a._id, 'in_progress')}
                                      className="btn-o text-xs py-1 px-2.5 hover:border-indigo-400 hover:text-indigo-700"
                                      title="Mark in progress (in chair)"
                                    >
                                      <span>In Chair</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setPayMethod('cash');
                                      setBillingTarget(a);
                                    }}
                                    className="btn-brand text-xs py-1 px-2.5"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Bill</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      setStatusConfirm({
                                        id: a._id,
                                        status: 'cancelled',
                                        label: `cancel appointment for ${a.customerId?.name || 'this client'}`,
                                        type: 'danger',
                                        confirmText: 'Cancel'
                                      })
                                    }
                                    className="btn-o text-xs py-1 px-2 text-stone-400 hover:text-red-600 hover:border-red-200"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {a.status === 'completed' && (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Paid</span>
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Backend Pagination Bar */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
              <div>
                Showing{' '}
                <span className="font-bold text-stone-900">
                  {totalCount === 0 ? 0 : (page - 1) * limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-stone-900">
                  {Math.min(page * limit, totalCount)}
                </span>{' '}
                of <span className="font-bold text-stone-900">{totalCount}</span> appointments
              </div>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-o p-1.5 text-xs disabled:opacity-40"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let pNum;
                  if (totalPages <= 5) {
                    pNum = idx + 1;
                  } else if (page <= 3) {
                    pNum = idx + 1;
                  } else if (page >= totalPages - 2) {
                    pNum = totalPages - 4 + idx;
                  } else {
                    pNum = page - 2 + idx;
                  }

                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                        page === pNum
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="btn-o p-1.5 text-xs disabled:opacity-40"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: CALENDAR SCHEDULER (SYNCFUSION) ================= */}
      {viewMode === 'calendar' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="card p-3 sm:p-4 bg-white border border-stone-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  Interactive Salon Appointment Calendar
                </h3>
              </div>

              {/* Status color legends */}
              <div className="flex items-center gap-3 text-[11px] font-medium text-stone-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span>Completed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                  <span>Confirmed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                  <span>In Chair</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                  <span>Pending</span>
                </span>
              </div>
            </div>

            {/* Syncfusion Scheduler Component */}
            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white">
              {calendarLoading ? (
                <div className="p-16 text-center text-stone-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-600" />
                  <p className="text-sm font-semibold text-stone-700">Loading scheduler...</p>
                </div>
              ) : (
                <ScheduleComponent
                  height="650px"
                  selectedDate={new Date()}
                  eventSettings={{
                    dataSource: calendarEvents,
                    fields: {
                      id: 'Id',
                      subject: { name: 'Subject' },
                      startTime: { name: 'StartTime' },
                      endTime: { name: 'EndTime' },
                      description: { name: 'Description' }
                    }
                  }}
                  eventClick={(args) => {
                    if (args.event?.Raw) {
                      setSelectedCalAppt(args.event.Raw);
                    }
                  }}
                  startHour="08:00"
                  endHour="22:00"
                  readonly={false}
                >
                  <Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
                </ScheduleComponent>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Calendar Event Details Modal */}
      {selectedCalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="card max-w-md w-full space-y-4 shadow-float border border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-sm">Appointment Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCalAppt(null)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
                  <span className="text-stone-500">Client Name</span>
                  <span className="font-bold text-stone-900">{selectedCalAppt.customerId?.name || 'Walk-In'}</span>
                </div>
                {selectedCalAppt.customerId?.mobile && (
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Mobile Phone</span>
                    <a href={`tel:${selectedCalAppt.customerId.mobile}`} className="font-bold text-amber-700">
                      {selectedCalAppt.customerId.mobile}
                    </a>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Service(s)</span>
                  <span className="font-bold text-stone-900">{selectedCalAppt.serviceName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Date & Slot</span>
                  <span className="font-bold text-stone-800">
                    {selectedCalAppt.date} ({fmt(selectedCalAppt.startMin)} – {fmt(selectedCalAppt.endMin)})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Duration</span>
                  <span className="font-medium text-stone-700">
                    {selectedCalAppt.duration || (selectedCalAppt.endMin - selectedCalAppt.startMin) || 30} mins
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Current Status</span>
                  <StatusBadge status={selectedCalAppt.status} />
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-stone-200 text-sm">
                  <span className="font-bold text-stone-900">Total Price</span>
                  <span className="font-extrabold text-amber-800 text-base">₹{selectedCalAppt.price}</span>
                </div>
              </div>
            </div>

            {/* Action buttons inside details modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 flex-wrap">
              {selectedCalAppt.status === 'pending' && (
                <button
                  type="button"
                  className="btn-brand text-xs py-2 px-3"
                  onClick={() => {
                    setStatus(selectedCalAppt._id, 'confirmed');
                    setSelectedCalAppt(null);
                  }}
                >
                  Confirm Appointment
                </button>
              )}

              {['confirmed', 'in_progress'].includes(selectedCalAppt.status) && (
                <>
                  <button
                    type="button"
                    className="btn-brand text-xs py-2 px-3"
                    onClick={() => {
                      setPayMethod('cash');
                      setBillingTarget(selectedCalAppt);
                      setSelectedCalAppt(null);
                    }}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Generate Bill</span>
                  </button>
                  <button
                    type="button"
                    className="btn-danger text-xs py-2 px-3"
                    onClick={() => {
                      setStatusConfirm({
                        id: selectedCalAppt._id,
                        status: 'cancelled',
                        label: `cancel appointment for ${selectedCalAppt.customerId?.name || 'this client'}`,
                        type: 'danger',
                        confirmText: 'Cancel Appointment'
                      });
                      setSelectedCalAppt(null);
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}

              <button
                type="button"
                className="btn-o text-xs py-2 px-3"
                onClick={() => setSelectedCalAppt(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                  payMethod === m.id
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
        d(auth.actions.updateUserShop({
          name: s.name,
          logoUrl: s.logoUrl,
          shopCode: s.shopCode
        }));
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
    d(auth.actions.updateUserShop({
      name: shopForm.name,
      logoUrl: shopForm.logoUrl
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
  const d = useDispatch();
  useEffect(() => {
    d(ui.actions.fetchRequest({ key: 'shopinfo', url: '/barber/shop' }));
  }, [d]);

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
