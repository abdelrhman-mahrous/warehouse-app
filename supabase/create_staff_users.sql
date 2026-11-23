-- ==============================================================================
-- سكريبت إنشاء حسابين للإستاف (Staff) في Supabase
-- شغّل هذا الملف في Supabase > SQL Editor
-- ==============================================================================

-- تفعيل مكتبة التشفير إذا لم تكن مفعلة
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) إنشاء الحساب الأول: staff1@warehouse.com / كلمة المرور: Staff@123456
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'staff1@warehouse.com',
  crypt('Staff@123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"موظف 1"}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- 2) إنشاء الحساب الثاني: staff2@warehouse.com / كلمة المرور: Staff@123456
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'staff2@warehouse.com',
  crypt('Staff@123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"موظف 2"}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- التأكد من وجودهم في جدول profiles وتعيين رتبتهم كـ staff
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, coalesce(raw_user_meta_data->>'full_name', email), 'staff'
FROM auth.users
WHERE email IN ('staff1@warehouse.com', 'staff2@warehouse.com')
ON CONFLICT (id) DO UPDATE SET role = 'staff';



cd warehouse-app
git init
git add .
git commit -m "Initial commit: warehouse management app"
git branch -M main
git remote add origin https://github.com/abdelrhman-mahrous/warehouse-app
git push -u origin main