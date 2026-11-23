import { num, money, when, today } from '../utils';

export default function DayList({ items, moves, prof, people, owner, mine }) {
  const d = today();
  const rows = moves.filter((m) => m.movement_date === d && (!mine || m.created_by === prof.id));
  const sold = rows.filter((m) => m.kind === 'out');
  const rev = sold.reduce((s, m) => s + m.pieces * m.unit_price, 0);
  return (
    <div className="card sc">
      <div className="row">
        <b>{mine ? 'مبيعاتي النهاردة' : 'حركات النهاردة'}</b>
        <span className="mu">المبيعات: {num(sold.reduce((s, m) => s + m.pieces, 0))} قطعة — {money(rev)}</span>
      </div>
      <table style={{ marginTop: 8 }}>
        <thead><tr><th>الوقت</th><th>الصنف</th><th>النوع</th><th>القطع</th><th>السعر</th><th>الإجمالي</th>
          {owner && <th>بواسطة</th>}<th>ملاحظة</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="8" className="mu">لسه مفيش حركات.</td></tr>}
          {rows.map((m) => (
            <tr key={m.id}>
              <td>{when(m.created_at)}</td>
              <td>{items.find((i) => i.id === m.item_id)?.name || '—'}</td>
              <td className={m.kind}>{m.kind === 'in' ? 'وارد' : 'بيع'}</td>
              <td>{num(m.pieces)}</td><td>{money(m.unit_price)}</td><td>{money(m.pieces * m.unit_price)}</td>
              {owner && <td>{people[m.created_by] || '—'}</td>}
              <td>{m.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
