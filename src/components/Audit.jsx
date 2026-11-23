import { num, money, when } from '../utils';

const ACT = { INSERT: 'إضافة', UPDATE: 'تعديل', DELETE: 'حذف' };
const TB = { items: 'أصناف', stock_movements: 'حركات', profiles: 'مستخدمين' };

export default function Audit({ audit, items }) {
  const nm = (id) => items.find((i) => i.id === id)?.name || 'صنف محذوف';
  const desc = (a) => {
    const r = a.new_data || a.old_data || {};
    if (a.table_name === 'stock_movements')
      return `${r.kind === 'in' ? 'وارد' : 'بيع'}: ${nm(r.item_id)} × ${num(r.pieces)} @ ${money(r.unit_price)}`;
    if (a.table_name === 'items') {
      const o = a.old_data, w = a.new_data;
      return a.action === 'UPDATE' && o.piece_price !== w.piece_price
        ? `${w.name}: السعر ${money(o.piece_price)} ← ${money(w.piece_price)}` : r.name;
    }
    return `${r.email || ''} (${r.role || ''})`;
  };
  return (
    <div className="card sc"><b>سجل المراجعة (آخر 300 عملية)</b>
      <table style={{ marginTop: 8 }}>
        <thead><tr><th>الوقت</th><th>المستخدم</th><th>القسم</th><th>العملية</th><th>التفاصيل</th></tr></thead>
        <tbody>
          {audit.map((a) => (
            <tr key={a.id}>
              <td>{when(a.at)}</td><td>{a.actor_email || '—'}</td><td>{TB[a.table_name] || a.table_name}</td>
              <td className={a.action === 'DELETE' ? 'out' : ''}>{ACT[a.action]}</td><td>{desc(a)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
