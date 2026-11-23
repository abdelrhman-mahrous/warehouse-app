import { useState } from 'react';
import { num, money, fmtCt, today } from '../utils';

export default function Report({ items, moves }) {
  const [d, setD] = useState(today());
  const rows = items.map((i) => {
    let open = 0, inn = 0, out = 0, rev = 0;
    moves.forEach((m) => {
      if (m.item_id !== i.id) return;
      const q = m.kind === 'in' ? m.pieces : -m.pieces;
      if (m.movement_date < d) open += q;
      else if (m.movement_date === d) {
        if (m.kind === 'in') inn += m.pieces; else { out += m.pieces; rev += m.pieces * m.unit_price; }
      }
    });
    return { i, open, inn, out, rev, rem: open + inn - out };
  });
  return (
    <div className="card sc">
      <div className="row"><b>التقرير اليومي</b>
        <div><label>التاريخ</label><input type="date" value={d} onChange={(e) => setD(e.target.value)} /></div></div>
      <table style={{ marginTop: 10 }}>
        <thead><tr><th>الصنف</th><th>رصيد أول اليوم</th><th>الوارد</th><th>المبيع</th><th>المتبقي (قطع)</th><th>المتبقي (كراتين)</th><th>إيراد المبيعات</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.i.id}>
              <td>{r.i.name}</td><td>{num(r.open)}</td>
              <td className="in">{num(r.inn)}</td><td className="out">{num(r.out)}</td>
              <td><b>{num(r.rem)}</b></td><td>{fmtCt(r.rem, r.i.pieces_per_carton)}</td><td>{money(r.rev)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan="6">إجمالي إيراد اليوم</td><td>{money(rows.reduce((s, r) => s + r.rev, 0))}</td></tr></tfoot>
      </table>
    </div>
  );
}
