import { useEffect, useState } from 'react'; import { useDispatch, useSelector } from 'react-redux'; import { ui } from '../redux/slices';
export default function Crud({ k, url, fields, cols, searchKey = 'name' }) {
  const d = useDispatch(); const rows = useSelector((s) => s.ui.data[k]) || []; const [f, setF] = useState({}); const [q, setQ] = useState('');
  useEffect(() => { d(ui.actions.fetchRequest({ key: k, url })); }, []);
  const save = (e) => { e.preventDefault(); d(ui.actions.submitRequest({ url, body: f, refresh: { key: k, url } })); setF({}); };
  const del = (id) => confirm('Remove this record?') && d(ui.actions.submitRequest({ method: 'delete', url: `${url}/${id}`, refresh: { key: k, url } }));
  const list = rows.filter((r) => !q || [r[searchKey], r.mobile].join(' ').toLowerCase().includes(q.toLowerCase()));
  return (<div className="space-y-4">
    <form onSubmit={save} className="card grid sm:grid-cols-4 gap-2">
      {fields.map((x) => <input key={x.n} className="inp" placeholder={x.l + (x.req ? ' *' : '')} required={x.req} type={x.t || 'text'} value={f[x.n] || ''} onChange={(e) => setF({ ...f, [x.n]: e.target.value })} />)}
      <button className="btn">Add</button></form>
    <input className="inp" placeholder="Search by name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
    {list.length === 0 ? <div className="card text-center text-stone-500">Nothing here yet.</div> :
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-stone-500">{cols.map((c) => <th key={c.n} className="py-1 pr-3">{c.l}</th>)}<th /></tr></thead>
        <tbody>{list.map((r) => <tr key={r._id} className="border-t">{cols.map((c) => <td key={c.n} className="py-2 pr-3">{String(r[c.n] ?? '')}</td>)}<td><button className="text-red-600" onClick={() => del(r._id)}>Remove</button></td></tr>)}</tbody></table></div>}
  </div>);
}
export const Stat = ({ l, v }) => <div className="card"><div className="text-xs text-stone-500">{l}</div><div className="text-2xl font-semibold">{v ?? '–'}</div></div>;
