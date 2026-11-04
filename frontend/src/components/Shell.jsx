import { useEffect } from 'react'; import { useDispatch, useSelector } from 'react-redux'; import { NavLink, useNavigate } from 'react-router-dom';
import { auth, ui } from '../redux/slices';
export const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export function Toast() {
  const m = useSelector((s) => s.ui.msg); const d = useDispatch();
  useEffect(() => { if (m) { const t = setTimeout(() => d(ui.actions.setMsg(null)), 6000); return () => clearTimeout(t); } }, [m]);
  return m ? <div className={`fixed top-3 right-3 left-3 sm:left-auto sm:max-w-sm z-50 p-3 rounded-lg text-sm text-white shadow ${m.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{m.text}</div> : null;
}
export default function Shell({ title, links, children }) {
  const d = useDispatch(), nav = useNavigate(), u = useSelector((s) => s.auth.user);
  return (<div className="min-h-screen md:flex">
    <aside className="hidden md:block w-56 bg-stone-900 text-stone-100 p-4 space-y-1">
      <div className="text-xl font-bold mb-4">✂ BarberPro</div>
      {links.map((l) => <NavLink key={l.to} to={l.to} end className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-brand' : 'hover:bg-stone-800'}`}>{l.label}</NavLink>)}
      <button className="text-sm text-stone-400 px-3 pt-6" onClick={() => { d(auth.actions.logout()); nav('/login'); }}>Logout ({u?.name})</button>
    </aside>
    <main className="flex-1 p-4 pb-20 md:pb-4 max-w-5xl"><h1 className="text-2xl font-semibold mb-4">{title}</h1>{children}</main>
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-stone-900 text-white flex justify-around text-xs">
      {links.map((l) => <NavLink key={l.to} to={l.to} end className={({ isActive }) => `py-3 px-2 ${isActive ? 'text-amber-400' : ''}`}>{l.label}</NavLink>)}
      <button className="py-3 px-2" onClick={() => { d(auth.actions.logout()); nav('/login'); }}>Logout</button>
    </nav><Toast /></div>);
}
