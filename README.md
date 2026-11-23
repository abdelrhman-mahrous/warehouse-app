# نظام إدارة المخزن (React + Vite + Supabase)

1. شغّل `supabase/schema.sql` في Supabase > SQL Editor.
2. اعمل حساب الأونر والموظفين من Authentication > Users، ثم:
   `update profiles set role='owner' where email='owner@example.com';`
3. افتح ملف `.env` وحط:
   - `VITE_SUPABASE_URL`      ← Project URL
   - `VITE_SUPABASE_ANON_KEY` ← anon public key (مش service_role)
4. `npm install` ثم `npm run dev`
