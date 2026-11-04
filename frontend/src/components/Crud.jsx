import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ui } from '../redux/slices';
import ConfirmModal from './Modal';
import { Plus, Search, Trash2, X, AlertCircle, Sparkles, Filter } from 'lucide-react';

export function StatusBadge({ status }) {
  const map = {
    pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Pending' },
    confirmed: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Confirmed' },
    in_progress: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', label: 'In Progress' },
    completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
    cancelled: { bg: 'bg-stone-100 text-stone-600 border-stone-200', dot: 'bg-stone-400', label: 'Cancelled' },
    rejected: { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Rejected' },
    no_show: { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', label: 'No Show' },
    active: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
    inactive: { bg: 'bg-stone-100 text-stone-600 border-stone-200', dot: 'bg-stone-400', label: 'Inactive' },
    suspended: { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Suspended' }
  };

  const current = map[status] || {
    bg: 'bg-stone-100 text-stone-700 border-stone-200',
    dot: 'bg-stone-400',
    label: status || 'Unknown'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}

export function Stat({ l, v, icon: Icon, trend, color = 'amber' }) {
  const colorMap = {
    amber: 'from-amber-500 to-amber-600 text-amber-600 bg-amber-50',
    blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50',
    purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
    stone: 'from-stone-600 to-stone-700 text-stone-600 bg-stone-100'
  };

  const activeColor = colorMap[color] || colorMap.amber;

  return (
    <div className="card card-hover flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-medium text-stone-500">{l}</p>
        <p className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">{v ?? '–'}</p>
        {trend && <p className="text-xs text-stone-400">{trend}</p>}
      </div>
      {Icon && (
        <div className={`p-2.5 sm:p-3 rounded-2xl ${activeColor.split(' ').slice(2).join(' ')} shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      )}
    </div>
  );
}

export default function Crud({
  k,
  url,
  fields,
  cols,
  searchKey = 'name',
  title = 'Items',
  newItemLabel = 'Add New'
}) {
  const d = useDispatch();
  const rows = useSelector((s) => s.ui.data[k]) || [];
  const [f, setF] = useState({});
  const [q, setQ] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  useEffect(() => {
    d(ui.actions.fetchRequest({ key: k, url }));
  }, [d, k, url]);

  const save = (e) => {
    e.preventDefault();
    d(ui.actions.submitRequest({ url, body: f, refresh: { key: k, url } }));
    setF({});
    setIsFormOpen(false);
  };

  const executeDelete = () => {
    if (recordToDelete) {
      d(ui.actions.submitRequest({ method: 'delete', url: `${url}/${recordToDelete}`, refresh: { key: k, url } }));
      setRecordToDelete(null);
    }
  };

  const list = rows.filter((r) => {
    if (!q) return true;
    const searchTarget = [r[searchKey], r.mobile, r.email, r.city].filter(Boolean).join(' ').toLowerCase();
    return searchTarget.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Top Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="inp pl-10 pr-9"
            placeholder="Search by name, mobile, etc..."
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

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`btn ${isFormOpen ? 'btn-o' : 'btn-brand'} shrink-0`}
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isFormOpen ? 'Cancel' : newItemLabel}</span>
        </button>
      </div>

      {/* Add New Form (Collapsible Card) */}
      {isFormOpen && (
        <form onSubmit={save} className="card border-amber-200 bg-amber-50/20 p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-amber-100">
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{newItemLabel}</span>
            </h3>
            <span className="text-xs text-stone-500">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fields.map((x) => (
              <div key={x.n} className="space-y-1">
                <label className="text-xs font-medium text-stone-600 block">
                  {x.l} {x.req && <span className="text-red-500">*</span>}
                </label>
                <input
                  className="inp"
                  placeholder={x.placeholder || x.l}
                  required={x.req}
                  type={x.t || 'text'}
                  value={f[x.n] || ''}
                  onChange={(e) => setF({ ...f, [x.n]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-o"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-brand">
              Save Record
            </button>
          </div>
        </form>
      )}

      {/* Data Presentation: Desktop Table + Mobile Cards */}
      {list.length === 0 ? (
        <div className="card text-center py-12 px-4 space-y-2">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <p className="font-semibold text-stone-800 text-sm">No records found</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {q ? `No items matching "${q}". Try clearing the search.` : 'Get started by adding your first record above.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Stack (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {list.map((r) => (
              <div key={r._id} className="card space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                  <div>
                    <span className="font-semibold text-stone-900 block text-base">
                      {String(r[cols[0].n] ?? '–')}
                    </span>
                    {cols[1] && (
                      <span className="text-xs text-stone-500">
                        {cols[1].l}: {String(r[cols[1].n] ?? '–')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setRecordToDelete(r._id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {cols.slice(2).map((c) => (
                    <div key={c.n} className="space-y-0.5">
                      <span className="text-stone-400 block">{c.l}</span>
                      <span className="font-medium text-stone-800">{String(r[c.n] ?? '–')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50/80 text-stone-500 border-b border-stone-200/80 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    {cols.map((c) => (
                      <th key={c.n} className="py-3 px-4">
                        {c.l}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {list.map((r) => (
                    <tr key={r._id} className="hover:bg-stone-50/60 transition-colors">
                      {cols.map((c, i) => (
                        <td
                          key={c.n}
                          className={`py-3.5 px-4 ${
                            i === 0 ? 'font-medium text-stone-900' : 'text-stone-600'
                          }`}
                        >
                          {String(r[c.n] ?? '–')}
                        </td>
                      ))}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setRecordToDelete(r._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="py-2.5 px-4 bg-stone-50/50 border-t border-stone-100 text-xs text-stone-500 flex justify-between items-center">
              <span>Showing {list.length} records</span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(recordToDelete)}
        type="danger"
        title="Remove Record"
        message="Are you sure you want to permanently delete this record? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={executeDelete}
        onClose={() => setRecordToDelete(null)}
      />
    </div>
  );
}
