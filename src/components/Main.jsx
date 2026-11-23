import { useCallback, useEffect, useRef, useState } from 'react';
import { sb } from '../supabase';
import { num, money } from '../utils';
import MoveForm from './MoveForm.jsx';
import DayList from './DayList.jsx';
import Stock from './Stock.jsx';
import Report from './Report.jsx';
import Audit from './Audit.jsx';

export default function Main({ prof }) {
  const owner = prof.role === 'owner';
  const [tab, setTab] = useState(owner ? 'live' : 'sell');
  const [items, setItems] = useState([]);
  const [stock, setStock] = useState({});
  const [moves, setMoves] = useState([]);
  const [audit, setAudit] = useState([]);
  const [people, setPeople] = useState({});
  const [flash, setFlash] = useState('');
  const itemsRef = useRef([]);
  itemsRef.current = items;

  const load = useCallback(async () => {
    const q = [
      sb.from('items').select('*').order('name'),
      sb.from('item_stock').select('*'),
      sb.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(3000),
    ];
    if (owner) q.push(
      sb.from('audit_log').select('*').order('at', { ascending: false }).limit(300),
      sb.from('profiles').select('id,full_name,email'),
    );
    const r = await Promise.all(q);
    setItems(r[0].data || []);
    setStock(Object.fromEntries((r[1].data || []).map((s) => [s.item_id, s.on_hand])));
    setMoves(r[2].data || []);
    if (owner) {
      setAudit(r[3].data || []);
      setPeople(Object.fromEntries((r[4].data || []).map((p) => [p.id, p.full_name || p.email])));
    }
  }, [owner]);

  useEffect(() => {
    load();
    const ch = sb.channel('wh').on('postgres_changes', { event: '*', schema: 'public' }, (p) => {
      if (owner && p.table === 'stock_movements' && p.eventType === 'INSERT' && p.new.kind === 'out') {
        const it = itemsRef.current.find((i) => i.id === p.new.item_id);
        setFlash(`🔔 بيع جديد: ${it?.name || 'صنف'} × ${num(p.new.pieces)} قطعة بسعر ${money(p.new.unit_price)}`);
        setTimeout(() => setFlash(''), 8000);
      }
      load();
    }).subscribe();
    const t = setInterval(load, 30000); // تحديث الرصيد عند الموظفين
    return () => { sb.removeChannel(ch); clearInterval(t); };
  }, [load, owner]);

  const tabs = owner
    ? [['live', 'اليوم (لحظي)'], ['stock', 'المخزون والأصناف'], ['report', 'التقرير اليومي'], ['audit', 'سجل المراجعة']]
    : [['sell', 'تسجيل بيع'], ['stock', 'الرصيد']];
  const P = { items, stock, moves, prof, owner, people, audit, reload: load };

  return (
    <div className="w">
      <div className="top">
        <h1>📦 المخزن — {prof.full_name || prof.email} ({owner ? 'أونر' : 'موظف'})</h1>
        <button onClick={() => sb.auth.signOut()}>خروج</button>
      </div>
      {flash && <div className="flash">{flash}</div>}
      <div className="tabs">
        {tabs.map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'sell' && <><MoveForm {...P} kind="out" /><DayList {...P} mine /></>}
      {tab === 'live' && <><MoveForm {...P} kind="out" /><DayList {...P} /></>}
      {tab === 'stock' && <Stock {...P} />}
      {tab === 'report' && <Report {...P} />}
      {tab === 'audit' && <Audit {...P} />}
    </div>
  );
}
