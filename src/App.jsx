import { useEffect, useState } from 'react';
import { sb } from './supabase';
import Login from './components/Login.jsx';
import Main from './components/Main.jsx';

export default function App() {
  const [sess, setSess] = useState(undefined);
  const [prof, setProf] = useState(null);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSess(data.session));
    const { data: l } = sb.auth.onAuthStateChange((_e, s) => setSess(s));
    return () => l.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sess) { setProf(null); return; }
    sb.from('profiles').select('*').eq('id', sess.user.id).single().then(({ data }) => setProf(data));
  }, [sess]);

  if (sess === undefined || (sess && !prof)) return <div className="w mu">جاري التحميل...</div>;
  if (!sess) return <Login />;
  return <Main prof={prof} />;
}
