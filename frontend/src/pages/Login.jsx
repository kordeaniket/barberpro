import { useState } from 'react'; import { useDispatch, useSelector } from 'react-redux'; import { Navigate } from 'react-router-dom'; import { auth } from '../redux/slices';
export default function Login() {
  const d = useDispatch(); const { user, error, busy } = useSelector((s) => s.auth); const [f, setF] = useState({ mobile: '', password: '' });
  if (user) return <Navigate to={user.role === 'superadmin' ? '/admin' : user.role === 'barber' ? '/barber' : '/customer'} />;
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form className="card w-full max-w-sm space-y-3" onSubmit={(e) => { e.preventDefault(); d(auth.actions.loginRequest(f)); }}>
        <h1 className="text-2xl font-bold">✂ BarberPro</h1>
        <p className="text-sm text-stone-500">Login with registered mobile number or email</p>
        <input className="inp" placeholder="Mobile / Email" value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} required />
        <input className="inp" type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</div>}
        <button className="btn w-full" disabled={busy}>{busy ? '...' : 'Login'}</button>
        <div className="pt-2 border-t border-stone-200 text-xs text-stone-500 space-y-1">
          <p className="font-semibold text-stone-700">Demo Accounts (click to fill):</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setF({ mobile: '8806689125', password: 'password' })} className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800">
              👑 Super Admin
            </button>
            <button type="button" onClick={() => setF({ mobile: '9999999991', password: 'barber123' })} className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800">
              💈 Barber
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
