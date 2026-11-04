import { useEffect, useState } from 'react'; import { useDispatch, useSelector } from 'react-redux'; import { Routes, Route } from 'react-router-dom'; import { io } from 'socket.io-client';
import Shell, { fmt } from '../components/Shell'; import Crud, { Stat } from '../components/Crud'; import { ui } from '../redux/slices';
const links = [{ to: '/barber', label: 'Home' }, { to: '/barber/appointments', label: 'Bookings' }, { to: '/barber/customers', label: 'Customers' }, { to: '/barber/services', label: 'Services' }];
const fetchAppts = { key: 'appts', url: '/barber/appointments' };
function useLive() {
  const d = useDispatch();
  useEffect(() => {
    const s = io({ auth: { token: localStorage.getItem('token') } });
    const ping = (t) => () => { d(ui.actions.setMsg({ type: 'ok', text: t })); d(ui.actions.fetchRequest(fetchAppts)); d(ui.actions.fetchRequest({ key: 'dash', url: '/barber/dashboard' })); };
    s.on('booking:new', ping('New booking request!')); s.on('booking:cancelled', ping('A booking was cancelled'));
    return () => s.close();
  }, []);
}
function Home() {
  const d = useDispatch(); const s = useSelector((x) => x.ui.data.dash) || {}; const info = useSelector((x) => x.ui.data.shopinfo);
  useLive(); useEffect(() => { d(ui.actions.fetchRequest({ key: 'dash', url: '/barber/dashboard' })); d(ui.actions.fetchRequest({ key: 'shopinfo', url: '/barber/shop' })); }, []);
  return <Shell title="Today" links={links}><div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <Stat l="Bookings today" v={s.total} /><Stat l="Completed" v={s.completed} /><Stat l="Pending requests" v={s.pending} /><Stat l="Cancelled" v={s.cancelled} />
    <Stat l="Today's sales ₹" v={s.todaySales} /><Stat l="Month sales ₹" v={s.monthSales} /><Stat l="Customers" v={s.customers} /></div>
    {info && <div className="card mt-4 text-sm">Share with customers: <b className="break-all">{info.customerLink}</b></div>}</Shell>;
}
function Appts() {
  const d = useDispatch(); const rows = useSelector((x) => x.ui.data.appts) || []; const custs = useSelector((x) => x.ui.data.customers) || []; const svcs = useSelector((x) => x.ui.data.services) || [];
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), time: '10:00' }); useLive();
  useEffect(() => { d(ui.actions.fetchRequest(fetchAppts)); d(ui.actions.fetchRequest({ key: 'customers', url: '/barber/customers' })); d(ui.actions.fetchRequest({ key: 'services', url: '/barber/services' })); }, []);
  const setStatus = (id, status) => d(ui.actions.submitRequest({ method: 'patch', url: `/barber/appointments/${id}`, body: { status }, refresh: fetchAppts }));
  const bill = (id) => d(ui.actions.submitRequest({ url: '/barber/invoices', body: { appointmentId: id, method: prompt('Payment method: cash / upi / card / online', 'cash') || 'cash' }, refresh: fetchAppts }));
  const add = (e) => { e.preventDefault(); const [h, m] = f.time.split(':'); d(ui.actions.submitRequest({ url: '/barber/appointments', body: { customerId: f.customerId, serviceId: f.serviceId, date: f.date, startMin: h * 60 + +m }, refresh: fetchAppts })); };
  return <Shell title="Bookings" links={links}>
    <form onSubmit={add} className="card grid sm:grid-cols-5 gap-2 mb-4">
      <select required className="inp" onChange={(e) => setF({ ...f, customerId: e.target.value })}><option value="">Customer</option>{custs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
      <select required className="inp" onChange={(e) => setF({ ...f, serviceId: e.target.value })}><option value="">Service</option>{svcs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
      <input type="date" className="inp" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /><input type="time" className="inp" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /><button className="btn">Walk-in / manual</button></form>
    <div className="space-y-2">{rows.length === 0 && <div className="card text-center text-stone-500">No bookings yet.</div>}
      {rows.map((a) => <div key={a._id} className="card flex flex-wrap items-center justify-between gap-2 text-sm">
        <div><b>{a.customerId?.name}</b> · {a.serviceName} · ₹{a.price}<div className="text-stone-500">{a.date} {fmt(a.startMin)}–{fmt(a.endMin)} · <span className="font-medium">{a.status}</span></div></div>
        <div className="flex gap-1 flex-wrap">
          {a.status === 'pending' && <><button className="btn" onClick={() => setStatus(a._id, 'confirmed')}>Accept</button><button className="btn-o" onClick={() => setStatus(a._id, 'rejected')}>Reject</button></>}
          {['confirmed', 'in_progress'].includes(a.status) && <><button className="btn" onClick={() => bill(a._id)}>Complete & bill</button><button className="btn-o" onClick={() => setStatus(a._id, 'no_show')}>No-show</button><button className="btn-o" onClick={() => setStatus(a._id, 'cancelled')}>Cancel</button></>}
        </div></div>)}</div></Shell>;
}
export default function Barber() {
  return <Routes><Route index element={<Home />} /><Route path="appointments" element={<Appts />} />
    <Route path="customers" element={<Shell title="Customers" links={links}><Crud k="customers" url="/barber/customers" fields={[{ n: 'name', l: 'Name', req: 1 }, { n: 'mobile', l: 'Mobile', req: 1 }, { n: 'email', l: 'Email' }, { n: 'notes', l: 'Notes' }]} cols={[{ n: 'name', l: 'Name' }, { n: 'mobile', l: 'Mobile' }, { n: 'loyaltyPoints', l: 'Points' }, { n: 'notes', l: 'Notes' }]} /></Shell>} />
    <Route path="services" element={<Shell title="Services" links={links}><Crud k="services" url="/barber/services" fields={[{ n: 'name', l: 'Service', req: 1 }, { n: 'price', l: 'Price ₹', req: 1, t: 'number' }, { n: 'duration', l: 'Minutes', req: 1, t: 'number' }, { n: 'description', l: 'Description' }]} cols={[{ n: 'name', l: 'Service' }, { n: 'price', l: '₹' }, { n: 'duration', l: 'Min' }, { n: 'active', l: 'Active' }]} /></Shell>} /></Routes>;
}
