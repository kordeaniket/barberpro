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
  ChevronRight
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
  { to: '/admin/shops', label: 'Shops & Tenants', icon: Store }
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

      {/* ================= METRIC STAT CARDS ================= */}
      {mode === 'platform' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat l="Total Stores" v={stats.shops} icon={Store} color="amber" />
          <Stat l="Active Stores" v={stats.active} icon={CheckCircle2} color="emerald" />
          <Stat l="Platform Revenue" v={`₹${(stats.totalSales || 0).toLocaleString()}`} icon={DollarSign} color="amber" />
          <Stat l="Today's Sales" v={`₹${(stats.todaySales || 0).toLocaleString()}`} icon={TrendingUp} color="emerald" />
          <Stat l="Total Bookings" v={stats.bookings} icon={CalendarCheck} color="stone" />
          <Stat l="Completed Cuts" v={stats.completed} icon={CheckCircle2} color="emerald" />
          <Stat l="Total Barbers" v={stats.barbers} icon={Scissors} color="purple" />
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
      title="Barber Shops & Tenants"
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

export default function Admin() {
  return (
    <Routes>
      <Route index element={<Dash />} />
      <Route path="shops" element={<Shops />} />
    </Routes>
  );
}
