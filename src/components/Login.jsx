import { useState } from 'react';
import { sb } from '../supabase';

export default function Login() {
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [b, setB] = useState(false);
  const go = async () => {
    setB(true); setErr('');
    const { error } = await sb.auth.signInWithPassword({ email: e.trim(), password: p });
    if (error) setErr('الإيميل أو كلمة السر غلط');
    setB(false);
  };
  return (
    <div className="w">
      <div className="card login">
        <h1>📦 تسجيل الدخول</h1>
        <div style={{ marginTop: 14 }}><label>الإيميل</label>
          <input type="email" value={e} onChange={(x) => setE(x.target.value)} /></div>
        <div style={{ marginTop: 10 }}><label>كلمة السر</label>
          <input type="password" value={p} onChange={(x) => setP(x.target.value)}
            onKeyDown={(x) => x.key === 'Enter' && go()} /></div>
        <button className="p" style={{ width: '100%', marginTop: 14 }} disabled={b} onClick={go}>دخول</button>
        {err && <div className="err">{err}</div>}
      </div>
    </div>
  );
}
