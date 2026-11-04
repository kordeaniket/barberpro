import { useState } from 'react'; import { useDispatch } from 'react-redux'; import api from '../api'; import { auth } from '../redux/slices';
export default function ChangePassword() {
  const d = useDispatch(); const [p, setP] = useState(''); const [e, setE] = useState('');
  const go = async (ev) => { ev.preventDefault(); try { await api.post('/auth/change-password', { newPassword: p }); const u = JSON.parse(localStorage.getItem('user')); u.mustChangePassword = false; localStorage.setItem('user', JSON.stringify(u)); d(auth.actions.passwordChanged()); } catch (x) { setE(x.response?.data?.message || 'Failed'); } };
  return <div className="min-h-screen grid place-items-center p-4"><form onSubmit={go} className="card w-full max-w-sm space-y-3"><h2 className="text-xl font-semibold">Set a new password</h2><p className="text-sm text-stone-500">Required on first login (min 8 characters).</p><input className="inp" type="password" value={p} onChange={(x) => setP(x.target.value)} required minLength={8} />{e && <div className="text-sm text-red-600">{e}</div>}<button className="btn w-full">Save</button></form></div>;
}
