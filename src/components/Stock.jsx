import { useState } from 'react';
import { sb } from '../supabase';
import { n, num, money, fmtCt } from '../utils';
import MoveForm from './MoveForm.jsx';

const E0 = { name: '', article: '', ppc: '', price: '', cartons: '' };

export default function Stock({ items, stock, owner, reload }) {
  const [f, setF] = useState(E0);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const add = async () => {
    if (!f.name.trim() || !f.article.trim() || n(f.ppc) <= 0) {
      return setErr('اكتب اسم الصنف والـ article وعدد القطع في الكرتونة');
    }
    const { data, error } = await sb.from('items').insert({
      name: f.name.trim(), article: f.article.trim(),
      pieces_per_carton: n(f.ppc), piece_price: n(f.price),
    }).select().single();
    if (error) return setErr(error.message);
    if (n(f.cartons) > 0) {
      const r = await sb.from('stock_movements').insert({
        item_id: data.id, kind: 'in', pieces: n(f.cartons) * n(f.ppc), unit_price: n(f.price), note: 'رصيد أول',
      });
      if (r.error) return setErr(r.error.message);
    }
    setErr(''); setF(E0); reload();
  };
  const price = async (it) => {
    const v = prompt('سعر القطعة الافتراضي:', it.piece_price);
    if (v && !isNaN(v)) { await sb.from('items').update({ piece_price: n(v) }).eq('id', it.id); reload(); }
  };
  const del = async (it) => {
    if (!confirm(`حذف ${it.name}؟`)) return;
    const { error } = await sb.from('items').delete().eq('id', it.id);
    if (error) alert('مينفعش الحذف: الصنف عليه حركات');
    reload();
  };
  const val = items.reduce((s, i) => s + (stock[i.id] || 0) * i.piece_price, 0);

  return (
    <div>
      {owner && <>
        <div className="card"><b>صنف جديد</b>
          <div className="g" style={{ marginTop: 10 }}>
            <div><label>اسم الصنف *</label><input required value={f.name} onChange={set('name')} /></div>
            <div><label>الأرتكل *</label><input required value={f.article} onChange={set('article')} /></div>
            <div><label>قطع/كرتونة *</label><input required type="number" min="1" value={f.ppc} onChange={set('ppc')} /></div>
            <div><label>سعر القطعة</label><input type="number" min="0" step="0.01" value={f.price} onChange={set('price')} /></div>
            <div><label>كراتين واردة</label><input type="number" min="0" value={f.cartons} onChange={set('cartons')} /></div>
            <div><button className="p" style={{ width: '100%' }} onClick={add}>إضافة</button></div>
          </div>
          {err && <div className="err">{err}</div>}
        </div>
        <MoveForm items={items} stock={stock} kind="in" reload={reload} />
      </>}
      <div className="card sc"><b>الرصيد الحالي</b>
        <table style={{ marginTop: 8 }}>
          <thead><tr><th>الصنف</th><th>الأرتكل</th><th>قطع/كرتونة</th><th>سعر القطعة</th><th>المتبقي (قطع)</th><th>المتبقي (كراتين)</th>
            {owner && <><th>القيمة</th><th></th></>}</tr></thead>
          <tbody>
            {items.map((i) => {
              const s = stock[i.id] || 0;
              return (
                <tr key={i.id}>
                  <td>{i.name}</td><td>{i.article || '—'}</td><td>{num(i.pieces_per_carton)}</td>
                  <td>{money(i.piece_price)}{owner && <> <a href="#" style={{ color: 'inherit' }}
                    onClick={(e) => { e.preventDefault(); price(i); }}>✎</a></>}</td>
                  <td>{num(s)}</td><td>{fmtCt(s, i.pieces_per_carton)}</td>
                  {owner && <><td>{money(s * i.piece_price)}</td>
                    <td><button className="d" onClick={() => del(i)}>حذف</button></td></>}
                </tr>
              );
            })}
          </tbody>
          {owner && <tfoot><tr><td colSpan="6">إجمالي قيمة المخزون</td><td colSpan="2">{money(val)}</td></tr></tfoot>}
        </table>
      </div>
    </div>
  );
}
