import { useEffect, useState } from 'react'; import { useDispatch, useSelector } from 'react-redux'; import { Routes, Route } from 'react-router-dom';
import Shell from '../components/Shell'; import { Stat } from '../components/Crud'; import { ui } from '../redux/slices';
const links = [{ to: '/admin', label: 'Dashboard' }, { to: '/admin/shops', label: 'Shops' }];
function Dash() {
  const d = useDispatch(); const s = useSelector((x) => x.ui.data.sdash) || {};
  useEffect(() => { d(ui.actions.fetchRequest({ key: 'sdash', url: '/super/dashboard' })); }, []);
  const max = Math.max(1, ...(s.perShop || []).map((p) => p.sales));
  return <Shell title="Platform Dashboard" links={links}><div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <Stat l="Shops" v={s.shops} /><Stat l="Active" v={s.active} /><Stat l="Inactive" v={s.inactive} /><Stat l="Barbers" v={s.barbers} />
    <Stat l="Customers" v={s.customers} /><Stat l="Bookings" v={s.bookings} /><Stat l="Completed" v={s.completed} /><Stat l="Revenue ₹" v={s.totalSales} /></div>
    <div className="card mt-4"><h3 className="font-medium mb-2">Shop-wise sales</h3>{(s.perShop || []).map((p) => <div key={p._id} className="text-sm mb-1"><div className="flex justify-between"><span>{p.name}</span><span>₹{p.sales}</span></div><div className="h-2 bg-stone-100 rounded"><div className="h-2 bg-brand rounded" style={{ width: `${(p.sales / max) * 100}%` }} /></div></div>)}</div></Shell>;
}
function Shops() {
  const d = useDispatch(); const shops = useSelector((x) => x.ui.data.shops) || []; const plans = useSelector((x) => x.ui.data.plans) || []; const [f, setF] = useState({});
  useEffect(() => { d(ui.actions.fetchRequest({ key: 'shops', url: '/super/shops' })); d(ui.actions.fetchRequest({ key: 'plans', url: '/super/plans' })); }, []);
  const R = { key: 'shops', url: '/super/shops' };
  return <Shell title="Barber Shops" links={links}>
    <form className="card grid sm:grid-cols-3 gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); d(ui.actions.submitRequest({ url: '/super/shops', body: f, refresh: R })); setF({}); }}>
      {[['name', 'Store name *'], ['ownerName', 'Owner name *'], ['mobile', 'Mobile *'], ['city', 'City'], ['email', 'Email']].map(([n, l]) => <input key={n} className="inp" placeholder={l} required={l.includes('*')} value={f[n] || ''} onChange={(e) => setF({ ...f, [n]: e.target.value })} />)}
      <select className="inp" value={f.planId || ''} onChange={(e) => setF({ ...f, planId: e.target.value })}><option value="">Free Trial (14 days)</option>{plans.map((p) => <option key={p._id} value={p._id}>{p.name} ₹{p.price}</option>)}</select>
      <button className="btn">Create shop</button></form>
    <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-stone-500"><th>Shop</th><th>Owner</th><th>Mobile</th><th>Code</th><th>Plan</th><th>Status</th><th /></tr></thead><tbody>
      {shops.map((s) => <tr key={s._id} className="border-t"><td className="py-2">{s.name}</td><td>{s.ownerName}</td><td>{s.mobile}</td><td>{s.shopCode}</td><td>{s.planId?.name}</td>
        <td><select value={s.status} className="border rounded p-1" onChange={(e) => d(ui.actions.submitRequest({ method: 'patch', url: `/super/shops/${s._id}`, body: { status: e.target.value }, refresh: R }))}><option>active</option><option>inactive</option><option>suspended</option></select></td>
        <td><button className="btn-o" onClick={() => d(ui.actions.submitRequest({ url: `/super/shops/${s._id}/reset-password` }))}>Reset password</button></td></tr>)}</tbody></table></div></Shell>;
}
export default function Admin() { return <Routes><Route index element={<Dash />} /><Route path="shops" element={<Shops />} /></Routes>; }
