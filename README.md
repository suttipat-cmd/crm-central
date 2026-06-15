# CRM Central

Current version: **v0.1.1**

CRM web app สำหรับบริหาร **Lead → Demo → Customer → CS Task → Dashboard**  
Frontend ใช้ **GitHub Pages** และ backend ใช้ **Supabase Auth + Postgres + RLS**

Repo นี้ตั้งใจให้มีเพียง 4 ไฟล์:

```text
README.md
index.html
script.js
style.css
```

---

## Changelog

### v0.1.1
- Hotfix SQL: ย้ายการสร้าง helper functions ที่อ้าง `public.profiles` ไปหลังการสร้าง table เพื่อแก้ error `relation "public.profiles" does not exist`
- README SQL block อัปเดตให้ตรงกับ schema hotfix ล่าสุด

### v0.1.0
- เปลี่ยนจาก prototype `localStorage` เป็น GitHub Pages + Supabase
- รวม Lead / Demo / Customer เป็น `accounts`
- แยก `demo_sessions` เพราะ 1 account สามารถ demo ได้หลายรอบ
- เพิ่ม `cs_tasks`
- เพิ่ม `app_events` สำหรับ note / audit / notification
- เพิ่ม `app_settings` สำหรับ Marketing Lead No. และ Sales round-robin
- เพิ่ม Supabase Auth login
- เพิ่ม role: marketing, sales, cs, management, admin
- เพิ่ม RLS policy ตาม role
- เพิ่ม Dashboard, Accounts, Demo Sessions, CS Tasks, Activity, Admin
- เพิ่ม CSV export สำหรับ Admin / Management

---

## Current Flow

```text
Marketing สร้าง Lead
  → ระบบออก marketing_lead_no เช่น 0, 1, 2, 3...
  → Auto assign Sales active แบบ round-robin
  → Account stage = lead

Sales สร้าง Lead เอง
  → ไม่มี marketing_lead_no
  → sales_owner_id = Sales คนนั้น
  → Account stage = lead

Sales ติดต่อ Lead
  → บันทึก note / update status
  → ตัดจบ Lost
  → หรือส่ง Demo
  → หรือปิดเป็น Customer ได้ทันที

Demo
  → 1 Account มี Demo Session ได้หลายรอบ
  → Demo รอบใหม่ default ใช้ CS Owner เดิม
  → Lost After Demo หรือ Won / Converted

CS
  → รับ Demo Lead / Customer
  → สร้าง Customer เองได้
  → Customer ทุก record ต้องมี Sales Owner
  → สร้าง / อัปเดต / ปิด CS Task

Management
  → ดู Dashboard
  → ดู Report / Performance
  → Export CSV

Admin
  → ทำได้ทุกอย่าง
  → จัดการ User / Role / Sales Queue
```

---

## Files

```text
index.html
- HTML shell
- โหลด style.css
- โหลด Supabase JS ผ่าน CDN
- โหลด script.js

style.css
- Layout, sidebar, table, modal, form, dashboard, responsive

script.js
- Supabase client config
- Auth
- Router/render
- Accounts
- Demo Sessions
- CS Tasks
- Activity
- Admin
- Export CSV

README.md
- Current system spec
- Database schema
- RLS
- Setup
- Deploy
- Rollback
```

---

## Required Configuration

เปิด `script.js` แล้วแก้เฉพาะ 2 ค่านี้:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

ใช้ได้เฉพาะ **anon key** เท่านั้น  
ห้ามใส่ `service_role key` ใน frontend หรือ repo

---

## Supabase Setup

### Project settings ที่แนะนำ

```text
Enable Data API: On
Automatically expose new tables: Off
Enable automatic RLS: On
Advanced configuration: Default
```

หลังจากสร้าง Project แล้ว ให้ไปที่:

```text
Supabase Dashboard → SQL Editor → New query
```

แล้วรัน SQL ด้านล่างทั้งหมด

---

## Database Schema + RLS SQL

> SQL นี้ออกแบบให้รันซ้ำได้ในระดับ MVP โดยจะ `drop policy if exists` ก่อนสร้าง policy ใหม่  
> ห้ามใส่ password / secret / service role key ใน SQL นี้

```sql
-- CRM Central Supabase Schema v0.1.1
-- Hotfix: create tables before helper functions that reference public.profiles.
-- Safe to run on a fresh project or rerun after the failed v0.1.0 attempt.

create extension if not exists pgcrypto;

-- ---------- Generic Trigger Helper ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'sales'
    check (role in ('marketing', 'sales', 'cs', 'management', 'admin')),
  is_active boolean not null default true,
  sales_queue_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  marketing_lead_no integer unique,
  origin text not null default 'sales'
    check (origin in ('marketing', 'sales', 'cs')),
  lifecycle_stage text not null default 'lead'
    check (lifecycle_stage in ('lead', 'demo', 'customer', 'closed')),

  company_name text not null,
  contact_name text,
  phone text,
  email text,
  line_id text,

  province text,
  business_type text,
  lead_source text,
  campaign text,

  sales_owner_id uuid references public.profiles(id),
  cs_owner_id uuid references public.profiles(id),

  lead_status text,
  customer_status text,
  priority text not null default 'Medium',
  next_action text,
  next_followup_date date,
  last_contact_date date,

  product_package text,
  customer_start_date date,

  notes text,

  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customer_requires_sales_owner
    check (lifecycle_stage <> 'customer' or sales_owner_id is not null)
);

create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  demo_no integer not null,
  cs_owner_id uuid references public.profiles(id),
  status text not null default 'Demo Requested',

  demo_date date,
  demo_time time,
  demo_result text,
  pain_point text,
  next_followup_date date,
  notes text,

  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,

  unique(account_id, demo_no)
);

create table if not exists public.cs_tasks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  demo_session_id uuid references public.demo_sessions(id) on delete set null,

  task_name text not null,
  cs_owner_id uuid references public.profiles(id),
  task_type text not null default 'Support',
  status text not null default 'To Do',
  priority text not null default 'Medium',
  due_date date,
  blocker text,
  notes text,

  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'audit',
  title text,
  message text,

  account_id uuid references public.accounts(id) on delete cascade,
  demo_session_id uuid references public.demo_sessions(id) on delete cascade,
  task_id uuid references public.cs_tasks(id) on delete cascade,

  assigned_to_id uuid references public.profiles(id),
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,

  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index if not exists idx_profiles_role_active on public.profiles(role, is_active);
create index if not exists idx_profiles_sales_queue on public.profiles(sales_queue_order);

create index if not exists idx_accounts_marketing_lead_no on public.accounts(marketing_lead_no);
create index if not exists idx_accounts_stage on public.accounts(lifecycle_stage);
create index if not exists idx_accounts_origin on public.accounts(origin);
create index if not exists idx_accounts_sales_owner on public.accounts(sales_owner_id);
create index if not exists idx_accounts_cs_owner on public.accounts(cs_owner_id);
create index if not exists idx_accounts_followup on public.accounts(next_followup_date);

create index if not exists idx_demo_sessions_account on public.demo_sessions(account_id);
create index if not exists idx_demo_sessions_cs_owner on public.demo_sessions(cs_owner_id);
create index if not exists idx_demo_sessions_status on public.demo_sessions(status);

create index if not exists idx_cs_tasks_account on public.cs_tasks(account_id);
create index if not exists idx_cs_tasks_demo on public.cs_tasks(demo_session_id);
create index if not exists idx_cs_tasks_cs_owner on public.cs_tasks(cs_owner_id);
create index if not exists idx_cs_tasks_status on public.cs_tasks(status);
create index if not exists idx_cs_tasks_due on public.cs_tasks(due_date);

create index if not exists idx_app_events_account on public.app_events(account_id);
create index if not exists idx_app_events_demo on public.app_events(demo_session_id);
create index if not exists idx_app_events_task on public.app_events(task_id);
create index if not exists idx_app_events_assigned on public.app_events(assigned_to_id, is_read);
create index if not exists idx_app_events_type_time on public.app_events(event_type, created_at desc);

-- ---------- Triggers ----------
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_demo_sessions_updated_at on public.demo_sessions;
create trigger set_demo_sessions_updated_at
before update on public.demo_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_cs_tasks_updated_at on public.cs_tasks;
create trigger set_cs_tasks_updated_at
before update on public.cs_tasks
for each row execute function public.set_updated_at();

-- Create profile automatically when Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'sales',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- Settings ----------
insert into public.app_settings (key, value)
values
  ('marketing_lead_counter', '0'::jsonb),
  ('sales_round_robin_pointer', '0'::jsonb)
on conflict (key) do nothing;

-- ---------- Grants ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.accounts to authenticated;
grant select, insert, update on public.demo_sessions to authenticated;
grant select, insert, update on public.cs_tasks to authenticated;
grant select, insert, update on public.app_events to authenticated;
grant select, insert, update on public.app_settings to authenticated;

-- ---------- Role Helpers ----------
-- ---------- Helpers ----------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_management_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('management', 'admin'), false)
$$;

-- ---------- RPC: Marketing Lead No. + Sales Round-robin ----------
create or replace function public.create_marketing_account(payload jsonb)
returns public.accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  sales_ids uuid[];
  sales_count int;
  pointer int;
  selected_sales uuid;
  next_no int;
  new_account public.accounts;
begin
  actor_role := public.current_user_role();

  if actor_role not in ('marketing', 'admin') then
    raise exception 'Only marketing/admin can create marketing lead';
  end if;

  insert into public.app_settings (key, value)
  values ('marketing_lead_counter', to_jsonb((select coalesce(max(marketing_lead_no) + 1, 0) from public.accounts)::int))
  on conflict (key) do nothing;

  insert into public.app_settings (key, value)
  values ('sales_round_robin_pointer', '0'::jsonb)
  on conflict (key) do nothing;

  select (value::text)::int
  into next_no
  from public.app_settings
  where key = 'marketing_lead_counter'
  for update;

  if next_no is null then
    select coalesce(max(marketing_lead_no) + 1, 0)
    into next_no
    from public.accounts;
  end if;

  select array_agg(id order by sales_queue_order nulls last, full_name, id)
  into sales_ids
  from public.profiles
  where role = 'sales'
    and is_active = true;

  sales_count := coalesce(cardinality(sales_ids), 0);

  if sales_count = 0 then
    raise exception 'No active sales user for auto assignment';
  end if;

  select coalesce((value::text)::int, 0)
  into pointer
  from public.app_settings
  where key = 'sales_round_robin_pointer'
  for update;

  selected_sales := sales_ids[(pointer % sales_count) + 1];

  insert into public.accounts (
    marketing_lead_no,
    origin,
    lifecycle_stage,
    company_name,
    contact_name,
    phone,
    email,
    line_id,
    province,
    business_type,
    lead_source,
    campaign,
    sales_owner_id,
    cs_owner_id,
    lead_status,
    customer_status,
    priority,
    next_action,
    next_followup_date,
    last_contact_date,
    product_package,
    customer_start_date,
    notes,
    created_by
  )
  values (
    next_no,
    'marketing',
    coalesce(nullif(payload ->> 'lifecycle_stage', ''), 'lead'),
    nullif(payload ->> 'company_name', ''),
    nullif(payload ->> 'contact_name', ''),
    nullif(payload ->> 'phone', ''),
    nullif(payload ->> 'email', ''),
    nullif(payload ->> 'line_id', ''),
    nullif(payload ->> 'province', ''),
    nullif(payload ->> 'business_type', ''),
    nullif(payload ->> 'lead_source', ''),
    nullif(payload ->> 'campaign', ''),
    selected_sales,
    nullif(payload ->> 'cs_owner_id', '')::uuid,
    coalesce(nullif(payload ->> 'lead_status', ''), 'New Lead'),
    nullif(payload ->> 'customer_status', ''),
    coalesce(nullif(payload ->> 'priority', ''), 'Medium'),
    nullif(payload ->> 'next_action', ''),
    nullif(payload ->> 'next_followup_date', '')::date,
    nullif(payload ->> 'last_contact_date', '')::date,
    nullif(payload ->> 'product_package', ''),
    nullif(payload ->> 'customer_start_date', '')::date,
    nullif(payload ->> 'notes', ''),
    auth.uid()
  )
  returning * into new_account;

  update public.app_settings
  set value = to_jsonb(next_no + 1), updated_at = now()
  where key = 'marketing_lead_counter';

  update public.app_settings
  set value = to_jsonb((pointer + 1) % sales_count), updated_at = now()
  where key = 'sales_round_robin_pointer';

  insert into public.app_events (
    event_type,
    title,
    message,
    account_id,
    assigned_to_id,
    metadata,
    created_by
  )
  values (
    'notification',
    'มี Marketing Lead ใหม่',
    new_account.company_name,
    new_account.id,
    selected_sales,
    jsonb_build_object('marketing_lead_no', next_no),
    auth.uid()
  );

  return new_account;
end;
$$;

grant execute on function public.create_marketing_account(jsonb) to authenticated;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.demo_sessions enable row level security;
alter table public.cs_tasks enable row level security;
alter table public.app_events enable row level security;
alter table public.app_settings enable row level security;

-- profiles
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
on public.profiles for insert
to authenticated
with check (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- accounts
drop policy if exists "accounts_select_by_role" on public.accounts;
create policy "accounts_select_by_role"
on public.accounts for select
to authenticated
using (
  public.is_management_or_admin()
  or created_by = auth.uid()
  or sales_owner_id = auth.uid()
  or cs_owner_id = auth.uid()
  or exists (
    select 1 from public.demo_sessions d
    where d.account_id = accounts.id
      and d.cs_owner_id = auth.uid()
  )
  or exists (
    select 1 from public.cs_tasks t
    where t.account_id = accounts.id
      and t.cs_owner_id = auth.uid()
  )
);

drop policy if exists "accounts_insert_by_role" on public.accounts;
create policy "accounts_insert_by_role"
on public.accounts for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.current_user_role() = 'sales'
    and origin = 'sales'
    and sales_owner_id = auth.uid()
    and created_by = auth.uid()
  )
  or (
    public.current_user_role() = 'cs'
    and origin = 'cs'
    and lifecycle_stage = 'customer'
    and sales_owner_id is not null
    and created_by = auth.uid()
  )
);

drop policy if exists "accounts_update_by_owner" on public.accounts;
create policy "accounts_update_by_owner"
on public.accounts for update
to authenticated
using (
  public.is_admin()
  or sales_owner_id = auth.uid()
  or cs_owner_id = auth.uid()
  or created_by = auth.uid()
)
with check (
  public.is_admin()
  or sales_owner_id = auth.uid()
  or cs_owner_id = auth.uid()
  or created_by = auth.uid()
);

-- demo_sessions
drop policy if exists "demo_sessions_select_by_role" on public.demo_sessions;
create policy "demo_sessions_select_by_role"
on public.demo_sessions for select
to authenticated
using (
  public.is_management_or_admin()
  or cs_owner_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1 from public.accounts a
    where a.id = demo_sessions.account_id
      and (
        a.sales_owner_id = auth.uid()
        or a.cs_owner_id = auth.uid()
        or a.created_by = auth.uid()
      )
  )
);

drop policy if exists "demo_sessions_insert_by_role" on public.demo_sessions;
create policy "demo_sessions_insert_by_role"
on public.demo_sessions for insert
to authenticated
with check (
  public.is_admin()
  or public.current_user_role() in ('sales', 'cs')
);

drop policy if exists "demo_sessions_update_by_role" on public.demo_sessions;
create policy "demo_sessions_update_by_role"
on public.demo_sessions for update
to authenticated
using (
  public.is_admin()
  or cs_owner_id = auth.uid()
  or created_by = auth.uid()
)
with check (
  public.is_admin()
  or cs_owner_id = auth.uid()
  or created_by = auth.uid()
);

-- cs_tasks
drop policy if exists "cs_tasks_select_by_role" on public.cs_tasks;
create policy "cs_tasks_select_by_role"
on public.cs_tasks for select
to authenticated
using (
  public.is_management_or_admin()
  or cs_owner_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1 from public.accounts a
    where a.id = cs_tasks.account_id
      and (
        a.sales_owner_id = auth.uid()
        or a.cs_owner_id = auth.uid()
        or a.created_by = auth.uid()
      )
  )
);

drop policy if exists "cs_tasks_insert_by_role" on public.cs_tasks;
create policy "cs_tasks_insert_by_role"
on public.cs_tasks for insert
to authenticated
with check (
  public.is_admin()
  or public.current_user_role() = 'cs'
  or cs_owner_id = auth.uid()
);

drop policy if exists "cs_tasks_update_by_owner" on public.cs_tasks;
create policy "cs_tasks_update_by_owner"
on public.cs_tasks for update
to authenticated
using (
  public.is_admin()
  or cs_owner_id = auth.uid()
  or created_by = auth.uid()
)
with check (
  public.is_admin()
  or cs_owner_id = auth.uid()
  or created_by = auth.uid()
);

-- app_events
drop policy if exists "app_events_select_by_role" on public.app_events;
create policy "app_events_select_by_role"
on public.app_events for select
to authenticated
using (
  public.is_management_or_admin()
  or created_by = auth.uid()
  or assigned_to_id = auth.uid()
  or exists (
    select 1 from public.accounts a
    where a.id = app_events.account_id
      and (
        a.sales_owner_id = auth.uid()
        or a.cs_owner_id = auth.uid()
        or a.created_by = auth.uid()
      )
  )
);

drop policy if exists "app_events_insert_authenticated" on public.app_events;
create policy "app_events_insert_authenticated"
on public.app_events for insert
to authenticated
with check (
  public.is_admin()
  or created_by = auth.uid()
);

drop policy if exists "app_events_update_notification_owner" on public.app_events;
create policy "app_events_update_notification_owner"
on public.app_events for update
to authenticated
using (
  public.is_admin()
  or assigned_to_id = auth.uid()
)
with check (
  public.is_admin()
  or assigned_to_id = auth.uid()
);

-- app_settings
drop policy if exists "app_settings_select_admin" on public.app_settings;
create policy "app_settings_select_admin"
on public.app_settings for select
to authenticated
using (public.is_admin());

drop policy if exists "app_settings_update_admin" on public.app_settings;
create policy "app_settings_update_admin"
on public.app_settings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
```

---

## Create First Admin

1. ไปที่ Supabase Dashboard
2. เข้า **Authentication → Users**
3. กด **Add user**
4. ใส่ email ของคุณ
5. ตั้ง password เอง หรือใช้ invite/reset password
6. กลับไป SQL Editor แล้วรันคำสั่งนี้ โดยแก้ email เป็นของจริง

```sql
insert into public.profiles (id, email, full_name, role, is_active)
select
  id,
  email,
  'Admin',
  'admin',
  true
from auth.users
where email = 'YOUR_ADMIN_EMAIL@example.com'
on conflict (id) do update
set
  role = 'admin',
  full_name = 'Admin',
  is_active = true,
  updated_at = now();
```

> ห้ามส่ง password ในแชทหรือ commit ลง repo

---

## Add Users

สร้าง user ใน Supabase Auth ก่อน แล้วให้ Admin เข้าเมนู **Admin** ใน Web App เพื่อแก้:

```text
full_name
role
is_active
sales_queue_order
```

สำหรับ Sales auto assign:
- `role = sales`
- `is_active = true`
- ใส่ `sales_queue_order` เช่น 1, 2, 3

---

## Role & Permission Summary

```text
Marketing
- สร้าง Marketing Lead ผ่าน RPC
- ได้ marketing_lead_no
- Auto assign Sales
- ดู Account ที่ตัวเองสร้าง

Sales
- สร้าง Sales Lead เอง
- ดู/แก้ Account ที่ตัวเองเป็น sales_owner
- ส่ง Demo หรือแปลงเป็น Customer

CS
- สร้าง Customer เองได้ แต่ต้องมี Sales Owner
- ดู/แก้ Account / Demo / Task ที่เกี่ยวข้อง
- สร้างและปิด CS Task

Management
- ดู Dashboard / Report / Export
- Read-only เป็นหลัก

Admin
- ทำได้ทุกอย่าง
- จัดการ role/user/sales queue
```

---

## GitHub Pages Deploy

หลัง push repo แล้ว:

```text
GitHub → Repository → Settings → Pages
Source: Deploy from a branch
Branch: main
Folder: /root
Save
```

รอ GitHub Pages build แล้วเปิด URL ที่ GitHub แสดง

---

## Local Test

เปิด `index.html` ตรง ๆ ใน browser ได้ แต่แนะนำใช้ VS Code Live Server หรือรัน local static server:

```bash
python -m http.server 5500
```

แล้วเปิด:

```text
http://localhost:5500
```

---

## VS Code Push Commands

ใช้ใน Terminal ของ VS Code:

```bash
git clone https://github.com/suttipat-cmd/crm-central.git
cd crm-central

# วาง 4 ไฟล์นี้ลงใน folder:
# README.md
# index.html
# script.js
# style.css

git status
git add README.md index.html script.js style.css
git commit -m "Initial CRM Central GitHub Pages Supabase app"
git push origin main
```

ถ้าสร้าง repo ว่างไว้แล้ว และยังไม่ได้ clone:

```bash
mkdir crm-central
cd crm-central
git init
git branch -M main
git remote add origin https://github.com/suttipat-cmd/crm-central.git

# วาง 4 ไฟล์นี้ลงใน folder

git add README.md index.html script.js style.css
git commit -m "Initial CRM Central GitHub Pages Supabase app"
git push -u origin main
```

---

## Manual Test Checklist

หลังรัน SQL และตั้งค่า `script.js` แล้วให้ทดสอบ:

```text
1. Login ด้วย Admin
2. Admin แก้ role/user/sales_queue_order
3. สร้าง Sales active อย่างน้อย 1 คน
4. Login Marketing
5. สร้าง Marketing Lead
6. ตรวจว่า marketing_lead_no เริ่ม 0 และ assign Sales อัตโนมัติ
7. สร้าง Marketing Lead ถัดไป ตรวจว่าเลขรันต่อและ Sales วนคิว
8. Login Sales
9. ดู Lead ที่ถูก assign
10. แก้ status / note / ส่ง Demo
11. สร้าง Demo Session รอบ 1
12. สร้าง Demo Session รอบ 2 โดย default ใช้ CS Owner เดิม
13. แปลง Account เป็น Customer
14. Login CS
15. สร้าง CS Task / ปิด Task
16. Login Management
17. ดู Dashboard และ Export CSV
```

---

## Rollback

Frontend rollback:

```bash
git log --oneline
git revert <commit_hash>
git push origin main
```

Database rollback สำหรับ MVP:
- ถ้ายังเป็นข้อมูลทดสอบ สามารถลบ table แล้วรัน SQL ใหม่ได้
- ถ้ามีข้อมูลจริงแล้ว ห้าม drop table ทันที
- ให้ backup ก่อน:

```text
Supabase Dashboard → Table Editor / SQL export / Database backup
```

Rollback แบบ safe หลังมีข้อมูลจริงควรทำเป็น migration เฉพาะจุด ไม่ใช่ลบ schema ทั้งหมด

---

## Known Limitations

```text
- ยังไม่ migrate ข้อมูลจาก Google Sheet
- ยังไม่ migrate รูปภาพจาก update log
- ยังไม่มี Email notification
- ยังไม่มี LINE / Slack / Teams notification
- Master data ยังอยู่ใน script.js เป็น constant ไม่ใช่ table แยก
- ยังไม่มี Excel import mapping
- Demo หลายรอบรองรับแล้ว แต่ยังไม่มี calendar view
- app_events รวม note/audit/notification ใน table เดียวเพื่อให้ MVP table น้อย
- Frontend ใช้ Supabase anon key ได้ตามปกติ แต่ห้ามใช้ service_role key
```

---

## Security Notes

```text
- เปิด RLS ทุก table ที่ frontend เข้าถึง
- ใช้ Supabase Auth เป็น identity
- ใช้ profiles.id เป็น user source of truth
- Customer ทุก record บังคับ sales_owner_id
- Marketing Lead No. และ round-robin ทำผ่าน RPC เพื่อกันเลขชน
- README ไม่มี secret/password/token
```
