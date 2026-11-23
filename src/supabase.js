import { createClient } from '@supabase/supabase-js';

// القيم بتتقرأ من ملف .env في جذر المشروع
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key || url.startsWith('YOUR_')) {
  console.error('حط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env');
}
export const sb = createClient(url || 'http://localhost', key || 'missing');
