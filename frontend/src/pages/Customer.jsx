import { useEffect, useState } from 'react'; import { useParams, useNavigate } from 'react-router-dom'; import api, { saveSession, clearSession } from '../api'; import { fmt } from '../components/Shell';
const msgOf = (e) => e.response?.data?.message || e.message;
export function ShopPage() {
  const { code } = useParams(); const nav = useNavigate(); const [info, setInfo] = useState(); const [mode, setMode] = useState('register'); const [f, setF] = useState({}); const [err, setErr] = useState('');
  useEffect(() => { api.get('/customer/public/shop/' + code).then((r) => setInfo(r.data)).catch((e) => setErr(msgOf(e))); }, [code]);
  const go = async (e) => { e.preventDefault(); try { const { data } = await api.post(mode === 'register' ? '/auth/register-customer' : '/auth/login', { ...f, shopCode: code }); saveSession(data); localStorage.setItem('shopCode', code); nav('/customer'); } catch (x) { setErr(msgOf(x)); } };
  if (!info) return <div className="p-6 text-center">{err || 'Loading...'}</div>;
  return <div className="min-h-screen grid place-items-center p-4"><form onSubmit={go} className="card w-full max-w-sm space-y-3">
    <h1 className="text-xl font-bold">✂ {info.shop.name}</h1><p className="text-sm text-stone-500">{info.shop.address} {info.shop.city}</p>
    <div className="text-sm">{info.services.map((s) => <div key={s._id} className="flex justify-between"><span>{s.name}</span><span>₹{s.price}</span></div>)}</div>
    {mode === 'register' && <input className="inp" placeholder="Your name *" required onChange={(e) => setF({ ...f, name: e.target.value })} />}
    <input className="inp" placeholder="Mobile *" required onChange={(e) => setF({ ...f, mobile: e.target.value })} /><input className="inp" type="password" placeholder="Password *" required onChange={(e) => setF({ ...f, password: e.target.value })} />
    {err && <div className="text-sm text-red-600">{err}</div>}<button className="btn w-full">{mode === 'register' ? 'Register & book' : 'Login'}</button>
    <button type="button" className="text-sm underline" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Already registered? Login' : 'New here? Register'}</button></form></div>;
}
export default function Customer() {
  const user = JSON.parse(localStorage.getItem('user')); const [svcs, setSvcs] = useState([]); const [bk, setBk] = useState([]); const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10) }); const [slots, setSlots] = useState([]); const [msg, setMsg] = useState(''); const [code, setCode] = useState('');
  const load = () => api.get('/customer/bookings').then((r) => setBk(r.data));
  useEffect(() => { load(); }, []);
  useEffect(() => { // shop code is not in the user record, so read it from the public shop list via the first booking-free path
    const c = localStorage.getItem('shopCode'); if (c) { setCode(c); api.get('/customer/public/shop/' + c).then((r) => setSvcs(r.data.services)); }
  }, []);
  useEffect(() => { if (code && f.serviceId) api.get('/customer/public/slots', { params: { code, serviceId: f.serviceId, date: f.date } }).then((r) => setSlots(r.data)); }, [f.serviceId, f.date, code]);
  const book = async (s) => { try { const { data } = await api.post('/customer/bookings', { serviceId: f.serviceId, date: f.date, startMin: s.startMin }); setMsg(data.message); load(); setSlots([]); } catch (e) { setMsg(msgOf(e)); } };
  const cancel = async (id) => { await api.patch(`/customer/bookings/${id}/cancel`); load(); };
  return <div className="max-w-md mx-auto p-4 space-y-4"><div className="flex justify-between"><h1 className="text-xl font-bold">Hi {user?.name}</h1><button className="text-sm underline" onClick={() => { clearSession(); location.href = '/login'; }}>Logout</button></div>
    <div className="card space-y-2"><h2 className="font-medium">Book an appointment</h2>
      <select className="inp" onChange={(e) => setF({ ...f, serviceId: e.target.value })}><option value="">Select service</option>{svcs.map((s) => <option key={s._id} value={s._id}>{s.name} – ₹{s.price} ({s.duration}m)</option>)}</select>
      <input type="date" className="inp" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
      <div className="flex flex-wrap gap-2">{slots.map((s) => <button key={s.startMin} disabled={!s.available} onClick={() => book(s)} className={`px-3 py-1 rounded border text-sm ${s.available ? 'hover:bg-amber-100' : 'opacity-30 line-through'}`}>{fmt(s.startMin)}</button>)}</div>
      {msg && <div className="text-sm text-emerald-700">{msg}</div>}</div>
    <div className="space-y-2"><h2 className="font-medium">My bookings</h2>{bk.length === 0 && <div className="card text-stone-500 text-center text-sm">No bookings yet.</div>}
      {bk.map((b) => <div key={b._id} className="card text-sm flex justify-between"><div>{b.serviceName}<div className="text-stone-500">{b.date} {fmt(b.startMin)} · {b.status}</div></div>{['pending', 'confirmed'].includes(b.status) && <button className="btn-o" onClick={() => cancel(b._id)}>Cancel</button>}</div>)}</div></div>;
}
