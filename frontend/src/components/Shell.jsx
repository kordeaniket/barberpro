import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { auth, ui } from '../redux/slices';
import {
  Scissors,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const fmt = (m) => {
  if (m === undefined || m === null) return '--:--';
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(min).padStart(2, '0')} ${ampm}`;
};

export function Toast() {
  const m = useSelector((s) => s.ui.msg);
  const d = useDispatch();

  useEffect(() => {
    if (m) {
      const t = setTimeout(() => d(ui.actions.setMsg(null)), 5000);
      return () => clearTimeout(t);
    }
  }, [m, d]);

  if (!m) return null;

  const isErr = m.type === 'error';

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl shadow-float border ${isErr
            ? 'bg-red-50/95 border-red-200 text-red-900 backdrop-blur-sm'
            : 'bg-emerald-50/95 border-emerald-200 text-emerald-900 backdrop-blur-sm'
          }`}
      >
        {isErr ? (
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 text-sm font-medium leading-relaxed">{m.text}</div>
        <button
          onClick={() => d(ui.actions.setMsg(null))}
          className="p-1 rounded-lg hover:bg-black/5 text-stone-500 hover:text-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Shell({ title, links, children, actions, subtitle }) {
  const d = useDispatch();
  const nav = useNavigate();
  const location = useLocation();
  const u = useSelector((s) => s.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    d(auth.actions.logout());
    nav('/login');
  };

  const roleLabel =
    u?.role === 'superadmin' ? 'Super Admin' : u?.role === 'barber' ? 'Barber Store' : 'Customer';

  return (
    <div className="min-h-screen bg-stone-50/70 flex flex-col md:flex-row text-stone-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-200 border-r border-stone-800 select-none">
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-600/30">
              <Scissors className="w-5 h-5 rotate-45" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block leading-none">
                Barber<span className="text-amber-500">Pro</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 mt-1 block">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end !== false}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30 font-semibold'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`
                }
              >
                {Icon && <Icon className="w-4 h-4 shrink-0 opacity-90" />}
                <span className="truncate">{l.label}</span>
                {l.badge && (
                  <span className="ml-auto bg-stone-800 text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">
                    {l.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Card & Logout */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl mb-1">
            <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 font-semibold text-sm shrink-0">
              {u?.name ? u.name[0].toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{u?.name || 'User'}</p>
              <p className="text-[11px] text-stone-400 truncate">{u?.mobile || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md text-white border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white">
            <Scissors className="w-4 h-4 rotate-45" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            Barber<span className="text-amber-500">Pro</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-stone-900 text-white flex flex-col h-full shadow-2xl z-50 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                  <Scissors className="w-4 h-4 rotate-45" />
                </div>
                <div>
                  <span className="font-bold text-base text-white">BarberPro</span>
                  <span className="text-[10px] block text-stone-400 uppercase tracking-wider">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {links.map((l) => {
                const Icon = l.icon;
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end !== false}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-stone-300 hover:bg-stone-800'
                      }`
                    }
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                    <span>{l.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-stone-800 space-y-3">
              <div className="text-xs text-stone-400">
                Logged in as <b className="text-white">{u?.name}</b>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-950/40 text-red-400 text-sm font-medium border border-red-900/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Top Header / Breadcrumb Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-20 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
        </div>

        {/* Page Inner Container */}
        <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">{children}</div>
      </main>

      {/* Mobile Bottom Quick-Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-stone-200 text-stone-600 flex items-center justify-around z-30 py-1.5 px-2 shadow-lg">
        {links.slice(0, 4).map((l) => {
          const Icon = l.icon || Scissors;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end !== false}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${isActive ? 'text-amber-600 font-semibold' : 'text-stone-500 hover:text-stone-900'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{l.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <Toast />
    </div>
  );
}
