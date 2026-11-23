-- نظام المخزن: شغّل الملف ده كله في Supabase > SQL Editor

-- 1) المستخدمين (owner / staff) ------------------------------------------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  role text not null default 'staff' check (role in ('owner','staff'))
);

create or replace function is_owner() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'owner') $$;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- 2) الأصناف والحركات -------------------------------------------------------
create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  article text,                                   -- أرتكل الكرتونة
  pieces_per_carton int not null check (pieces_per_carton > 0),
  piece_price numeric(12,2) not null default 0,   -- السعر الافتراضي للقطعة
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items on delete restrict,
  kind text not null check (kind in ('in','out')), -- in = وارد ، out = مبيعات/صادر
  pieces int not null check (pieces > 0),
  unit_price numeric(12,2) not null default 0,     -- سعر البيع الفعلي للقطعة
  note text,
  movement_date date not null default current_date,
  created_by uuid not null default auth.uid(),
  created_at timestamptz default now()
);
create index on stock_movements (movement_date);
create index on stock_movements (item_id);

-- المتاح من كل صنف (بالقطع) — الـ view بيتخطى RLS عشان الموظف يشوف الرصيد الكلي
create view item_stock as
select i.id as item_id,
       coalesce(sum(case m.kind when 'in' then m.pieces else -m.pieces end), 0)::int as on_hand
from items i left join stock_movements m on m.item_id = i.id
group by i.id;

-- منع البيع بأكتر من المتاح
create or replace function check_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare avail int;
begin
  if new.kind = 'out' then
    perform 1 from items where id = new.item_id for update;
    select coalesce(sum(case kind when 'in' then pieces else -pieces end), 0) into avail
      from stock_movements where item_id = new.item_id;
    if avail < new.pieces then
      raise exception 'الكمية أكبر من المتاح (المتاح % قطعة)', avail;
    end if;
  end if;
  return new;
end $$;
create trigger trg_check_stock before insert on stock_movements
  for each row execute function check_stock();

-- 3) سجل المراجعة (Audit) ---------------------------------------------------
create table audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_email text,
  table_name text,
  action text,
  row_id text,
  old_data jsonb,
  new_data jsonb
);

create or replace function audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor, actor_email, table_name, action, row_id, old_data, new_data)
  values (auth.uid(), (select email from profiles where id = auth.uid()), tg_table_name, tg_op,
          coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id'),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create trigger audit_items  after insert or update or delete on items           for each row execute function audit();
create trigger audit_moves  after insert or update or delete on stock_movements for each row execute function audit();
create trigger audit_prof   after update or delete            on profiles        for each row execute function audit();

-- 4) الصلاحيات (RLS) -----------------------------------------------------------
alter table profiles        enable row level security;
alter table items           enable row level security;
alter table stock_movements enable row level security;
alter table audit_log       enable row level security;

create policy prof_read   on profiles for select to authenticated using (id = auth.uid() or is_owner());
create policy prof_update on profiles for update to authenticated using (is_owner());

create policy items_read  on items for select to authenticated using (true);
create policy items_write on items for all    to authenticated using (is_owner()) with check (is_owner());

-- الموظف يشوف حركاته هو بس ويسجّل "صادر" بس ، الأونر يشوف ويسجّل كل حاجة
create policy mv_read   on stock_movements for select to authenticated
  using (is_owner() or created_by = auth.uid());
create policy mv_insert on stock_movements for insert to authenticated
  with check (created_by = auth.uid() and (is_owner() or kind = 'out'));
create policy mv_delete on stock_movements for delete to authenticated using (is_owner());

-- سجل المراجعة: الأونر بس يقرأ ، ومفيش حد يكتب/يعدّل/يمسح (التريجرات بس بتكتب)
create policy audit_read on audit_log for select to authenticated using (is_owner());
revoke insert, update, delete on audit_log from anon, authenticated;
grant select on item_stock to authenticated;

-- 5) Realtime -----------------------------------------------------------------------
alter publication supabase_realtime add table items, stock_movements, audit_log;

-- 6) بعد ما تعمل حساب الأونر من Authentication > Users، شغّل ده بإيميله:
-- update profiles set role = 'owner' where email = 'owner@example.com';
