import { useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '../api';
import { auth } from '../redux/slices';
import { Lock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ChangePassword() {
  const d = useDispatch();
  const [p, setP] = useState('');
  const [confirm, setConfirm] = useState('');
  const [e, setE] = useState('');
  const [loading, setLoading] = useState(false);

  const go = async (ev) => {
    ev.preventDefault();
    setE('');
    if (p.length < 8) {
      setE('Password must be at least 8 characters long.');
      return;
    }
    if (p !== confirm) {
      setE('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { newPassword: p });
      const u = JSON.parse(localStorage.getItem('user'));
      if (u) {
        u.mustChangePassword = false;
        localStorage.setItem('user', JSON.stringify(u));
      }
      d(auth.actions.passwordChanged());
    } catch (x) {
      setE(x.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Set New Password</h2>
          <p className="text-xs sm:text-sm text-stone-400">
            For security, you must update the temporary default password before continuing.
          </p>
        </div>

        <form onSubmit={go} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
              New Password (min 8 chars)
            </label>
            <input
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              type="password"
              placeholder="••••••••"
              value={p}
              onChange={(x) => setP(x.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
              Confirm New Password
            </label>
            <input
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(x) => setConfirm(x.target.value)}
              required
              minLength={8}
            />
          </div>

          {e && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{e}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Saving...' : 'Update Password & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
