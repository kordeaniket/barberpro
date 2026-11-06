import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import api from '../api';
import Shell, { fmt } from '../components/Shell';
import ConfirmModal from '../components/Modal';
import { Stat, StatusBadge } from '../components/Crud';
import { ui } from '../redux/slices';
import {
  LayoutDashboard,
  Store,
  Users,
  Scissors,
  DollarSign,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  Plus,
  KeyRound,
  Search,
  Building2,
  X,
  CreditCard,
  MapPin,
  Phone,
  UserCheck,
  BarChart3,
  PieChart,
  Clock,
  Sparkles,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Award,
  ChevronRight,
  MessageCircle,
  Check,
  XCircle,
  AlertTriangle,
  FileText,
  Mail,
  ExternalLink
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
  { to: '/admin/shops', label: 'Shops', icon: Store },
  { to: '/admin/requests', label: 'Shop Requests', icon: UserCheck }
];

// Reusable Monthly Revenue Bar Chart
function MonthlyRevenueChart({ trend = [], title = 'Monthly Revenue Trend' }) {
  const maxSales = Math.max(1, ...trend.map((m) => m.sales || 0));

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">{title}</h3>
            <p className="text-xs text-stone-500">Last 6 months performance (₹)</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
          6 Months
        </span>
      </div>

      <div className="pt-4 pb-2">
        <div className="h-44 sm:h-52 flex items-end justify-between gap-2 sm:gap-4 px-2">
          {trend.map((m, idx) => {
            const pct = Math.max(6, Math.round(((m.sales || 0) / maxSales) * 100));
            return (
              <div key={m.key || idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                {/* Tooltip on hover */}
                <span className="text-[10px] font-bold text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white py-0.5 px-1.5 rounded-md shadow-xs whitespace-nowrap">
                  ₹{(m.sales || 0).toLocaleString()}
                </span>

                {/* Animated bar */}
                <div className="w-full max-w-[48px] bg-stone-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300 rounded-t-xl transition-all duration-500 shadow-sm"
                    style={{ height: `${pct}%` }}
                  />
                </div>

                {/* X-axis label */}
                <div className="text-center">
                  <span className="text-[11px] font-bold text-stone-700 block leading-tight">
                    {m.label}
                  </span>
                  <span className="text-[9px] text-stone-400 block mt-0.5">
                    {m.count || 0} cuts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Reusable Appointment Status Distribution Chart
function StatusDistributionChart({ stats = {}, title = 'Appointment Status Distribution' }) {
  const total = (stats.completed || 0) + (stats.confirmed || 0) + (stats.pending || 0) + (stats.cancelled || 0) || 1;
  const pCompleted = Math.round(((stats.completed || 0) / total) * 100);
  const pConfirmed = Math.round(((stats.confirmed || 0) / total) * 100);
  const pPending = Math.round(((stats.pending || 0) / total) * 100);
  const pCancelled = Math.round(((stats.cancelled || 0) / total) * 100);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">{title}</h3>
            <p className="text-xs text-stone-500">Breakdown of appointments</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          {stats.completionRate || 0}% Completion Rate
        </span>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="h-3.5 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
          {stats.completed > 0 && (
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${pCompleted}%` }}
              title={`Completed: ${stats.completed} (${pCompleted}%)`}
            />
          )}
          {stats.confirmed > 0 && (
            <div
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${pConfirmed}%` }}
              title={`Confirmed / In Progress: ${stats.confirmed} (${pConfirmed}%)`}
            />
          )}
          {stats.pending > 0 && (
            <div
              className="bg-amber-400 transition-all duration-500"
              style={{ width: `${pPending}%` }}
              title={`Pending: ${stats.pending} (${pPending}%)`}
            />
          )}
          {stats.cancelled > 0 && (
            <div
              className="bg-stone-400 transition-all duration-500"
              style={{ width: `${pCancelled}%` }}
              title={`Cancelled / Rejected: ${stats.cancelled} (${pCancelled}%)`}
            />
          )}
        </div>
      </div>

      {/* 4 Status Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
          <span className="text-[11px] font-semibold text-emerald-800 block">Completed</span>
          <span className="text-lg font-bold text-emerald-950 mt-0.5 block">{stats.completed || 0}</span>
          <span className="text-[10px] text-emerald-700">{pCompleted}% of total</span>
        </div>

        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
          <span className="text-[11px] font-semibold text-blue-800 block">Confirmed & In Chair</span>
          <span className="text-lg font-bold text-blue-950 mt-0.5 block">{stats.confirmed || 0}</span>
          <span className="text-[10px] text-blue-700">{pConfirmed}% of total</span>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
          <span className="text-[11px] font-semibold text-amber-800 block">Pending Requests</span>
          <span className="text-lg font-bold text-amber-950 mt-0.5 block">{stats.pending || 0}</span>
          <span className="text-[10px] text-amber-700">{pPending}% of total</span>
        </div>

        <div className="p-3 rounded-xl bg-stone-100 border border-stone-200">
          <span className="text-[11px] font-semibold text-stone-700 block">Cancelled / No-Show</span>
          <span className="text-lg font-bold text-stone-900 mt-0.5 block">{stats.cancelled || 0}</span>
          <span className="text-[10px] text-stone-500">{pCancelled}% of total</span>
        </div>
      </div>
    </div>
  );
}

function Dash() {
  const [selectedShopId, setSelectedShopId] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch report data according to selected store
  const loadReport = (shopId) => {
    setLoading(true);
    const url = shopId && shopId !== 'all' ? `/super/dashboard?shopId=${shopId}` : '/super/dashboard';
    api
      .get(url)
      .then((res) => {
        setReportData(res.data);
      })
      .catch((err) => {
        console.error('Failed to load superadmin report', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReport(selectedShopId);
  }, [selectedShopId]);

  const allShops = reportData?.allShops || [];
  const mode = reportData?.mode || 'platform';
  const stats = reportData?.stats || {};
  const shop = reportData?.shop;
  const perShop = reportData?.perShop || [];
  const monthlyTrend = reportData?.monthlyTrend || [];
  const topServices = reportData?.topServices || [];
  const recentBookings = reportData?.recentBookings || [];

  const maxShopSales = Math.max(1, ...perShop.map((p) => p.sales || 0));

  return (
    <Shell
      title="Platform Overview & Store Reports"
      subtitle={
        mode === 'store' && shop
          ? `Store Report: ${shop.name} (Code: ${shop.shopCode})`
          : 'Multi-tenant health metrics, store-wise reports & revenue analytics'
      }
      links={adminLinks}
      actions={
        <div className="flex items-center gap-2">
          {/* Header Store Dropdown */}
          <div className="relative">
            <Store className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="inp pl-9 pr-8 text-xs py-2 bg-white font-semibold border-stone-300 shadow-sm rounded-xl cursor-pointer"
              title="Select Store for Report"
            >
              <option value="all">🏢 All Stores (Platform Overview)</option>
              {allShops.map((s) => (
                <option key={s._id} value={s._id}>
                  🏪 {s.name} ({s.shopCode || s.city || 'Store'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadReport(selectedShopId)}
            className="btn-o p-2 text-stone-600 hover:text-stone-900"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      }
    >
      {/* ================= STORE-SPECIFIC CONTEXT BANNER ================= */}
      {mode === 'store' && shop && (
        <div className="card bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/80 p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Store Level Report
                </span>
                <StatusBadge status={shop.status} />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                  Plan: {shop.planName}
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                  Code: {shop.shopCode}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900">{shop.name}</h2>
              <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap pt-0.5">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-stone-400" />
                  <span>Owner: <strong>{shop.ownerName}</strong></span>
                </span>
                {shop.mobile && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{shop.mobile}</span>
                  </span>
                )}
                {shop.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{shop.address ? `${shop.address}, ` : ''}{shop.city}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-amber-800 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hours: {fmt(shop.openMin)} – {fmt(shop.closeMin)}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedShopId('all')}
              className="btn-o self-start sm:self-auto text-xs py-2 px-3.5 shrink-0"
            >
              <span>← View All Stores</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= PENDING SHOP REQUESTS NOTIFICATION ================= */}
      {mode === 'platform' && (stats.pendingShopRequests || 0) > 0 && (
        <div className="card bg-amber-500/10 border-amber-300/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/30 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>{stats.pendingShopRequests} New Shop Registration Request{stats.pendingShopRequests > 1 ? 's' : ''} Pending Review</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Action Required</span>
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Barbers have submitted their shop details. Approve to automatically provision their salon and dispatch WhatsApp login links.
              </p>
            </div>
          </div>
          <a
            href="/admin/requests"
            className="btn-brand text-xs py-2 px-3.5 whitespace-nowrap self-start sm:self-auto shrink-0 shadow-sm"
          >
            Review Requests ({stats.pendingShopRequests})
          </a>
        </div>
      )}

      {/* ================= METRIC STAT CARDS ================= */}
      {mode === 'platform' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat l="Total Stores" v={stats.shops} icon={Store} color="amber" />
          <Stat l="Active Stores" v={stats.active} icon={CheckCircle2} color="emerald" />
          <Stat l="Pending Requests" v={stats.pendingShopRequests || 0} icon={UserCheck} color="amber" />
          <Stat l="Platform Revenue" v={`₹${(stats.totalSales || 0).toLocaleString()}`} icon={DollarSign} color="amber" />
          <Stat l="Today's Sales" v={`₹${(stats.todaySales || 0).toLocaleString()}`} icon={TrendingUp} color="emerald" />
          <Stat l="Total Bookings" v={stats.bookings} icon={CalendarCheck} color="stone" />
          <Stat l="Completed Cuts" v={stats.completed} icon={CheckCircle2} color="emerald" />
          <Stat l="Total Customers" v={stats.customers} icon={Users} color="blue" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat l="Store Revenue" v={`₹${(stats.totalSales || 0).toLocaleString()}`} icon={DollarSign} color="amber" />
          <Stat l="Today's Store Sales" v={`₹${(stats.todaySales || 0).toLocaleString()}`} icon={TrendingUp} color="emerald" />
          <Stat l="Month's Sales" v={`₹${(stats.monthSales || 0).toLocaleString()}`} icon={DollarSign} color="amber" />
          <Stat l="Total Bookings" v={stats.totalBookings} icon={CalendarCheck} color="stone" />
          <Stat l="Completed Cuts" v={stats.completed} icon={CheckCircle2} color="emerald" />
          <Stat l="Registered Clients" v={stats.customers} icon={Users} color="blue" />
          <Stat l="Store Barbers" v={stats.barbers} icon={Scissors} color="purple" />
          <Stat l="Active Menu Services" v={stats.servicesCount} icon={Sparkles} color="stone" />
        </div>
      )}

      {/* ================= CHARTS SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {/* Chart 1: Monthly Revenue Trend */}
        <MonthlyRevenueChart
          trend={monthlyTrend}
          title={mode === 'store' && shop ? `${shop.name} • Monthly Revenue` : 'Platform Monthly Revenue Trend'}
        />

        {/* Chart 2: Appointment Status Distribution */}
        <StatusDistributionChart
          stats={stats}
          title={mode === 'store' && shop ? `${shop.name} • Appointment Distribution` : 'Platform Booking Distribution'}
        />
      </div>

      {/* ================= BOTTOM SECTION: LEADERBOARD OR STORE SERVICES ================= */}
      {mode === 'platform' ? (
        /* Platform Mode: Store Revenue Leaderboard */
        <div className="card space-y-4 mt-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Tenant Sales Performance Leaderboard</h2>
                <p className="text-xs text-stone-500">Click any store to open its detailed report</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
              {perShop.length} stores
            </span>
          </div>

          {perShop.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm">No tenant sales recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {perShop.map((p, idx) => {
                const pct = Math.min(100, Math.round(((p.sales || 0) / maxShopSales) * 100));
                return (
                  <div
                    key={p._id || idx}
                    onClick={() => p._id && setSelectedShopId(p._id)}
                    className="space-y-1.5 p-3 rounded-xl hover:bg-amber-50/50 border border-transparent hover:border-amber-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 font-bold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-stone-900 truncate group-hover:text-amber-800 flex items-center gap-1.5">
                          <span>{p.name || 'Unnamed Store'}</span>
                          {p.code && <span className="text-[10px] text-stone-400 font-mono">({p.code})</span>}
                          {p.city && <span className="text-[10px] text-stone-400">• {p.city}</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-stone-900 text-sm sm:text-base">
                          ₹{(p.sales || 0).toLocaleString()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 transition-colors" />
                      </div>
                    </div>
                    <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Store Mode: Top Services & Recent Appointments Table */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
          {/* Top Services Chart / Leaderboard */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Top Performing Services</h3>
                  <p className="text-xs text-stone-500">Most requested haircut & styling packages</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
                {topServices.length} services
              </span>
            </div>

            {topServices.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">No service bookings recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {topServices.map((svc, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-800">{svc.name}</span>
                      <span className="font-extrabold text-amber-800">₹{(svc.revenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>{svc.count} completed bookings</span>
                      <span>Avg. ₹{svc.count > 0 ? Math.round(svc.revenue / svc.count) : 0}/cut</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Store Bookings Table */}
          <div className="card p-0 overflow-hidden border border-stone-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">Recent Appointments</h3>
              </div>
              <span className="text-[11px] text-stone-500">Last 6 records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-stone-400">
                        No appointments found for this store.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-amber-50/20">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-stone-900 block">{b.customer}</span>
                          {b.mobile && <span className="text-[10px] text-stone-400">{b.mobile}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-stone-800">{b.service}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-stone-600">
                          {b.date} • {b.time}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shops() {
  const d = useDispatch();
  const shops = useSelector((x) => x.ui.data.shops) || [];
  const plans = useSelector((x) => x.ui.data.plans) || [];
  const [f, setF] = useState({});
  const [q, setQ] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [resetShopTarget, setResetShopTarget] = useState(null);

  useEffect(() => {
    d(ui.actions.fetchRequest({ key: 'shops', url: '/super/shops' }));
    d(ui.actions.fetchRequest({ key: 'plans', url: '/super/plans' }));
  }, [d]);

  const R = { key: 'shops', url: '/super/shops' };

  const handleCreate = (e) => {
    e.preventDefault();
    d(ui.actions.submitRequest({ url: '/super/shops', body: f, refresh: R }));
    setF({});
    setShowAddForm(false);
  };

  const filteredShops = shops.filter((s) => {
    if (!q) return true;
    const searchTarget = [s.name, s.ownerName, s.mobile, s.city, s.shopCode].filter(Boolean).join(' ').toLowerCase();
    return searchTarget.includes(q.toLowerCase());
  });

  return (
    <Shell
      title="Barber Shops"
      subtitle="Manage registered barbershops, subscription plans, and credentials"
      links={adminLinks}
      actions={
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-brand"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'Close Form' : 'Register New Shop'}</span>
        </button>
      }
    >
      {/* Create Shop Collapsible Card */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="card border-amber-200 bg-amber-50/20 p-5 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-100">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" />
              <span>Register New Barber Shop</span>
            </h3>
            <span className="text-xs text-stone-500">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Store Name *</label>
              <input
                className="inp"
                placeholder="e.g. Royal Barber Lounge"
                required
                value={f.name || ''}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Owner Name *</label>
              <input
                className="inp"
                placeholder="e.g. Rajesh Kumar"
                required
                value={f.ownerName || ''}
                onChange={(e) => setF({ ...f, ownerName: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Owner Mobile *</label>
              <input
                className="inp"
                placeholder="e.g. 9876543210"
                required
                value={f.mobile || ''}
                onChange={(e) => setF({ ...f, mobile: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">City</label>
              <input
                className="inp"
                placeholder="e.g. Mumbai"
                value={f.city || ''}
                onChange={(e) => setF({ ...f, city: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Owner Email</label>
              <input
                className="inp"
                placeholder="owner@example.com"
                type="email"
                value={f.email || ''}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Subscription Plan</label>
              <select
                className="inp"
                value={f.planId || ''}
                onChange={(e) => setF({ ...f, planId: e.target.value })}
              >
                <option value="">Free Trial (14 days)</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} - ₹{p.price}/mo
                  </option>
                ))}
              </select>
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
              Create & Provision Shop
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          className="inp pl-10 pr-9"
          placeholder="Search by store name, owner, mobile, city, or code..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Responsive Shops Presentation */}
      {filteredShops.length === 0 ? (
        <div className="card text-center py-12 px-4 space-y-2">
          <Store className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="font-semibold text-stone-800 text-sm">No shops found</p>
          <p className="text-xs text-stone-500">
            {q ? 'No results matched your search term.' : 'Click "Register New Shop" to add your first tenant.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (< lg) */}
          <div className="grid grid-cols-1 gap-3.5 lg:hidden">
            {filteredShops.map((s) => (
              <div key={s._id} className="card space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">{s.name}</h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>{s.city || 'Location not set'}</span>
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    {s.shopCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400 block">Owner</span>
                    <span className="font-semibold text-stone-800">{s.ownerName}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Mobile</span>
                    <span className="font-medium text-stone-800">{s.mobile}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Plan</span>
                    <span className="font-semibold text-amber-700">{s.planId?.name || 'Free Trial'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Status</span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <select
                    value={s.status}
                    className="text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                    onChange={(e) =>
                      d(
                        ui.actions.submitRequest({
                          method: 'patch',
                          url: `/super/shops/${s._id}`,
                          body: { status: e.target.value },
                          refresh: R
                        })
                      )
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  <button
                    className="btn-o text-xs py-1.5"
                    onClick={() => setResetShopTarget(s)}
                  >
                    <KeyRound className="w-3 h-3 text-stone-500" />
                    <span>Reset Pass</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= lg) */}
          <div className="hidden lg:block card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50/80 text-stone-500 border-b border-stone-200/80 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Shop Name</th>
                    <th className="py-3.5 px-4">Owner</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Plan</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredShops.map((s) => (
                    <tr key={s._id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{s.name}</div>
                        <div className="text-xs text-stone-400">{s.city || 'No city'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700 font-medium">{s.ownerName}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-stone-800">{s.mobile}</div>
                        {s.email && <div className="text-xs text-stone-400">{s.email}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                          {s.shopCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          {s.planId?.name || 'Free Trial'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={s.status}
                          className="text-xs border border-stone-300 rounded-lg px-2.5 py-1 bg-white font-medium focus:ring-1 focus:ring-amber-500"
                          onChange={(e) =>
                            d(
                              ui.actions.submitRequest({
                                method: 'patch',
                                url: `/super/shops/${s._id}`,
                                body: { status: e.target.value },
                                refresh: R
                              })
                            )
                          }
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          className="btn-o text-xs py-1 px-2.5"
                          onClick={() => setResetShopTarget(s)}
                        >
                          <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                          <span>Reset Password</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="py-2.5 px-4 bg-stone-50/50 border-t border-stone-100 text-xs text-stone-500 flex justify-between items-center">
              <span>Showing {filteredShops.length} shops</span>
            </div>
          </div>
        </>
      )}

      {/* Password Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(resetShopTarget)}
        type="warning"
        title="Reset Password"
        message={
          resetShopTarget
            ? `Are you sure you want to reset password for "${resetShopTarget.name}"? A temporary password will be set and the owner must change it on their next login.`
            : ''
        }
        confirmText="Reset Password"
        cancelText="Cancel"
        onConfirm={() => {
          if (resetShopTarget) {
            d(ui.actions.submitRequest({ url: `/super/shops/${resetShopTarget._id}/reset-password` }));
            setResetShopTarget(null);
          }
        }}
        onClose={() => setResetShopTarget(null)}
      />
    </Shell>
  );
}

function ShopRequests() {
  const d = useDispatch();
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Approval modal state
  const [approveTarget, setApproveTarget] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [approving, setApproving] = useState(false);

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('Shop registration details could not be verified.');
  const [rejecting, setRejecting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, plansRes] = await Promise.all([
        api.get('/super/shop-requests'),
        api.get('/super/plans')
      ]);
      setRequests(reqRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err) {
      d(ui.actions.setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to load shop requests' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      setApproving(true);
      const res = await api.post(`/super/shop-requests/${approveTarget._id}/approve`, {
        planId: selectedPlanId || undefined
      });
      d(ui.actions.setMsg({ type: 'ok', text: res.data?.message || 'Shop approved & WhatsApp notification sent!' }));
      setApproveTarget(null);
      setSelectedPlanId('');
      loadData();
    } catch (err) {
      d(ui.actions.setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to approve shop request' }));
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      setRejecting(true);
      const res = await api.post(`/super/shop-requests/${rejectTarget._id}/reject`, {
        reason: rejectReason
      });
      d(ui.actions.setMsg({ type: 'ok', text: res.data?.message || 'Shop request rejected & WhatsApp notification sent' }));
      setRejectTarget(null);
      setRejectReason('Shop registration details could not be verified.');
      loadData();
    } catch (err) {
      d(ui.actions.setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reject shop request' }));
    } finally {
      setRejecting(false);
    }
  };

  // Counts for tabs
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!q) return true;
    const searchTarget = [r.shopName, r.ownerName, r.mobile, r.city, r.address, r.email]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchTarget.includes(q.toLowerCase());
  });

  return (
    <Shell
      title="Shop Registration Requests"
      subtitle="Review barber registration applications. Approving or rejecting automatically dispatches WhatsApp messages with login URLs & credentials."
      links={adminLinks}
      actions={
        <button
          onClick={loadData}
          className="btn-o p-2 text-stone-600 hover:text-stone-900"
          title="Refresh Requests"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
        </button>
      }
    >
      {/* Top Filter Bar: Status Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl w-fit overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`py-1.5 px-3 rounded-xl transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === 'pending' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`py-1.5 px-3 rounded-xl transition-all ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`py-1.5 px-3 rounded-xl transition-all ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="inp pl-9 pr-8 text-xs py-2 w-full"
            placeholder="Search by shop, owner, mobile, city..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Requests Presentation */}
      {loading ? (
        <div className="card text-center py-16 px-4 space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-stone-700">Loading shop registration requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card text-center py-16 px-4 space-y-2">
          <UserCheck className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-stone-800 text-base">No registration requests found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {q
              ? 'No requests matched your search criteria.'
              : statusFilter === 'pending'
                ? 'There are currently no pending shop requests waiting for review.'
                : 'Barbers can register their shop from the login page, and requests will appear here for your review.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (< lg) */}
          <div className="grid grid-cols-1 gap-3.5 lg:hidden">
            {filteredRequests.map((r) => {
              const isPending = r.status === 'pending';
              const isApproved = r.status === 'approved';
              const isRejected = r.status === 'rejected';

              return (
                <div
                  key={r._id}
                  className={`card space-y-3 border transition-all ${
                    isPending
                      ? 'border-amber-200 bg-amber-50/10'
                      : isApproved
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-stone-200 bg-stone-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                    <div>
                      <h3 className="font-bold text-stone-900 text-base">{r.shopName}</h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>{r.city || 'City not provided'}</span>
                        {r.address && <span className="text-stone-400">• {r.address}</span>}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      isPending
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : isApproved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {isPending ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>Pending</span>
                        </>
                      ) : isApproved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approved</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Rejected</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Owner Name</span>
                      <span className="font-semibold text-stone-800">{r.ownerName}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Owner Mobile</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-stone-900">{r.mobile}</span>
                        <a
                          href={`https://wa.me/91${r.mobile}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          title="Open WhatsApp Chat"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                        <a
                          href={`tel:${r.mobile}`}
                          className="p-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200"
                          title="Call Owner"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {r.email && (
                      <div className="col-span-2">
                        <span className="text-stone-400 block text-[11px]">Email</span>
                        <span className="text-stone-700">{r.email}</span>
                      </div>
                    )}

                    <div className="col-span-2 text-[11px] text-stone-400">
                      <span>Submitted: {new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Rejection Reason display */}
                  {isRejected && r.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-0.5">
                      <span className="font-semibold block text-[11px] uppercase tracking-wider text-rose-900">
                        Rejection Reason:
                      </span>
                      <p>{r.rejectionReason}</p>
                    </div>
                  )}

                  {/* Approved shop details */}
                  {isApproved && r.shopId && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                      <span>Shop Code: <b className="font-mono">{r.shopId.shopCode}</b></span>
                      <a
                        href={`/s/${r.shopId.shopCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Customer Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Actions Bar */}
                  {isPending && (
                    <div className="pt-2.5 border-t border-stone-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setRejectTarget(r);
                          setRejectReason('Shop registration details could not be verified.');
                        }}
                        className="btn-o text-xs py-1.5 px-3 text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => {
                          setApproveTarget(r);
                          setSelectedPlanId('');
                        }}
                        className="btn-brand text-xs py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>= lg) */}
          <div className="hidden lg:block card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50/80 text-stone-500 border-b border-stone-200/80 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Shop & City</th>
                    <th className="py-3.5 px-4">Owner Name</th>
                    <th className="py-3.5 px-4">Mobile & WhatsApp</th>
                    <th className="py-3.5 px-4">Date Applied</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredRequests.map((r) => {
                    const isPending = r.status === 'pending';
                    const isApproved = r.status === 'approved';
                    const isRejected = r.status === 'rejected';

                    return (
                      <tr key={r._id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-stone-900">{r.shopName}</div>
                          <div className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{r.city || 'No city'}</span>
                            {r.address && <span className="truncate max-w-[150px]">• {r.address}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-stone-800">{r.ownerName}</div>
                          {r.email && <div className="text-xs text-stone-400">{r.email}</div>}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{r.mobile}</span>
                            <a
                              href={`https://wa.me/91${r.mobile}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${r.mobile}`}
                              className="p-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-stone-500 whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                            isPending
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : isApproved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
                            {isPending ? (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending</span>
                              </>
                            ) : isApproved ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approved</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Rejected</span>
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setRejectTarget(r);
                                  setRejectReason('Shop registration details could not be verified.');
                                }}
                                className="btn-o text-xs py-1 px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200"
                                title="Reject Request"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>

                              <button
                                onClick={() => {
                                  setApproveTarget(r);
                                  setSelectedPlanId('');
                                }}
                                className="btn-brand text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                title="Approve Shop & Send WhatsApp Login Message"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve & WhatsApp</span>
                              </button>
                            </div>
                          ) : isApproved ? (
                            <span className="text-xs text-stone-500 font-medium">
                              Code: <strong className="font-mono text-stone-800">{r.shopId?.shopCode || 'Active'}</strong>
                            </span>
                          ) : (
                            <span className="text-xs text-rose-500 italic truncate max-w-[150px] inline-block" title={r.rejectionReason}>
                              {r.rejectionReason || 'Rejected'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="py-2.5 px-4 bg-stone-50/50 border-t border-stone-100 text-xs text-stone-500 flex justify-between items-center">
              <span>Showing {filteredRequests.length} requests</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Automated WhatsApp enabled</span>
              </span>
            </div>
          </div>
        </>
      )}

      {/* Approve Shop Modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Approve Shop Registration</h3>
                  <p className="text-xs text-stone-500">Authorize salon and send WhatsApp login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setApproveTarget(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shop Summary */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Shop Name:</span>
                <span className="font-bold text-stone-900">{approveTarget.shopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Owner Name:</span>
                <span className="font-semibold text-stone-800">{approveTarget.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Registered Mobile:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  +91 {approveTarget.mobile}
                </span>
              </div>
              {approveTarget.city && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Location:</span>
                  <span className="text-stone-800">{approveTarget.city}</span>
                </div>
              )}
            </div>

            {/* Subscription Plan Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                Assign Subscription Plan
              </label>
              <select
                className="inp text-xs py-2"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                <option value="">Default Free Trial (14 days)</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} - ₹{p.price}/mo
                  </option>
                ))}
              </select>
            </div>

            {/* WhatsApp Notification Notice */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Instant WhatsApp Message</span>
              </p>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                An automated message will be sent to <b>+91 {approveTarget.mobile}</b> with the Barber Login URL, instructions to log in, and customer booking link.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="btn-o text-xs py-2 px-3.5"
                disabled={approving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="btn-brand text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 flex items-center gap-1.5"
              >
                {approving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Approving & Sending...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Approval & Send WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Shop Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Reject Registration Request</h3>
                  <p className="text-xs text-stone-500">Decline application and notify barber via WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setRejectTarget(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shop Summary */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Shop Name:</span>
                <span className="font-bold text-stone-900">{rejectTarget.shopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Owner Name:</span>
                <span className="font-semibold text-stone-800">{rejectTarget.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Mobile:</span>
                <span className="font-semibold text-stone-800">+91 {rejectTarget.mobile}</span>
              </div>
            </div>

            {/* Rejection Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                Reason for Rejection * (sent to barber via WhatsApp)
              </label>
              <textarea
                className="inp text-xs py-2 min-h-[75px] w-full"
                rows={3}
                placeholder="Explain why the registration was rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />

              {/* Quick Reason Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Incomplete shop details',
                  'Unverifiable phone number',
                  'Duplicate registration',
                  'Outside service coverage'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRejectReason(chip)}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Note */}
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-rose-900">
                <MessageCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>WhatsApp Notification Notice</span>
              </p>
              <p className="text-[11px] text-rose-800/90 leading-relaxed">
                The owner at <b>+91 {rejectTarget.mobile}</b> will receive a direct WhatsApp notification informing them of the rejection and the reason.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="btn-o text-xs py-2 px-3.5"
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
                className="btn-brand text-xs py-2 px-4 bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 flex items-center gap-1.5"
              >
                {rejecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting & Sending...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Reject & Send WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

export default function Admin() {
  return (
    <Routes>
      <Route index element={<Dash />} />
      <Route path="shops" element={<Shops />} />
      <Route path="requests" element={<ShopRequests />} />
    </Routes>
  );
}
