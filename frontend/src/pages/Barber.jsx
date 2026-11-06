import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
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
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
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
  Clock,
  CheckCircle2,
  XCircle,
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
  Save,
  Building,
  KeyRound,
  Store,
  Table,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  X,
  IndianRupee,
  BarChart3,
  PieChart as PieChartIcon,
  UserPlus,
  Repeat,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ExternalLink,
  Trash2,
  MessageCircle,
  Armchair,
  ArmchairIcon,
  Download
} from 'lucide-react';

const barberLinks = [
  { to: '/barber', label: 'Dashboard', icon: HomeIcon },
  { to: '/barber/appointments', label: 'Appointments', icon: Calendar },
  { to: '/barber/customers', label: 'Clients', icon: Users },
  { to: '/barber/services', label: 'Menu & Services', icon: Scissors },
];

const fetchAppts = { key: 'appts', url: '/barber/appointments' };

function useLive() {
  // Real-time socket events & notifications are handled globally by Shell
}

function Home() {
  const d = useDispatch();
  const info = useSelector((x) => x.ui.data.shopinfo);
  const [copied, setCopied] = useState(false);
  const [period, setPeriod] = useState('daily');
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  useLive();
  let sName = info.shop.name;
  const loadDashboard = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/barber/dashboard', { params: { period: p } });
      setDash(res.data);
    } catch (e) {
      console.error('Dashboard load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    d(ui.actions.fetchRequest({ key: 'shopinfo', url: '/barber/shop' }));
  }, [d]);

  useEffect(() => {
    loadDashboard(period);
  }, [period, loadDashboard]);

  // Auto-refresh on notification
  const refreshTrigger = useSelector((x) => x.ui.refreshTrigger);
  useEffect(() => {
    if (refreshTrigger > 0) loadDashboard(period);
  }, [refreshTrigger]);

  const clientPortalUrl = (() => {
    const shopCode = info?.shop?.shopCode;
    if (shopCode) {
      if (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost')) {
        return `${window.location.origin}/s/${shopCode}`;
      }
      if (info?.customerLink && !info.customerLink.includes('localhost')) {
        return info.customerLink;
      }
      return `https://frontend-rho-orpin-73.vercel.app/s/${shopCode}`;
    }
    return info?.customerLink || 'https://frontend-rho-orpin-73.vercel.app/s';
  })();

  const copyLink = () => {
    if (clientPortalUrl) {
      navigator.clipboard.writeText(clientPortalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareOnWhatsApp = () => {
    if (!clientPortalUrl) return;
    const shopName = info?.shop?.name || 'our Salon';
    const text = `💈 *${shopName}* Online Booking\n\nBook your haircut & grooming appointment online 24/7 in seconds! ✂️\n\n👇 Click the link to view services & book your slot:\n${clientPortalUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const s = dash?.summary || {};
  const snap = dash?.todaySnapshot || {};
  const PERIODS = [
    { id: 'daily', label: 'Today' },
    { id: 'weekly', label: 'This Week' },
    { id: 'monthly', label: 'This Month' },
    { id: 'yearly', label: 'This Year' },
  ];
  const PIE_COLORS = ['#d97706', '#0ea5e9', '#8b5cf6', '#10b981'];
  const PAYMENT_LABELS = { cash: '💵 Cash', upi: '📱 UPI', card: '💳 Card', online: '🌐 Online' };


  const downloadBookingQR = () => {
    const qrSvg = document.querySelector('#customer-booking-qr svg');

    if (!qrSvg || !clientPortalUrl) return;

    const storeName = sName;
    const qrContent = qrSvg.innerHTML;

    const posterSvg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         xmlns:xlink="http://www.w3.org/1999/xlink"
         width="900" height="1150" viewBox="0 0 900 1150">

      <rect width="900" height="1150" fill="#F5F0E8"/>

      <rect x="35" y="35" width="830" height="1080"
            rx="35" fill="#FFFFFF"
            stroke="#D6A044" stroke-width="8"/>

      <rect x="55" y="55" width="790" height="1040"
            rx="25" fill="none"
            stroke="#E7C98D" stroke-width="2"/>

      <text x="450" y="145"
            text-anchor="middle"
            font-size="35"
            font-weight="bold"
            letter-spacing="3"
            fill="#A16207">
        BARBERPRO
      </text>

      <text x="450" y="220"
            text-anchor="middle"
            font-size="47"
            font-weight="bold"
            fill="#292524">
        ${escapeXml(storeName)}
      </text>

      <text x="450" y="265"
            text-anchor="middle"
            font-size="21"
            letter-spacing="3"
            fill="#A16207">
        PREMIUM BARBER &amp; SALON
      </text>

      <line x1="160" y1="305" x2="740" y2="305"
            stroke="#D6A044" stroke-width="3"/>

      <text x="450" y="380"
            text-anchor="middle"
            font-size="65"
            font-weight="bold"
            fill="#292524">
        SCAN &amp; BOOK
      </text>

      <text x="450" y="435"
            text-anchor="middle"
            font-size="32"
            font-weight="bold"
            fill="#B7791F">
        YOUR APPOINTMENT
      </text>

      <rect x="195" y="475" width="510" height="510"
            rx="25" fill="#FFFFFF"
            stroke="#E7C98D" stroke-width="4"/>

      <svg x="220" y="500" width="460" height="460"
           viewBox="${qrSvg.getAttribute('viewBox') || '0 0 160 160'}">
        ${qrContent}
      </svg>

      <text x="450" y="1030"
            text-anchor="middle"
            font-size="37"
            font-weight="bold"
            fill="#292524">
        SCAN HERE
      </text>

      <text x="450" y="1070"
            text-anchor="middle"
            font-size="23"
            fill="#57534E">
        Register &amp; Book Your Appointment Online
      </text>

    </svg>
  `;

    const blob = new Blob([posterSvg], {
      type: 'image/svg+xml;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${storeName.replace(/[^a-z0-9]/gi, '-')}-Booking-Poster.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // Escape special XML characters in store name
  const escapeXml = (value) =>
    String(value).replace(/[<>&'"]/g, (char) => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    })[char]);

  return (
    <Shell
      title="Store Dashboard"
      subtitle={info?.shop?.name ? `${info.shop.name} • ${info.shop.shopCode}` : "Business analytics & performance"}
      links={barberLinks}
    // actions={
    //   <button onClick={() => loadDashboard(period)} className="btn-o p-2.5 text-stone-600 hover:text-stone-900" title="Refresh">
    //     <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
    //   </button>
    // }
    >
      {/* Period Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-2xl w-fit">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${period === p.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-stone-500 font-medium">
          {period === 'daily' ? "Today's" : period === 'weekly' ? 'Last 7 Days' : period === 'monthly' ? 'Current Month' : 'Year to Date'}
        </span>
      </div>

      {/* Today's Quick Strip (always visible) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { l: "Today's Bookings", v: snap.todayTotal, icon: CalendarDays, c: 'text-amber-600 bg-amber-50' },
          { l: 'Completed', v: snap.todayCompleted, icon: CheckCircle2, c: 'text-emerald-600 bg-emerald-50' },
          { l: 'Pending Now', v: snap.todayPending, icon: Clock, c: 'text-purple-600 bg-purple-50' },
          { l: 'Cancelled', v: snap.todayCancelled, icon: XCircle, c: 'text-stone-500 bg-stone-100' },
          { l: "Today's Revenue", v: `₹${(snap.todayRevenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee, c: 'text-amber-600 bg-amber-50' },
        ].map((item, i) => (
          <div key={i} className="card p-3 flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${item.c}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-stone-500 font-medium truncate">{item.l}</p>
              <p className="text-sm font-bold text-stone-900 truncate">{item.v ?? '–'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashCard label="Total Appointments" value={s.totalAppointments} icon={CalendarDays} color="amber" />
        <DashCard label="Completed" value={s.completedAppointments} icon={CheckCircle2} color="emerald" />
        <DashCard label="Total Revenue" value={`₹${(s.totalRevenue || 0).toLocaleString('en-IN')}`} icon={IndianRupee} color="amber" isCurrency />
        <DashCard label="Avg. Ticket Size" value={`₹${(s.avgTicketSize || 0).toLocaleString('en-IN')}`} icon={Wallet} color="blue" isCurrency />
        <DashCard label="Registered Clients" value={s.totalCustomers} icon={Users} color="blue" />
        <DashCard label="New Clients" value={s.newCustomers} icon={UserPlus} color="purple" sub={period !== 'daily' ? `in this ${period.replace('ly', '')}` : 'today'} />
        <DashCard label="Online Bookings" value={s.onlineBookings} icon={Activity} color="emerald" />
        <DashCard label="Walk-In Bookings" value={s.walkInBookings} icon={Store} color="stone" />
        {/* <DashCard label="Pending Requests" value={s.pendingAppointments} icon={Clock} color="purple" />
        <DashCard label="Cancelled" value={s.cancelledAppointments} icon={XCircle} color="stone" />
        <DashCard label="Active Services" value={s.totalServices} icon={Scissors} color="amber" />
        <DashCard label="Repeat Client Rate" value={`${s.repeatCustomerRate || 0}%`} icon={Repeat} color="emerald" /> */}
      </div>

      {/* Charts Row 1: Revenue + Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Area Chart */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Revenue Trend
            </h3>
            <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">₹ INR</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dash?.revenueChart || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments Bar Chart */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Appointment Breakdown
            </h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash?.appointmentChart || []} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="completed" name="Completed" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#78716c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Payment Breakdown + Customer Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Method Pie Chart */}
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-600" />
            Payment Methods
          </h3>
          {(dash?.paymentMethodBreakdown || []).length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dash.paymentMethodBreakdown}
                      dataKey="total"
                      nameKey="method"
                      cx="50%" cy="50%"
                      innerRadius={35} outerRadius={65}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {dash.paymentMethodBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '12px' }}
                      formatter={(v, name) => [`₹${Number(v).toLocaleString('en-IN')}`, PAYMENT_LABELS[name] || name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {dash.paymentMethodBreakdown.map((pm, i) => (
                  <div key={pm.method} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="font-medium text-stone-700">{PAYMENT_LABELS[pm.method] || pm.method}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-stone-900">₹{Number(pm.total).toLocaleString('en-IN')}</span>
                      <span className="text-stone-400 ml-1">({pm.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-stone-400 text-xs">No payment data for this period</div>
          )}
        </div>

        {/* Customer Growth Chart */}
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            New Client Registrations
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash?.customerGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '12px' }} formatter={(v) => [v, 'New Clients']} />
                <Bar dataKey="count" name="New Clients" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Services + Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Services */}
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-600" />
            Top Services
          </h3>
          {(dash?.topServices || []).length > 0 ? (
            <div className="space-y-2">
              {dash.topServices.map((svc, i) => {
                const maxCount = dash.topServices[0]?.count || 1;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 truncate max-w-[60%]">{svc.name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-stone-500">{svc.count} bookings</span>
                        <span className="font-bold text-amber-700">₹{Number(svc.revenue).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, (svc.count / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-400 text-xs">No service data for this period</div>
          )}
        </div>

        {/* Recent Appointments */}
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            Recent Appointments
          </h3>
          {(dash?.recentAppointments || []).length > 0 ? (
            <div className="space-y-2">
              {dash.recentAppointments.map((a) => (
                <div key={a._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50/80 border border-stone-100 hover:border-stone-200 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-xs">
                    {a.customerId?.name ? a.customerId.name[0].toUpperCase() : 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-stone-900 text-xs truncate">{a.customerId?.name || 'Walk-In'}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-500">
                      <span>{a.serviceName}</span>
                      <span>•</span>
                      <span>{a.date}</span>
                      <span>•</span>
                      <span className="font-bold text-stone-700">₹{a.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-400 text-xs">No recent appointments</div>
          )}
        </div>
      </div>


      {/* Customer Booking Link Banner with Vercel Link & Direct WhatsApp Share */}
      <div className="card border-amber-200/90 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                Client Booking Portal
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              Share your direct store link on WhatsApp so clients can view your
              services, select stylists, and book appointments 24/7.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">

            {/* Direct Share on WhatsApp Button */}
            <button
              onClick={shareOnWhatsApp}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all shrink-0"
              title="Share link directly to WhatsApp"
            >

              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>

              <span>Share on WhatsApp</span>

            </button>

            {/* Copy Link Button */}
            <button
              onClick={copyLink}
              type="button"
              className="btn-brand text-xs py-2 px-3.5 shrink-0"
              title="Copy link to clipboard"
            >

              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}

              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>

            </button>

            {/* Open Portal Link in New Tab */}
            {clientPortalUrl && (
              <a
                href={clientPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-o text-xs py-2 px-3 shrink-0 text-stone-700 hover:text-stone-900"
                title="Preview live portal in new tab"
              >

                <ExternalLink className="w-3.5 h-3.5" />

                <span className="hidden sm:inline">Preview</span>

              </a>
            )}

          </div>

        </div>

        {/* Booking URL */}
        <div className="bg-white/90 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-800 break-all select-all flex items-center justify-between gap-2 shadow-2xs">

          <span className="truncate">{clientPortalUrl}</span>

          <button
            onClick={copyLink}
            type="button"
            className="text-[11px] text-amber-700 hover:text-amber-800 font-sans font-semibold shrink-0 underline"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>

        </div>

      </div>


      {/* Customer Booking QR Code Section */}
      {clientPortalUrl && (
        <div className="card border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 sm:p-5 shadow-xs">

          <div className="flex flex-col sm:flex-row items-center gap-5">

            {/* QR Code */}
            <div
              id="customer-booking-qr"
              className="p-3 bg-white border-2 border-amber-200 rounded-2xl shadow-sm shrink-0"
            >

              <QRCodeSVG
                value={clientPortalUrl}
                size={160}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#1c1917"
              />

            </div>

            {/* QR Information */}

            <div className="flex-1 text-center sm:text-left space-y-3">

              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">

                <h3 className="font-bold text-stone-900 text-base">
                  Customer Booking QR Code
                </h3>

                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  QR Active
                </span>

              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Let your customers scan this QR code to register, explore
                services, select their favourite barber, and book appointments
                online anytime.
              </p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">

                {/* Download Printable QR Poster */}
                <button
                  type="button"
                  onClick={downloadBookingQR}
                  className="btn-brand text-xs py-2.5 px-4"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Poster</span>
                </button>

                {/* WhatsApp Share */}
                <button
                  type="button"
                  onClick={shareOnWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Booking Link</span>
                </button>

              </div>

              <p className="text-[11px] text-stone-400 pt-1">
                Download · Print · Display at Your Shop
              </p>

            </div>


          </div>

        </div>
      )}

    </Shell>
  );
}

/* Mini dashboard stat card component */
function DashCard({ label, value, icon: Icon, color = 'amber', isCurrency, sub }) {
  const colorMap = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    stone: { bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-200' },
  };
  const c = colorMap[color] || colorMap.amber;
  return (
    <div className={`card card-hover p-3.5 flex items-start justify-between gap-2 border ${c.border}`}>
      <div className="space-y-0.5 min-w-0">
        <p className="text-[11px] font-medium text-stone-500 truncate">{label}</p>
        <p className={`text-lg font-bold tracking-tight text-stone-900 truncate ${isCurrency ? 'tabular-nums' : ''}`}>{value ?? '–'}</p>
        {sub && <p className="text-[10px] text-stone-400">{sub}</p>}
      </div>
      {Icon && (
        <div className={`p-2 rounded-xl shrink-0 ${c.bg} ${c.text}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

function Appts() {
  const d = useDispatch();
  const u = useSelector((s) => s.auth.user);
  const shopData = useSelector((s) => s.ui.data.shopinfo?.shop);
  const activeShop = shopData || u?.shop;
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

  // Walk-in / Manual Booking Form State (Modal)
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientMode, setClientMode] = useState('existing'); // 'existing' | 'new'
  const [walkInCustId, setWalkInCustId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientMobile, setNewClientMobile] = useState('');
  const [walkInServiceIds, setWalkInServiceIds] = useState([]);
  const [walkInDate, setWalkInDate] = useState(new Date().toISOString().slice(0, 10));
  const [walkInStartMin, setWalkInStartMin] = useState(null);
  const [walkInStaff, setWalkInStaff] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

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
        paginate: 'true',
        sort: '-createdAt'
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
        const sorted = [...res.data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setTableData(sorted);
        setTotalCount(sorted.length);
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

  // Auto-refresh when a real-time notification triggers a refresh
  const refreshTrigger = useSelector((x) => x.ui.refreshTrigger);
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadTableData();
      if (viewMode === 'calendar') loadCalendarData();
    }
  }, [refreshTrigger]);

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

  const [sendingReminderId, setSendingReminderId] = useState(null);
  const sendReminder = async (apptId) => {
    try {
      setSendingReminderId(apptId);
      const res = await api.post(`/barber/appointments/${apptId}/send-reminder`);
      d(ui.actions.setMsg({ type: 'ok', text: res.data?.message || '1-Hour WhatsApp reminder sent to client & barber!' }));
      refreshAll();
    } catch (err) {
      d(ui.actions.setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send WhatsApp reminder' }));
    } finally {
      setSendingReminderId(null);
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

  // Fetch remaining available slots for Walk-In booking
  useEffect(() => {
    if (!showAddForm || !walkInDate || walkInServiceIds.length === 0) {
      setAvailableSlots([]);
      setWalkInStartMin(null);
      return;
    }
    let isCancelled = false;
    const fetchRemainingSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await api.get('/barber/slots', {
          params: {
            date: walkInDate,
            serviceIds: walkInServiceIds.join(',')
          },
          skipGlobalLoader: true
        });
        if (!isCancelled) {
          const list = Array.isArray(res.data) ? res.data : [];
          setAvailableSlots(list);

          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const nowMins = now.getHours() * 60 + now.getMinutes();
          const isToday = walkInDate === todayStr;

          // Auto-select first non-past available slot
          const firstValid = list.find((s) => s.available && (!isToday || s.startMin >= nowMins));
          setWalkInStartMin(firstValid ? firstValid.startMin : null);
        }
      } catch {
        if (!isCancelled) {
          setAvailableSlots([]);
          setWalkInStartMin(null);
        }
      } finally {
        if (!isCancelled) setSlotsLoading(false);
      }
    };
    fetchRemainingSlots();
    return () => {
      isCancelled = true;
    };
  }, [showAddForm, walkInDate, walkInServiceIds]);

  // Add Walk-in / Manual Booking
  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    if (clientMode === 'existing' && !walkInCustId) {
      d(ui.actions.setMsg({ type: 'error', text: 'Please select an existing client' }));
      return;
    }
    if (clientMode === 'new') {
      if (!newClientName.trim()) {
        d(ui.actions.setMsg({ type: 'error', text: 'Client Name is mandatory' }));
        return;
      }
      if (!newClientMobile.trim()) {
        d(ui.actions.setMsg({ type: 'error', text: 'Client Mobile Number is mandatory' }));
        return;
      }
    }
    if (walkInServiceIds.length === 0) {
      d(ui.actions.setMsg({ type: 'error', text: 'Please select at least one service' }));
      return;
    }
    if (walkInStartMin === null || walkInStartMin === undefined) {
      d(ui.actions.setMsg({ type: 'error', text: 'Please select an available time slot' }));
      return;
    }

    try {
      const payload = {
        serviceIds: walkInServiceIds,
        serviceId: walkInServiceIds[0],
        date: walkInDate,
        startMin: walkInStartMin,
        staffName: walkInStaff || undefined
      };

      if (clientMode === 'existing') {
        payload.customerId = walkInCustId;
      } else {
        payload.clientName = newClientName.trim();
        payload.clientMobile = newClientMobile.trim();
      }

      const res = await api.post('/barber/appointments', payload);
      d(ui.actions.setMsg({ type: 'ok', text: res.data?.message || 'Walk-in appointment scheduled successfully!' }));
      setShowAddForm(false);
      setWalkInServiceIds([]);
      setWalkInCustId('');
      setNewClientName('');
      setNewClientMobile('');
      setClientMode('existing');
      setWalkInStartMin(null);
      // Immediately refresh customers so new client entry shows up everywhere
      d(ui.actions.fetchRequest({ key: 'customers', url: '/barber/customers' }));
      refreshAll();
    } catch (err) {
      d(ui.actions.setMsg({ type: 'error', text: err.response?.data?.message || 'Booking conflict or error' }));
    }
  };

  return (
    <Shell
      title="Appointment Management"
      subtitle="Comprehensive scheduling, calendar planner."
      links={barberLinks}
      actions={
        <div className="flex items-center gap-2">
          {/* <button
            onClick={() => refreshAll()}
            className="btn-o p-2.5 text-stone-600 hover:text-stone-900"
            title="Refresh Appointments"
          >
            <RefreshCw className="w-4 h-4" />
          </button> */}
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-brand"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      }
    >
      {/* ──────── WALK-IN BOOKING MODAL (WITH REMAINING SLOTS ONLY) ──────── */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setShowAddForm(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200/90 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                  <Scissors className="w-5 h-5 rotate-45" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">New Booking</h3>
                  <p className="text-xs text-stone-500">
                    Schedule client with real-time remaining time slots
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleAddWalkIn} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Client selection & New Client Entry */}
                <div className="space-y-2 sm:col-span-2 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>Client Details <span className="text-red-500">*</span></span>
                    </span>
                    <div className="flex items-center bg-stone-200/80 p-0.5 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setClientMode('existing')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all ${clientMode === 'existing'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                          }`}
                      >
                        Existing Client
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientMode('new')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all ${clientMode === 'new'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                          }`}
                      >
                        + New Client
                      </button>
                    </div>
                  </div>

                  {clientMode === 'existing' ? (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pb-0.5">
                        <span>Choose from registered clients ({custs.length})</span>
                        <button
                          type="button"
                          onClick={() => setClientMode('new')}
                          className="text-amber-700 hover:underline font-semibold"
                        >
                          + Enter New Client Instead
                        </button>
                      </div>
                      <select
                        required={clientMode === 'existing'}
                        className="inp bg-white"
                        value={walkInCustId}
                        onChange={(e) => setWalkInCustId(e.target.value)}
                      >
                        <option value="">-- Choose Existing Client --</option>
                        {custs.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.mobile})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pb-0.5">
                        <span>Enter new client details</span>
                        <button
                          type="button"
                          onClick={() => setClientMode('existing')}
                          className="text-stone-500 hover:text-stone-800 font-medium"
                        >
                          Select Existing
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                            Client Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required={clientMode === 'new'}
                            placeholder="e.g. Rahul Verma"
                            className="inp bg-white"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                            Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required={clientMode === 'new'}
                            placeholder="e.g. 9876543210"
                            className="inp bg-white"
                            value={newClientMobile}
                            onChange={(e) => setNewClientMobile(e.target.value)}
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    className="inp"
                    value={walkInDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setWalkInDate(e.target.value)}
                  />
                </div>

                {/* Staff */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Stylist / Staff (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Master Barber Alex"
                    className="inp"
                    value={walkInStaff}
                    onChange={(e) => setWalkInStaff(e.target.value)}
                  />
                </div>
              </div>

              {/* Service Selection */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-700">
                    Select Services (Multi-select) <span className="text-red-500">*</span>
                  </label>
                  {selectedWalkInSvcs.length > 0 && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg">
                      {selectedWalkInSvcs.length} selected • ⏱️ {walkInTotalDuration}m • ₹{walkInTotalPrice}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {svcs.map((s) => {
                    const isChecked = walkInServiceIds.includes(s._id);
                    return (
                      <button
                        type="button"
                        key={s._id}
                        onClick={() => toggleWalkInService(s._id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 text-xs ${isChecked
                          ? 'border-amber-600 bg-amber-50/80 text-amber-950 font-bold ring-1 ring-amber-600/50'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                          }`}
                      >
                        <div className="min-w-0">
                          <span className="block truncate text-xs">{s.name}</span>
                          <span className="text-[10px] text-stone-400 font-normal block">
                            ⏱️ {s.duration}m • ₹{s.price}
                          </span>
                        </div>
                        {isChecked && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ──────── SLOTS SELECTOR ──────── */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Time Slot (Start Time) <span className="text-red-500">*</span></span>
                  </label>
                  {(() => {
                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const nowMins = now.getHours() * 60 + now.getMinutes();
                    const isToday = walkInDate === todayStr;
                    const availableCount = availableSlots.filter((s) => s.available && (!isToday || s.startMin >= nowMins)).length;
                    return availableCount > 0 ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {availableCount} available slot{availableCount > 1 ? 's' : ''}
                      </span>
                    ) : null;
                  })()}
                </div>

                {walkInServiceIds.length === 0 ? (
                  <div className="p-4 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-500">
                    👈 Please select at least one service above to compute duration and view time slots.
                  </div>
                ) : slotsLoading ? (
                  <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-2">
                    <RefreshCw className="w-5 h-5 text-amber-600 mx-auto animate-spin" />
                    <p className="text-xs text-stone-500 font-medium">Checking time slots...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center text-xs text-red-700 space-y-1">
                    <p className="font-bold">No slots found for {walkInTotalDuration} mins on {walkInDate}</p>
                    <p className="text-[11px] text-red-600">The shop may be closed or on holiday. Please choose a different date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const now = new Date();
                      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                      const nowMins = now.getHours() * 60 + now.getMinutes();
                      const isToday = walkInDate === todayStr;

                      const isPast = isToday && slot.startMin < nowMins;
                      const isBooked = !slot.available;
                      const disabled = isPast || isBooked;
                      const isSelected = walkInStartMin === slot.startMin;

                      return (
                        <button
                          type="button"
                          key={slot.startMin}
                          disabled={disabled}
                          onClick={() => setWalkInStartMin(slot.startMin)}
                          className={`py-2 px-1.5 rounded-xl text-xs font-semibold border transition-all text-center relative ${disabled
                            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-50 select-none'
                            : isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/30 ring-2 ring-amber-600/30 font-bold'
                              : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 hover:border-amber-500 shadow-xs cursor-pointer'
                            }`}
                        >
                          <span className={disabled ? 'line-through' : ''}>{fmt(slot.startMin)}</span>
                          <span
                            className={`block text-[9px] font-normal ${disabled ? 'text-stone-400 no-underline' : isSelected ? 'text-amber-100' : 'text-stone-400'
                              }`}
                          >
                            {isPast ? 'Past' : isBooked ? 'Booked' : `until ${fmt(slot.endMin)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <div className="text-xs text-stone-500">
                  {walkInStartMin !== null && (
                    <span>
                      Selected Time: <b className="text-stone-900">{fmt(walkInStartMin)} – {fmt(walkInStartMin + walkInTotalDuration)}</b>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-o"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      (clientMode === 'existing' && !walkInCustId) ||
                      (clientMode === 'new' && (!newClientName.trim() || !newClientMobile.trim())) ||
                      walkInServiceIds.length === 0 ||
                      walkInStartMin === null
                    }
                    className="btn-brand disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Confirm (₹{walkInTotalPrice})</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Tabs Header: Table List View vs Calendar View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-stone-200">
        <div className="flex items-center gap-2 p-1 bg-stone-200/70 rounded-2xl w-fit">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${viewMode === 'table'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
              }`}
          >
            <Table className="w-4 h-4 text-amber-600" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${viewMode === 'calendar'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
              }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Calendar View</span>
          </button>
        </div>

        <span className="text-xs font-medium text-stone-500">
          {viewMode === 'table' ? `Total Appointments: ${totalCount}` : `Scheduled Events: ${calendarEvents.length}`}
        </span>
      </div>

      {/* ================= VIEW 1: TABLE VIEW (SERVER-SIDE PAGINATION) ================= */}

      {viewMode === 'table' && (
        <div className="space-y-4 animate-in fade-in duration-150">

          {/* Table Filters & Search Bar - Managed cleanly on screen with NO horizontal scroll */}
          <div className="card p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Search Bar - Flexibly fills available screen space */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by client name, mobile phone, service..."
                  className="inp pl-9 text-xs w-full"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Filter Dropdowns - 3 balanced columns on mobile, inline on desktop, zero horizontal scroll */}
              <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 shrink-0">
                {/* Status Filter */}
                <select
                  className="inp text-xs py-2 px-2.5 sm:w-auto"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  title="Filter by Status"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Date Filter */}
                <select
                  className="inp text-xs py-2 px-2.5 sm:w-auto"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                  title="Filter by Date"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                </select>

                {/* Records Per Page */}
                <select
                  className="inp text-xs py-2 px-2.5 sm:w-auto"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  title="Records per page"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paginated Data Table */}
          <div className="card p-0 overflow-hidden border border-stone-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 text-left">Actions</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Service & Duration</th>
                    <th className="py-3.5 px-4">Date & Slot</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
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
                        <p className="font-semibold text-stone-700 text-sm">
                          No matching appointments found
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          Try resetting filters or scheduling a booking.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    tableData.map((a) => {
                      const duration =
                        a.duration || (a.endMin - a.startMin) || 30;

                      return (
                        <tr
                          key={a._id}
                          className="hover:bg-amber-50/30 transition-colors"
                        >
                          {/* Actions - At Start of Row */}
                          <td className="py-3.5 px-4 text-left whitespace-nowrap">
                            <div className="flex items-center justify-start gap-1.5">
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
                                    <>
                                      <button
                                        onClick={() => setStatus(a._id, 'in_progress')}
                                        className="btn-o text-xs py-1 px-2.5 hover:border-indigo-400 hover:text-indigo-700"
                                        title="Mark in progress (in chair)"
                                      >
                                        <ArmchairIcon className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => sendReminder(a._id)}
                                        disabled={sendingReminderId === a._id}
                                        className={`btn-o text-xs py-1 px-2 transition-colors ${a.reminded1h
                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                                            : 'text-stone-600 hover:text-emerald-700 hover:border-emerald-300'
                                          }`}
                                        title={a.reminded1h ? '1-Hour WhatsApp reminder already sent (click to resend)' : 'Send 1-Hour WhatsApp reminder to client & barber'}
                                      >
                                        {sendingReminderId === a._id ? (
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                        ) : (
                                          <MessageCircle className={`w-3.5 h-3.5 ${a.reminded1h ? 'text-emerald-600' : ''}`} />
                                        )}
                                      </button>
                                    </>
                                  )}

                                  <button
                                    onClick={() => {
                                      setPayMethod('cash');
                                      setBillingTarget(a);
                                    }}
                                    className="btn-brand text-xs py-1 px-2.5"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    {/* <span>Bill</span> */}
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

                          {/* Client */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-xs">
                                {a.customerId?.name
                                  ? a.customerId.name[0].toUpperCase()
                                  : 'C'}
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
                                {a.staffName && (
                                  <span className="text-amber-700 font-medium">
                                    • {a.staffName}
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Date & Slot */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-stone-800 block text-xs">
                              {a.date}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {fmt(a.startMin)} – {fmt(a.endMin)}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-stone-900 block text-xs">
                              ₹{a.price}
                            </span>
                            <span className="text-[10px] text-stone-400 uppercase font-semibold">
                              {a.source === 'online' ? 'Online' : 'Walk-in'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={a.status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Backend Pagination Bar */}
            <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
              <div>
                Showing{' '}
                <span className="font-bold text-stone-900">
                  {totalCount === 0 ? 0 : (page - 1) * limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-stone-900">
                  {Math.min(page * limit, totalCount)}
                </span>{' '}
                of{' '}
                <span className="font-bold text-stone-900">
                  {totalCount}
                </span>{' '}
                appointments
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

                {Array.from(
                  { length: Math.min(5, totalPages) },
                  (_, idx) => {
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
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${page === pNum
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
                          }`}
                      >
                        {pNum}
                      </button>
                    );
                  }
                )}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
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
  const [tab, setTab] = useState('store'); // 'store' | 'profile' | 'password
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

        <button
          type="button"
          onClick={() => {
            setShowPwModal(true);
            setTab('password');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'password'
            ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Change Password</span>
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

            <div className="pt-3 border-t border-stone-100 flex flex-wrap gap-2">


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

/* ═══════════════════════════════════════════════════════════════════════
   CLIENT DIRECTORY PAGE — Register Modal, Paginated Table, Ledger View
   ═══════════════════════════════════════════════════════════════════════ */
function ClientsPage() {
  const d = useDispatch();
  const [clients, setClients] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Modal states
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', mobile: '', email: '', notes: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ledgerClient, setLedgerClient] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch clients (paginated)
  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get('/barber/customers-paginated', {
        params: { page, limit, search: searchDebounced },
        skipGlobalLoader: true
      });
      setClients(res.data.customers || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      d(ui.actions.setMsg({ type: 'error', text: 'Failed to load clients' }));
    }
  }, [page, limit, searchDebounced, d]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Reset page when searching
  useEffect(() => { setPage(1); }, [searchDebounced]);

  // Register new client
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/barber/customers', regForm);
      d(ui.actions.setMsg({ type: 'ok', text: `${regForm.name} registered successfully!` }));
      setRegForm({ name: '', mobile: '', email: '', notes: '' });
      setShowRegister(false);
      fetchClients();
    } catch (err) {
      d(ui.actions.setMsg({ type: 'error', text: err.response?.data?.message || 'Registration failed' }));
    }
  };

  // Delete client
  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/barber/customers/${deleteTarget}`);
      d(ui.actions.setMsg({ type: 'ok', text: 'Client removed successfully' }));
      fetchClients();
    } catch {
      d(ui.actions.setMsg({ type: 'error', text: 'Delete failed' }));
    }
    setDeleteTarget(null);
  };

  // View ledger
  const openLedger = async (clientId) => {
    setLedgerClient(clientId);
    setLedgerLoading(true);
    try {
      const res = await api.get(`/barber/customers/${clientId}/ledger`);
      setLedgerData(res.data);
    } catch {
      d(ui.actions.setMsg({ type: 'error', text: 'Could not load client ledger' }));
      setLedgerClient(null);
    }
    setLedgerLoading(false);
  };

  const closeLedger = () => { setLedgerClient(null); setLedgerData(null); };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';
  const fmtTime = (m) => { if (!m && m !== 0) return '–'; const h = Math.floor(m / 60), mn = m % 60, ap = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(mn).padStart(2, '0')} ${ap}`; };

  const statusColor = (s) => {
    const map = { pending: 'bg-amber-100 text-amber-800', confirmed: 'bg-blue-100 text-blue-800', in_progress: 'bg-indigo-100 text-indigo-800', completed: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-red-100 text-red-800', rejected: 'bg-red-100 text-red-800', no_show: 'bg-purple-100 text-purple-800' };
    return map[s] || 'bg-stone-100 text-stone-700';
  };

  // Pagination range
  const pageRange = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <Shell
      title="Client Directory"
      subtitle="Manage client records, view ledger history & transaction details"
      links={barberLinks}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={fetchClients} className="btn-o p-2.5 text-stone-600 hover:text-stone-900" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowRegister(true)} className="btn-brand">
            <UserPlus className="w-4 h-4" />
            <span>Register Client</span>
          </button>
        </div>
      }
    >
      {/* Search Bar */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              className="inp pl-10 pr-9"
              placeholder="Search by name, mobile, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <span className="text-xs font-medium text-stone-500 shrink-0">
            {total} client{total !== 1 ? 's' : ''} registered
          </span>
        </div>
      </div>

      {/* Clients Table — Desktop */}
      {clients.length === 0 ? (
        <div className="card text-center py-12 px-4 space-y-2">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <p className="font-semibold text-stone-800 text-sm">No clients found</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {search ? `No results for "${search}". Try a different search.` : 'Register your first client to get started.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {clients.map((c) => (
              <div key={c._id} className="card space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {c.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-stone-900 block text-sm truncate">{c.name}</span>
                      <span className="text-xs text-stone-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.mobile}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openLedger(c._id)}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                      title="View Ledger"
                    >
                      <Wallet className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c._id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400 block">Email</span>
                    <span className="font-medium text-stone-800 truncate block">{c.email || '–'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Registered</span>
                    <span className="font-medium text-stone-800">{fmtDate(c.createdAt)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-400 block">Notes</span>
                    <span className="font-medium text-stone-700 line-clamp-1">{c.notes || '–'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50/80 text-stone-500 border-b border-stone-200/80 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {clients.map((c) => (
                    <tr key={c._id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {c.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-semibold text-stone-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{c.mobile}</td>
                      <td className="py-3 px-4 text-stone-600">{c.email || '–'}</td>
                      <td className="py-3 px-4 text-stone-500 text-xs max-w-[160px] truncate">{c.notes || '–'}</td>
                      <td className="py-3 px-4 text-stone-500 text-xs">{fmtDate(c.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openLedger(c._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors"
                            title="View Ledger"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="py-3 px-4 bg-stone-50/50 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
              <span>
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} clients
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pageRange().map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === page
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'hover:bg-stone-200 text-stone-600'
                      }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Pagination */}
          <div className="md:hidden flex items-center justify-between px-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-o text-xs disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs text-stone-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-o text-xs disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* ──────── REGISTER CLIENT MODAL ──────── */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setShowRegister(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-float border border-stone-200/90 z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Register New Client</h3>
                  <p className="text-xs text-stone-500">Add a new client to your directory</p>
                </div>
              </div>
              <button onClick={() => setShowRegister(false)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRegister} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Full Name <span className="text-red-500">*</span></label>
                  <input
                    className="inp"
                    placeholder="e.g. Amit Sharma"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Mobile Number <span className="text-red-500">*</span></label>
                  <input
                    className="inp"
                    placeholder="e.g. 9876543210"
                    required
                    value={regForm.mobile}
                    onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-700">Email Address</label>
                  <input
                    className="inp"
                    type="email"
                    placeholder="client@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-700">Preferences & Notes</label>
                  <textarea
                    className="inp min-h-[72px] resize-none"
                    placeholder="e.g. Prefers fade cut, allergic to specific products"
                    value={regForm.notes}
                    onChange={(e) => setRegForm({ ...regForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button type="button" className="btn-o" onClick={() => setShowRegister(false)}>Cancel</button>
                <button type="submit" className="btn-brand">
                  <UserPlus className="w-4 h-4" />
                  <span>Register Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────── LEDGER VIEW MODAL (SLIDE-OVER) ──────── */}
      {ledgerClient && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={closeLedger} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl z-10 animate-in slide-in-from-right duration-200 flex flex-col overflow-hidden">
            {ledgerLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-amber-600 mx-auto animate-spin" />
                  <p className="text-sm text-stone-500">Loading ledger...</p>
                </div>
              </div>
            ) : ledgerData ? (
              <>
                {/* Ledger Header */}
                <div className="p-5 border-b border-stone-200 bg-stone-50/50 shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                        {ledgerData.customer?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-stone-900 truncate">{ledgerData.customer?.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {ledgerData.customer?.mobile}</span>
                          {ledgerData.customer?.email && <span>{ledgerData.customer.email}</span>}
                        </div>
                        {ledgerData.customer?.notes && (
                          <p className="text-xs text-stone-400 mt-1 line-clamp-1">📝 {ledgerData.customer.notes}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={closeLedger} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Stats Summary Cards */}
                <div className="p-5 border-b border-stone-200 shrink-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-blue-800">{ledgerData.stats?.totalVisits || 0}</p>
                      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Total Visits</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-emerald-800">{ledgerData.stats?.completedVisits || 0}</p>
                      <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Completed</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-amber-800">₹{ledgerData.stats?.totalSpent || 0}</p>
                      <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Total Spent</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-purple-800">₹{ledgerData.stats?.avgSpendPerVisit || 0}</p>
                      <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">Avg / Visit</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-stone-500">
                    <span>Client Since: <b className="text-stone-700">{fmtDate(ledgerData.customer?.createdAt)}</b></span>
                    <span>Last Visit: <b className="text-stone-700">{fmtDate(ledgerData.stats?.lastVisitDate)}</b></span>
                    {(ledgerData.stats?.cancelledCount || 0) > 0 && (
                      <span className="text-red-600">Cancelled: <b>{ledgerData.stats.cancelledCount}</b></span>
                    )}
                  </div>
                </div>

                {/* Scrollable Transactions */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Appointments History */}
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      Appointment History ({ledgerData.appointments?.length || 0})
                    </h4>
                    {(!ledgerData.appointments || ledgerData.appointments.length === 0) ? (
                      <div className="text-center py-6 text-xs text-stone-400 bg-stone-50 rounded-xl">
                        No appointments yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ledgerData.appointments.map((a) => (
                          <div key={a._id} className="border border-stone-200 rounded-xl p-3 hover:bg-stone-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-stone-900 text-sm">{a.serviceName || 'Service'}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(a.status)}`}>
                                    {(a.status || 'unknown').replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-stone-500 flex-wrap">
                                  <span className="flex items-center gap-1">📅 {a.date}</span>
                                  <span className="flex items-center gap-1">⏰ {fmtTime(a.startMin)} – {fmtTime(a.endMin)}</span>
                                  {a.duration && <span>{a.duration}m</span>}
                                  {a.staffName && <span>✂️ {a.staffName}</span>}
                                </div>
                                {a.services && a.services.length > 1 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {a.services.map((s, i) => (
                                      <span key={i} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                                        {s.name} (₹{s.price})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-amber-700 text-sm shrink-0">₹{a.price || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Invoices / Payment History */}
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      Payment History ({ledgerData.invoices?.length || 0})
                    </h4>
                    {(!ledgerData.invoices || ledgerData.invoices.length === 0) ? (
                      <div className="text-center py-6 text-xs text-stone-400 bg-stone-50 rounded-xl">
                        No invoices yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ledgerData.invoices.map((inv) => (
                          <div key={inv._id} className="border border-stone-200 rounded-xl p-3 hover:bg-stone-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {inv.items?.map((it, i) => (
                                    <span key={i} className="text-xs font-medium text-stone-800">{it.name} (₹{it.price})</span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-stone-500 flex-wrap">
                                  <span>📅 {fmtDate(inv.createdAt)}</span>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-semibold uppercase">
                                    {inv.method || 'cash'}
                                  </span>
                                  {inv.discount > 0 && <span className="text-emerald-600">Discount: ₹{inv.discount}</span>}
                                  {inv.taxPct > 0 && <span>Tax: {inv.taxPct}%</span>}
                                </div>
                              </div>
                              <span className="font-bold text-emerald-700 text-sm shrink-0">₹{Math.round(inv.total || 0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ledger Footer */}
                <div className="p-4 border-t border-stone-200 bg-stone-50/50 shrink-0 flex items-center justify-between">
                  <span className="text-xs text-stone-500">Client since {fmtDate(ledgerData.customer?.createdAt)}</span>
                  <button onClick={closeLedger} className="btn-o text-xs">Close</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        type="danger"
        title="Remove Client"
        message="Are you sure you want to remove this client? Their booking history will be preserved."
        confirmText="Yes, Remove"
        cancelText="Cancel"
        onConfirm={executeDelete}
        onClose={() => setDeleteTarget(null)}
      />
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
      <Route path="customers" element={<ClientsPage />} />
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
