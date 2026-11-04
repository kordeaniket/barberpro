import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import Shell from '../components/Shell';
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
  UserCheck
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
  { to: '/admin/shops', label: 'Shops & Tenants', icon: Store }
];

function Dash() {
  const d = useDispatch();
  const s = useSelector((x) => x.ui.data.sdash) || {};

  useEffect(() => {
    d(ui.actions.fetchRequest({ key: 'sdash', url: '/super/dashboard' }));
  }, [d]);

  const max = Math.max(1, ...(s.perShop || []).map((p) => p.sales || 0));

  return (
    <Shell
      title="Platform Overview"
      subtitle="Multi-tenant health metrics and revenue aggregation"
      links={adminLinks}
    >
      {/* Platform Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat l="Total Stores" v={s.shops} icon={Store} color="amber" />
        <Stat l="Active Stores" v={s.active} icon={CheckCircle2} color="emerald" />
        <Stat l="Total Barbers" v={s.barbers} icon={Scissors} color="purple" />
        <Stat l="Total Customers" v={s.customers} icon={Users} color="blue" />
        <Stat l="Total Bookings" v={s.bookings} icon={CalendarCheck} color="stone" />
        <Stat l="Completed Cuts" v={s.completed} icon={CheckCircle2} color="emerald" />
        <Stat l="Platform Revenue" v={`₹${(s.totalSales || 0).toLocaleString()}`} icon={DollarSign} color="amber" />
        <Stat l="Inactive Stores" v={s.inactive} icon={Building2} color="stone" />
      </div>

      {/* Shop-wise Sales Breakdown */}
      <div className="card space-y-4 mt-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Tenant Sales Performance</h2>
              <p className="text-xs text-stone-500">Revenue generated per barber shop</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
            {(s.perShop || []).length} registered shops
          </span>
        </div>

        {(!s.perShop || s.perShop.length === 0) ? (
          <div className="text-center py-8 text-stone-400 text-sm">No sales data recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {s.perShop.map((p) => {
              const pct = Math.min(100, Math.round(((p.sales || 0) / max) * 100));
              return (
                <div key={p._id} className="space-y-1.5 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-stone-800 flex items-center gap-2">
                      <Store className="w-4 h-4 text-stone-400" />
                      <span>{p.name}</span>
                    </span>
                    <span className="font-bold text-stone-900">₹{(p.sales || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
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
                    onClick={() => {
                      if (confirm(`Reset password for ${s.name}? Temporary password will be set.`)) {
                        d(ui.actions.submitRequest({ url: `/super/shops/${s._id}/reset-password` }));
                      }
                    }}
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
                          onClick={() => {
                            if (confirm(`Reset password for ${s.name}? Temporary password will be set.`)) {
                              d(ui.actions.submitRequest({ url: `/super/shops/${s._id}/reset-password` }));
                            }
                          }}
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
