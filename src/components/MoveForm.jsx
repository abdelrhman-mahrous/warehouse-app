import { useState } from 'react';
import { sb } from '../supabase';
import { n, num, money, fmtCt, today } from '../utils';

export default function MoveForm({ items, stock, kind, reload }) {
  const [f, setF] = useState({ id: '', unit: 'piece', qty: '', price: '', note: '' });
  const [err, setErr] = useState('');
  const [b, setB] = useState(false);
  const it = items.find((x) => x.id === (f.id || items[0]?.id));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (!it) return setErr('مفيش أصناف');
    const pieces = n(f.qty) * (f.unit === 'carton' ? it.pieces_per_carton : 1);
    if (pieces <= 0 || !Number.isInteger(pieces)) return setErr('اكتب كمية صحيحة');
    setB(true); setErr('');
    const { error } = await sb.from('stock_movements').insert({
      item_id: it.id, kind, pieces,
      unit_price: f.price === '' ? it.piece_price : n(f.price),
      note: f.note.trim() || null, movement_date: today(),
    });
    setB(false);
    if (error) return setErr(error.message);
    setF({ ...f, qty: '', price: '', note: '' });
    reload();
  };

  return (
    <div className="card">
      <b>{kind === 'out' ? 'تسجيل بيع' : 'استلام بضاعة (وارد)'}</b>
      <div className="g" style={{ marginTop: 10 }}>
        <div><label>الصنف</label>
          <select value={it?.id || ''} onChange={set('id')}>
            {items.map((x) => <option key={x.id} value={x.id}>{x.name}{x.article ? ` — ${x.article}` : ''}</option>)}
          </select></div>
        <div><label>الوحدة</label>
          <select value={f.unit} onChange={set('unit')}>
            <option value="piece">قطعة</option><option value="carton">كرتونة</option>
          </select></div>
        <div><label>الكمية</label><input type="number" min="1" value={f.qty} onChange={set('qty')} /></div>
        <div><label>{kind === 'out' ? 'بعتها بكام (للقطعة)' : 'سعر القطعة'}</label>
          <input type="number" min="0" step="0.01" placeholder={it ? money(it.piece_price) : ''} value={f.price} onChange={set('price')} /></div>
        <div><label>ملاحظة</label><input value={f.note} onChange={set('note')} /></div>
        <div><button className="p" style={{ width: '100%' }} disabled={b} onClick={save}>تسجيل</button></div>
      </div>
      {it && <div className="mu" style={{ marginTop: 8 }}>
        المتاح: {num(stock[it.id] || 0)} قطعة ({fmtCt(stock[it.id] || 0, it.pieces_per_carton)})</div>}
      {err && <div className="err">{err}</div>}
    </div>
  );
}
