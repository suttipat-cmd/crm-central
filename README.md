# Internal CRM Ops

Current version: `1.0.2`  
Release date: `2026-06-20`  
Stack: GitHub Pages + Supabase + plain HTML/CSS/JS  
Repository files allowed: `README.md`, `index.html`, `script.js`, `style.css`

## 1. System Overview

ระบบนี้เป็น Internal CRM / Lead-to-Customer Operations สำหรับทีม MKT, Sale, CS, Manager และ Admin

แกนกลางของระบบคือ `accounts` โดย Account 1 รายการสามารถเดินทางได้หลายเส้นทาง:

```text
Lead → Lost
Lead → Customer
Lead → Demo → Lost
Lead → Demo → Customer
Lead → Demo → Customer → Lost / Churn
```

ข้อมูล Lead, Demo, Customer, Training, Task และ Log ทั้งหมดผูกกับ `account_id` เดียวกัน เพื่อให้ดู timeline และประวัติย้อนหลังได้ครบ

## 2. Roles

| Role | สิทธิ์หลัก |
|---|---|
| Admin | ทำได้ทุกอย่าง จัดการ user, role, master data, account, task, demo, customer |
| MKT | สร้าง MKT Lead, ระบบออก Running No., เห็น Lead จาก MKT ทั้งทีม |
| Sale | เห็นและแก้เฉพาะ Account ที่ตัวเองเป็น owner, update lead, request demo, convert customer, mark lost |
| CS | เห็น Demo / Customer / Task ฝั่ง CS ร่วมกันทั้งทีม, บันทึก demo, training, users, logs, task |
| Manager | ดู dashboard/report แบบ read-only |

User ต้องถูกสร้างใน Supabase Auth ก่อน จากนั้น Admin กำหนด role และ `is_active` ในตาราง `profiles`

## 3. User Flows

### 3.1 MKT Lead

```text
MKT สร้าง Lead
→ ระบบออก running_no เป็นตัวเลข เริ่มจาก 1
→ ระบบ assign Sale แบบ round-robin จาก profiles.role = sale และ is_active = true
→ Sale ติดต่อและอัปเดตข้อมูล
```

### 3.2 Sale Lead

```text
Sale สร้าง Lead เอง
→ ไม่มี Running No.
→ sale_owner_id = Sale ที่สร้าง
→ ใช้ flow เดียวกับ Lead อื่น
```

### 3.3 Demo

```text
Sale Request Demo
→ Account เปลี่ยนเป็น lifecycle_stage = demo
→ CS เห็นร่วมกันทั้งทีม
→ CS บันทึก demo session, demo users, password demo, notes, logs, training
→ Demo ไปต่อเป็น Customer หรือ Lost
```

### 3.4 Customer

```text
Convert to Customer
→ สร้าง/บันทึก customer_profiles
→ บันทึก cars, modules, function, start date, billing date, engagement level, status
→ CS จัดการ tasks และ training ต่อ
```

### 3.5 Training

Training ใช้ได้ทั้งช่วง Demo และ Customer:

```text
training_sessions
- account_id
- demo_session_id nullable
- customer_profile_id nullable
- training_phase = demo/customer
- session_no default auto ตาม Account แต่ CS แก้ไขได้
```

## 4. Frontend Pages

เป็น Single Page App ด้วย hash route:

```text
#/dashboard
#/leads
#/accounts
#/account/:id
#/demo
#/customers
#/tasks
#/training
#/reports
#/admin
```

รองรับมุมมอง:

```text
Board / Kanban
Calendar
List
Table / Spreadsheet
Timeline / Gantt แบบเบื้องต้น
```

## 5. Files

```text
README.md   Current system spec + Supabase SQL setup + deploy/test/rollback
index.html  App shell + Supabase CDN
script.js   SPA, Supabase client, auth, route, CRUD, business helpers
style.css   Layout, responsive UI, board/calendar/table/timeline, print CSS
```

ห้ามเพิ่มไฟล์อื่นใน repo ตาม constraint ของโปรเจกต์นี้

## 6. Supabase Config

Frontend ใช้ Supabase anon key เท่านั้น

เปิด `script.js` แล้วแก้:

```js
const CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
}
```

ห้ามใส่ `service_role key`, password หรือ secret ใน frontend/README/repo

## 7. Database Schema

### Core tables

```text
profiles
accounts
account_contacts
account_activities
demo_sessions
demo_users
demo_logs
customer_profiles
training_sessions
training_participants
modules
account_modules
tasks
task_comments
assignment_history
status_history
lost_reasons
lead_sources
campaigns
contact_statuses
account_cs_owners
app_settings
```

### Important owner fields

| Table | Owner / access field |
|---|---|
| accounts | sale_owner_id, mkt_created_by, lifecycle_stage, lost_from_stage |
| account_cs_owners | account_id, cs_user_id |
| tasks | account_id, assigned_to |
| training_sessions | account_id, trainer_id |
| demo_sessions | account_id, sale_owner_id, cs_owner_id |

## 8. Supabase SQL Setup

Run this SQL in Supabase SQL Editor.

> Replace `FIRST_ADMIN_USER_ID` and `FIRST_ADMIN_EMAIL` near the end after creating your first user in Supabase Auth.

> v1.0.1 adds a preflight cleanup block so rerunning SQL will not fail on existing helper function parameter names.

```sql
begin;

create extension if not exists pgcrypto;

create sequence if not exists public.mkt_running_no_seq start 1;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'pending' check (role in ('pending','admin','mkt','sale','cs','manager')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  module_name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lost_reasons (
  id uuid primary key default gen_random_uuid(),
  reason_name text not null unique,
  applies_to_stage text not null default 'any',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  running_no bigint unique,
  source_type text not null default 'sales_self' check (source_type in ('mkt','sales_self','other')),
  lifecycle_stage text not null default 'lead' check (lifecycle_stage in ('lead','demo','customer','lost')),
  lifecycle_status text not null default 'new',
  company_name text,
  short_name text,
  tax_id text,
  lead_source_id uuid references public.lead_sources(id),
  campaign_id uuid references public.campaigns(id),
  contact_status_id uuid references public.contact_statuses(id),
  product_interest text,
  initial_note text,
  cars_estimate integer check (cars_estimate is null or cars_estimate >= 0),
  sale_owner_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  mkt_created_by uuid references public.profiles(id),
  lost_reason_id uuid references public.lost_reasons(id),
  lost_note text,
  lost_from_stage text,
  converted_to_customer_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  contact_name text,
  email text,
  phone text,
  position text,
  contact_role text not null default 'primary',
  is_primary boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_activities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  activity_type text not null default 'note',
  title text,
  content text not null,
  next_follow_up_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  requested_by uuid references public.profiles(id),
  sale_owner_id uuid references public.profiles(id),
  cs_owner_id uuid references public.profiles(id),
  demo_status text not null default 'requested' check (demo_status in ('requested','active','extended','ended','cancelled','converted','lost')),
  start_date date,
  end_date date,
  extended_from_demo_id uuid references public.demo_sessions(id),
  module_interest text,
  demo_result text,
  requirement_note text,
  follow_up_note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.demo_users (
  id uuid primary key default gen_random_uuid(),
  demo_session_id uuid not null references public.demo_sessions(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_email text not null,
  user_name text,
  user_role text,
  demo_password text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.demo_logs (
  id uuid primary key default gen_random_uuid(),
  demo_session_id uuid references public.demo_sessions(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  log_type text not null default 'note',
  message text not null,
  metadata jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  customer_code text unique,
  owner_id uuid references public.profiles(id),
  cars integer check (cars is null or cars >= 0),
  functions text,
  start_date date,
  billing_date date,
  engagement_level text not null default 'medium' check (engagement_level in ('low','medium','high','risk')),
  customer_status text not null default 'onboarding' check (customer_status in ('onboarding','active','inactive','churned')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  demo_session_id uuid references public.demo_sessions(id) on delete set null,
  customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  training_phase text not null check (training_phase in ('demo','customer')),
  session_no integer,
  training_date date not null,
  trainer_id uuid references public.profiles(id),
  training_detail text not null,
  issue_note text,
  next_action text,
  status text not null default 'planned' check (status in ('planned','done','cancelled')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_participants (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  participant_type text not null check (participant_type in ('internal','customer')),
  profile_id uuid references public.profiles(id),
  contact_id uuid references public.account_contacts(id),
  name_snapshot text,
  email_snapshot text,
  role_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.account_modules (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  module_id uuid not null references public.modules(id),
  module_type text not null default 'interested' check (module_type in ('interested','demo','subscribed')),
  created_at timestamptz not null default now(),
  unique (account_id, module_id, module_type)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  demo_session_id uuid references public.demo_sessions(id) on delete set null,
  title text not null,
  description text,
  task_type text not null default 'follow_up',
  status text not null default 'open' check (status in ('open','in_progress','blocked','done','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  content text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_history (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  from_user_id uuid references public.profiles(id),
  to_user_id uuid references public.profiles(id),
  assignment_type text not null default 'manual',
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  from_stage text,
  to_stage text,
  from_status text,
  to_status text,
  reason text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.account_cs_owners (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  cs_user_id uuid not null references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (account_id, cs_user_id)
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_accounts_stage on public.accounts(lifecycle_stage);
create index if not exists idx_accounts_status on public.accounts(lifecycle_status);
create index if not exists idx_accounts_sale_owner on public.accounts(sale_owner_id);
create index if not exists idx_accounts_source on public.accounts(source_type);
create index if not exists idx_contacts_account on public.account_contacts(account_id);
create index if not exists idx_activities_account on public.account_activities(account_id);
create index if not exists idx_demo_account on public.demo_sessions(account_id);
create index if not exists idx_demo_status on public.demo_sessions(demo_status);
create index if not exists idx_tasks_account on public.tasks(account_id);
create index if not exists idx_tasks_due on public.tasks(due_at);
create index if not exists idx_training_account on public.training_sessions(account_id);
create index if not exists idx_training_date on public.training_sessions(training_date);
create index if not exists idx_customer_account on public.customer_profiles(account_id);
create index if not exists idx_account_modules_account on public.account_modules(account_id);
create index if not exists idx_status_history_account on public.status_history(account_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, is_active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email), 'pending', false)
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- v1.0.1 hotfix preflight:
-- If this SQL is rerun on a database that already has older helper functions,
-- PostgreSQL may reject CREATE OR REPLACE when input parameter names changed.
-- Drop policies first because they may depend on these helper functions.
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_admin_write on public.profiles;
drop policy if exists master_select_lead_sources on public.lead_sources;
drop policy if exists master_write_lead_sources on public.lead_sources;
drop policy if exists master_select_campaigns on public.campaigns;
drop policy if exists master_write_campaigns on public.campaigns;
drop policy if exists master_select_modules on public.modules;
drop policy if exists master_write_modules on public.modules;
drop policy if exists master_select_contact_statuses on public.contact_statuses;
drop policy if exists master_write_contact_statuses on public.contact_statuses;
drop policy if exists master_select_lost_reasons on public.lost_reasons;
drop policy if exists master_write_lost_reasons on public.lost_reasons;
drop policy if exists accounts_select on public.accounts;
drop policy if exists accounts_insert on public.accounts;
drop policy if exists accounts_update on public.accounts;
drop policy if exists accounts_delete on public.accounts;
drop policy if exists account_contacts_select on public.account_contacts;
drop policy if exists account_contacts_write on public.account_contacts;
drop policy if exists account_activities_select on public.account_activities;
drop policy if exists account_activities_write on public.account_activities;
drop policy if exists demo_sessions_select on public.demo_sessions;
drop policy if exists demo_sessions_write on public.demo_sessions;
drop policy if exists demo_users_select on public.demo_users;
drop policy if exists demo_users_write on public.demo_users;
drop policy if exists demo_logs_select on public.demo_logs;
drop policy if exists demo_logs_write on public.demo_logs;
drop policy if exists customer_profiles_select on public.customer_profiles;
drop policy if exists customer_profiles_write on public.customer_profiles;
drop policy if exists training_sessions_select on public.training_sessions;
drop policy if exists training_sessions_write on public.training_sessions;
drop policy if exists training_participants_select on public.training_participants;
drop policy if exists training_participants_write on public.training_participants;
drop policy if exists account_modules_select on public.account_modules;
drop policy if exists account_modules_write on public.account_modules;
drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_write on public.tasks;
drop policy if exists task_comments_select on public.task_comments;
drop policy if exists task_comments_write on public.task_comments;
drop policy if exists assignment_history_select on public.assignment_history;
drop policy if exists assignment_history_write on public.assignment_history;
drop policy if exists status_history_select on public.status_history;
drop policy if exists status_history_write on public.status_history;
drop policy if exists account_cs_owners_select on public.account_cs_owners;
drop policy if exists account_cs_owners_write on public.account_cs_owners;
drop policy if exists app_settings_admin on public.app_settings;

drop function if exists public.create_demo_request(uuid, date, date, uuid[], uuid[], text);
drop function if exists public.change_account_stage(uuid, text, text, uuid, text);
drop function if exists public.create_mkt_lead(text, text, text, text, uuid, uuid, text, integer, uuid[]);
drop function if exists public.create_sales_lead(text, text, text, text, uuid, text, integer, uuid[]);
drop function if exists public.can_modify_account(uuid);
drop function if exists public.can_access_account(uuid);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

create or replace function public.can_access_account(p_account_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_uid uuid;
  v_account public.accounts%rowtype;
begin
  v_uid := auth.uid();
  v_role := public.current_user_role();

  select * into v_account from public.accounts where id = p_account_id;

  if v_account.id is null then
    return false;
  end if;

  if v_role in ('admin','manager') then
    return true;
  end if;

  if v_role = 'mkt' then
    return v_account.source_type = 'mkt';
  end if;

  if v_role = 'sale' then
    return v_account.sale_owner_id = v_uid;
  end if;

  if v_role = 'cs' then
    return v_account.lifecycle_stage in ('demo','customer')
      or v_account.lost_from_stage in ('demo','customer')
      or exists (
        select 1
        from public.account_cs_owners owner
        where owner.account_id = p_account_id
          and owner.cs_user_id = v_uid
      );
  end if;

  return false;
end;
$$;

create or replace function public.can_modify_account(p_account_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_uid uuid;
  v_account public.accounts%rowtype;
begin
  v_uid := auth.uid();
  v_role := public.current_user_role();

  select * into v_account from public.accounts where id = p_account_id;

  if v_account.id is null then
    return false;
  end if;

  if v_role = 'admin' then
    return true;
  end if;

  if v_role = 'mkt' then
    return v_account.source_type = 'mkt' and v_account.lifecycle_stage = 'lead';
  end if;

  if v_role = 'sale' then
    return v_account.sale_owner_id = v_uid;
  end if;

  if v_role = 'cs' then
    return v_account.lifecycle_stage in ('demo','customer')
      or v_account.lost_from_stage in ('demo','customer');
  end if;

  return false;
end;
$$;

create or replace function public.log_account_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (
    old.lifecycle_stage is distinct from new.lifecycle_stage
    or old.lifecycle_status is distinct from new.lifecycle_status
  ) then
    insert into public.status_history (
      account_id,
      from_stage,
      to_stage,
      from_status,
      to_status,
      reason,
      changed_by
    )
    values (
      new.id,
      old.lifecycle_stage,
      new.lifecycle_stage,
      old.lifecycle_status,
      new.lifecycle_status,
      new.lost_note,
      auth.uid()
    );
  end if;

  return new;
end;
$$;

create or replace function public.set_training_session_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.session_no is null then
    select coalesce(max(session_no), 0) + 1
    into new.session_no
    from public.training_sessions
    where account_id = new.account_id;
  end if;

  return new;
end;
$$;

create or replace function public.log_demo_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.demo_logs (demo_session_id, account_id, log_type, message, created_by)
    values (new.id, new.account_id, 'created', 'Demo session created', auth.uid());
  elsif tg_op = 'UPDATE' then
    insert into public.demo_logs (demo_session_id, account_id, log_type, message, created_by)
    values (new.id, new.account_id, 'updated', 'Demo session updated', auth.uid());
  end if;

  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','lead_sources','campaigns','modules','contact_statuses','lost_reasons',
    'accounts','account_contacts','demo_sessions','customer_profiles','training_sessions','tasks'
  ]
  loop
    execute format('drop trigger if exists trg_touch_updated_at on public.%I', t);
    execute format('create trigger trg_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

drop trigger if exists trg_account_status_history on public.accounts;
create trigger trg_account_status_history
after update on public.accounts
for each row execute function public.log_account_status_change();

drop trigger if exists trg_training_session_no on public.training_sessions;
create trigger trg_training_session_no
before insert on public.training_sessions
for each row execute function public.set_training_session_no();

drop trigger if exists trg_demo_log on public.demo_sessions;
create trigger trg_demo_log
after insert or update on public.demo_sessions
for each row execute function public.log_demo_change();

create or replace function public.create_mkt_lead(
  p_company_name text default null,
  p_contact_name text default null,
  p_phone text default null,
  p_email text default null,
  p_lead_source_id uuid default null,
  p_campaign_id uuid default null,
  p_initial_note text default null,
  p_cars_estimate integer default null,
  p_module_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_uid uuid;
  v_account_id uuid;
  v_running_no bigint;
  v_sale_owner uuid;
  v_sales_count integer;
  v_next_index integer;
begin
  v_uid := auth.uid();
  v_role := public.current_user_role();

  if v_role not in ('admin','mkt') then
    raise exception 'permission denied';
  end if;

  if coalesce(nullif(trim(p_company_name), ''), nullif(trim(p_contact_name), ''), nullif(trim(p_phone), ''), nullif(trim(p_email), ''), nullif(trim(p_initial_note), '')) is null then
    raise exception 'lead minimum data is required';
  end if;

  select count(*) into v_sales_count
  from public.profiles
  where role = 'sale' and is_active = true;

  if v_sales_count = 0 then
    raise exception 'no active sale user for round-robin';
  end if;

  insert into public.app_settings(key, value)
  values ('round_robin_index', '{"index":0}'::jsonb)
  on conflict (key) do nothing;

  select coalesce((value->>'index')::integer, 0)
  into v_next_index
  from public.app_settings
  where key = 'round_robin_index'
  for update;

  select id
  into v_sale_owner
  from (
    select id, row_number() over (order by created_at, id) as rn
    from public.profiles
    where role = 'sale' and is_active = true
  ) sales
  where rn = (v_next_index % v_sales_count) + 1;

  update public.app_settings
  set value = jsonb_build_object('index', v_next_index + 1),
      updated_at = now()
  where key = 'round_robin_index';

  v_running_no := nextval('public.mkt_running_no_seq');

  insert into public.accounts (
    running_no,
    source_type,
    lifecycle_stage,
    lifecycle_status,
    company_name,
    lead_source_id,
    campaign_id,
    initial_note,
    product_interest,
    cars_estimate,
    sale_owner_id,
    created_by,
    mkt_created_by
  )
  values (
    v_running_no,
    'mkt',
    'lead',
    'assigned',
    nullif(trim(p_company_name), ''),
    p_lead_source_id,
    p_campaign_id,
    nullif(trim(p_initial_note), ''),
    nullif(trim(p_initial_note), ''),
    p_cars_estimate,
    v_sale_owner,
    v_uid,
    v_uid
  )
  returning id into v_account_id;

  if coalesce(nullif(trim(p_contact_name), ''), nullif(trim(p_phone), ''), nullif(trim(p_email), '')) is not null then
    insert into public.account_contacts (account_id, contact_name, phone, email, is_primary, created_by)
    values (v_account_id, nullif(trim(p_contact_name), ''), nullif(trim(p_phone), ''), nullif(trim(p_email), ''), true, v_uid);
  end if;

  if p_initial_note is not null and trim(p_initial_note) <> '' then
    insert into public.account_activities (account_id, activity_type, title, content, created_by)
    values (v_account_id, 'mkt_update', 'MKT initial note', p_initial_note, v_uid);
  end if;

  if array_length(p_module_ids, 1) is not null then
    insert into public.account_modules (account_id, module_id, module_type)
    select v_account_id, module_id, 'interested'
    from unnest(p_module_ids) as module_id
    on conflict do nothing;
  end if;

  insert into public.assignment_history (account_id, to_user_id, assignment_type, assigned_by)
  values (v_account_id, v_sale_owner, 'round_robin', v_uid);

  return v_account_id;
end;
$$;

create or replace function public.create_sales_lead(
  p_company_name text default null,
  p_contact_name text default null,
  p_phone text default null,
  p_email text default null,
  p_contact_status_id uuid default null,
  p_initial_note text default null,
  p_cars_estimate integer default null,
  p_module_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_uid uuid;
  v_account_id uuid;
begin
  v_uid := auth.uid();
  v_role := public.current_user_role();

  if v_role not in ('admin','sale') then
    raise exception 'permission denied';
  end if;

  if coalesce(nullif(trim(p_company_name), ''), nullif(trim(p_contact_name), ''), nullif(trim(p_phone), ''), nullif(trim(p_email), ''), nullif(trim(p_initial_note), '')) is null then
    raise exception 'lead minimum data is required';
  end if;

  insert into public.accounts (
    source_type,
    lifecycle_stage,
    lifecycle_status,
    company_name,
    contact_status_id,
    initial_note,
    product_interest,
    cars_estimate,
    sale_owner_id,
    created_by
  )
  values (
    'sales_self',
    'lead',
    'new',
    nullif(trim(p_company_name), ''),
    p_contact_status_id,
    nullif(trim(p_initial_note), ''),
    nullif(trim(p_initial_note), ''),
    p_cars_estimate,
    v_uid,
    v_uid
  )
  returning id into v_account_id;

  if coalesce(nullif(trim(p_contact_name), ''), nullif(trim(p_phone), ''), nullif(trim(p_email), '')) is not null then
    insert into public.account_contacts (account_id, contact_name, phone, email, is_primary, created_by)
    values (v_account_id, nullif(trim(p_contact_name), ''), nullif(trim(p_phone), ''), nullif(trim(p_email), ''), true, v_uid);
  end if;

  if p_initial_note is not null and trim(p_initial_note) <> '' then
    insert into public.account_activities (account_id, activity_type, title, content, created_by)
    values (v_account_id, 'sale_update', 'Sale initial note', p_initial_note, v_uid);
  end if;

  if array_length(p_module_ids, 1) is not null then
    insert into public.account_modules (account_id, module_id, module_type)
    select v_account_id, module_id, 'interested'
    from unnest(p_module_ids) as module_id
    on conflict do nothing;
  end if;

  return v_account_id;
end;
$$;

create or replace function public.create_demo_request(
  p_account_id uuid,
  p_start_date date,
  p_end_date date,
  p_module_ids uuid[] default '{}'::uuid[],
  p_cs_owner_ids uuid[] default '{}'::uuid[],
  p_requirement_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_demo_id uuid;
  v_sale_owner uuid;
begin
  if not public.can_modify_account(p_account_id) then
    raise exception 'permission denied';
  end if;

  select sale_owner_id into v_sale_owner
  from public.accounts
  where id = p_account_id;

  insert into public.demo_sessions (
    account_id,
    requested_by,
    sale_owner_id,
    demo_status,
    start_date,
    end_date,
    requirement_note,
    created_by
  )
  values (
    p_account_id,
    auth.uid(),
    v_sale_owner,
    'requested',
    p_start_date,
    p_end_date,
    p_requirement_note,
    auth.uid()
  )
  returning id into v_demo_id;

  update public.accounts
  set lifecycle_stage = 'demo',
      lifecycle_status = 'demo_requested'
  where id = p_account_id;

  if array_length(p_module_ids, 1) is not null then
    insert into public.account_modules (account_id, module_id, module_type)
    select p_account_id, module_id, 'demo'
    from unnest(p_module_ids) as module_id
    on conflict do nothing;
  end if;

  if array_length(p_cs_owner_ids, 1) is not null then
    insert into public.account_cs_owners (account_id, cs_user_id, created_by)
    select p_account_id, cs_user_id, auth.uid()
    from unnest(p_cs_owner_ids) as cs_user_id
    on conflict do nothing;
  end if;

  return v_demo_id;
end;
$$;

create or replace function public.change_account_stage(
  p_account_id uuid,
  p_to_stage text,
  p_to_status text,
  p_lost_reason_id uuid default null,
  p_lost_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.accounts%rowtype;
begin
  if p_to_stage not in ('lead','demo','customer','lost') then
    raise exception 'invalid lifecycle stage';
  end if;

  if not public.can_modify_account(p_account_id) then
    raise exception 'permission denied';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id;

  update public.accounts
  set lifecycle_stage = p_to_stage,
      lifecycle_status = coalesce(p_to_status, p_to_stage),
      lost_reason_id = case when p_to_stage = 'lost' then p_lost_reason_id else null end,
      lost_note = case when p_to_stage = 'lost' then p_lost_note else null end,
      lost_from_stage = case when p_to_stage = 'lost' then v_account.lifecycle_stage else null end,
      converted_to_customer_at = case
        when p_to_stage = 'customer' and converted_to_customer_at is null then now()
        else converted_to_customer_at
      end
  where id = p_account_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.lead_sources enable row level security;
alter table public.campaigns enable row level security;
alter table public.modules enable row level security;
alter table public.contact_statuses enable row level security;
alter table public.lost_reasons enable row level security;
alter table public.accounts enable row level security;
alter table public.account_contacts enable row level security;
alter table public.account_activities enable row level security;
alter table public.demo_sessions enable row level security;
alter table public.demo_users enable row level security;
alter table public.demo_logs enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_participants enable row level security;
alter table public.account_modules enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.assignment_history enable row level security;
alter table public.status_history enable row level security;
alter table public.account_cs_owners enable row level security;
alter table public.app_settings enable row level security;

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or public.current_user_role() in ('admin','mkt','sale','cs','manager'));

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists master_select_lead_sources on public.lead_sources;
create policy master_select_lead_sources on public.lead_sources
for select to authenticated
using (is_active = true or public.is_admin());

drop policy if exists master_write_lead_sources on public.lead_sources;
create policy master_write_lead_sources on public.lead_sources
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists master_select_campaigns on public.campaigns;
create policy master_select_campaigns on public.campaigns
for select to authenticated
using (is_active = true or public.is_admin());

drop policy if exists master_write_campaigns on public.campaigns;
create policy master_write_campaigns on public.campaigns
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists master_select_modules on public.modules;
create policy master_select_modules on public.modules
for select to authenticated
using (is_active = true or public.is_admin());

drop policy if exists master_write_modules on public.modules;
create policy master_write_modules on public.modules
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists master_select_contact_statuses on public.contact_statuses;
create policy master_select_contact_statuses on public.contact_statuses
for select to authenticated
using (is_active = true or public.is_admin());

drop policy if exists master_write_contact_statuses on public.contact_statuses;
create policy master_write_contact_statuses on public.contact_statuses
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists master_select_lost_reasons on public.lost_reasons;
create policy master_select_lost_reasons on public.lost_reasons
for select to authenticated
using (is_active = true or public.is_admin());

drop policy if exists master_write_lost_reasons on public.lost_reasons;
create policy master_write_lost_reasons on public.lost_reasons
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists accounts_select on public.accounts;
create policy accounts_select on public.accounts
for select to authenticated
using (public.can_access_account(id));

drop policy if exists accounts_insert on public.accounts;
create policy accounts_insert on public.accounts
for insert to authenticated
with check (
  public.is_admin()
  or (public.current_user_role() = 'sale' and source_type = 'sales_self' and sale_owner_id = auth.uid())
  or (public.current_user_role() = 'mkt' and source_type = 'mkt' and mkt_created_by = auth.uid())
);

drop policy if exists accounts_update on public.accounts;
create policy accounts_update on public.accounts
for update to authenticated
using (public.can_modify_account(id))
with check (public.can_modify_account(id));

drop policy if exists accounts_delete on public.accounts;
create policy accounts_delete on public.accounts
for delete to authenticated
using (public.is_admin());

drop policy if exists account_contacts_select on public.account_contacts;
create policy account_contacts_select on public.account_contacts
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists account_contacts_write on public.account_contacts;
create policy account_contacts_write on public.account_contacts
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists account_activities_select on public.account_activities;
create policy account_activities_select on public.account_activities
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists account_activities_write on public.account_activities;
create policy account_activities_write on public.account_activities
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists demo_sessions_select on public.demo_sessions;
create policy demo_sessions_select on public.demo_sessions
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists demo_sessions_write on public.demo_sessions;
create policy demo_sessions_write on public.demo_sessions
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists demo_users_select on public.demo_users;
create policy demo_users_select on public.demo_users
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists demo_users_write on public.demo_users;
create policy demo_users_write on public.demo_users
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists demo_logs_select on public.demo_logs;
create policy demo_logs_select on public.demo_logs
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists demo_logs_write on public.demo_logs;
create policy demo_logs_write on public.demo_logs
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists customer_profiles_select on public.customer_profiles;
create policy customer_profiles_select on public.customer_profiles
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists customer_profiles_write on public.customer_profiles;
create policy customer_profiles_write on public.customer_profiles
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists training_sessions_select on public.training_sessions;
create policy training_sessions_select on public.training_sessions
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists training_sessions_write on public.training_sessions;
create policy training_sessions_write on public.training_sessions
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists training_participants_select on public.training_participants;
create policy training_participants_select on public.training_participants
for select to authenticated
using (
  exists (
    select 1 from public.training_sessions ts
    where ts.id = training_session_id
      and public.can_access_account(ts.account_id)
  )
);

drop policy if exists training_participants_write on public.training_participants;
create policy training_participants_write on public.training_participants
for all to authenticated
using (
  exists (
    select 1 from public.training_sessions ts
    where ts.id = training_session_id
      and public.can_modify_account(ts.account_id)
  )
)
with check (
  exists (
    select 1 from public.training_sessions ts
    where ts.id = training_session_id
      and public.can_modify_account(ts.account_id)
  )
);

drop policy if exists account_modules_select on public.account_modules;
create policy account_modules_select on public.account_modules
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists account_modules_write on public.account_modules;
create policy account_modules_write on public.account_modules
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks
for all to authenticated
using (public.can_modify_account(account_id) or assigned_to = auth.uid())
with check (public.can_modify_account(account_id) or assigned_to = auth.uid());

drop policy if exists task_comments_select on public.task_comments;
create policy task_comments_select on public.task_comments
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists task_comments_write on public.task_comments;
create policy task_comments_write on public.task_comments
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists assignment_history_select on public.assignment_history;
create policy assignment_history_select on public.assignment_history
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists assignment_history_write on public.assignment_history;
create policy assignment_history_write on public.assignment_history
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists status_history_select on public.status_history;
create policy status_history_select on public.status_history
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists status_history_write on public.status_history;
create policy status_history_write on public.status_history
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists account_cs_owners_select on public.account_cs_owners;
create policy account_cs_owners_select on public.account_cs_owners
for select to authenticated
using (public.can_access_account(account_id));

drop policy if exists account_cs_owners_write on public.account_cs_owners;
create policy account_cs_owners_write on public.account_cs_owners
for all to authenticated
using (public.can_modify_account(account_id))
with check (public.can_modify_account(account_id));

drop policy if exists app_settings_admin on public.app_settings;
create policy app_settings_admin on public.app_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.lead_sources (name)
values ('Website'), ('Ads'), ('Event'), ('Referral'), ('Outbound'), ('Other')
on conflict (name) do nothing;

insert into public.campaigns (name)
values ('General'), ('Q1 Campaign'), ('Q2 Campaign'), ('Q3 Campaign'), ('Q4 Campaign')
on conflict (name) do nothing;

insert into public.modules (module_name)
values ('Fleet Management'), ('GPS Tracking'), ('Maintenance'), ('Fuel Management'), ('Driver Management'), ('Billing'), ('Reports')
on conflict (module_name) do nothing;

insert into public.contact_statuses (name, sort_order)
values ('new', 10), ('contacted', 20), ('follow_up', 30), ('interested', 40), ('waiting_decision', 50), ('no_answer', 60)
on conflict (name) do nothing;

insert into public.lost_reasons (reason_name, applies_to_stage)
values
  ('ติดต่อไม่ได้', 'lead'),
  ('ไม่สนใจ', 'any'),
  ('ข้อมูลซ้ำ', 'lead'),
  ('ไม่ตรงกลุ่มเป้าหมาย', 'lead'),
  ('ราคาไม่เหมาะสม', 'demo'),
  ('เลือกคู่แข่ง', 'demo'),
  ('ยกเลิกใช้งาน', 'customer')
on conflict (reason_name) do nothing;

insert into public.app_settings(key, value)
values ('round_robin_index', '{"index":0}'::jsonb)
on conflict (key) do nothing;

-- First admin seed:
-- 1) Create user in Supabase Auth
-- 2) Copy User UID from Auth users
-- 3) Replace FIRST_ADMIN_USER_ID and FIRST_ADMIN_EMAIL, then run only this block
/*
insert into public.profiles (id, email, display_name, role, is_active)
values (
  'FIRST_ADMIN_USER_ID',
  'FIRST_ADMIN_EMAIL',
  'First Admin',
  'admin',
  true
)
on conflict (id) do update
set role = 'admin',
    is_active = true,
    email = excluded.email,
    display_name = excluded.display_name,
    updated_at = now();
*/

commit;```

## 9. Deploy Steps

### 9.1 Supabase

1. Create Supabase project
2. Create first user in Supabase Auth
3. Run SQL setup above
4. Run first admin seed block with real Auth UID
5. Go to app, login as first admin
6. In Admin page, set active Sale/MKT/CS/Manager users
7. Add master data: Lead Sources, Campaigns, Modules, Contact Statuses, Lost Reasons

### 9.2 GitHub Pages

1. Create GitHub repo
2. Add only these files:
   - `README.md`
   - `index.html`
   - `script.js`
   - `style.css`
3. Edit Supabase config in `script.js`
4. Commit and push to `main`
5. In GitHub repository settings, enable GitHub Pages from branch `main` and root folder
6. Open published URL

## 10. Git Commands

```bash
git init
git add README.md index.html script.js style.css
git commit -m "release: internal crm ops v1.0.0"
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

## 11. Test Checklist

### Already checked in this package

```bash
node --check script.js
```

Result: syntax check passed.

### Manual checks required after Supabase setup

- Login/logout
- Pending user blocked until Admin activates
- Admin can update role/is_active
- MKT creates lead with no company name but minimum data
- MKT lead gets numeric running_no starting from 1
- MKT lead is assigned to active Sale by round-robin
- Sale sees only own accounts
- Sale can update own lead
- Sale can request demo
- CS sees demo/customer/team tasks
- Demo users can be added
- Demo notes/logs save
- Training session_no defaults by account and can be edited
- Convert customer creates/updates customer profile
- Mark lost records lost reason and lost_from_stage
- Manager can view report but cannot save changes
- Board / Calendar / List / Table / Timeline views render
- GitHub Pages hard refresh works

## 12. Rollback

### Frontend rollback

```bash
git revert <commit_sha>
git push
```

หรือ restore 4 ไฟล์จาก release ก่อนหน้า

### Database rollback note

SQL setup นี้สร้างตารางและ policy ใหม่จำนวนมาก ยังไม่ได้ให้ destructive rollback อัตโนมัติ เพราะอาจลบข้อมูลจริง

ถ้าต้อง rollback หลังมีข้อมูล production:
1. Export backup จาก Supabase ก่อน
2. ปิด GitHub Pages หรือ revert frontend ก่อน
3. ตรวจข้อมูลที่ถูกสร้างใน tables ใหม่
4. ถ้าต้องลบ schema ให้ทำแบบ manual หลัง backup เท่านั้น

## 13. Known Limitations

- ไม่มี server-side backend นอก Supabase RPC
- ไม่มี file upload
- ไม่มี drag-and-drop จริงใน Kanban
- Timeline/Gantt เป็นมุมมองเบื้องต้น ไม่ใช่ Gantt engine เต็มรูปแบบ
- Demo password ถูกเก็บเป็น text ตาม requirement ว่าเป็นข้อมูลจดบันทึกภายใน ไม่ใช่ secret จริง
- Frontend column-level permission ใช้ UI คุมร่วมกับ RLS ระดับ row; ถ้าต้องล็อก column-level แบบเข้มมาก ต้องเพิ่ม RPC เฉพาะ action
- ยังไม่ได้ทดสอบกับ Supabase project จริงในสภาพแวดล้อมนี้

## 14. Changelog

### v1.0.2

- Hotfix frontend form busy state.
- Fixed login and other forms sending empty `FormData` because inputs/selects/textareas were disabled before reading values.
- `setFormBusy()` now disables only buttons and uses `form.dataset.busy` to prevent double submit.
- Updated GitHub Pages cache-busting query strings to `v=1.0.2`.

### v1.0.1

- Hotfix SQL setup for rerun safety on Supabase.
- Added preflight drop for RLS policies and parameterized helper functions before recreating them.
- Fixes PostgreSQL error: `cannot change name of input parameter "target_account_id"` when an older `can_access_account(uuid)` function already exists.

### v1.0.0

- Initial full schema
- Supabase Auth + profiles role model
- RLS policies for Admin/MKT/Sale/CS/Manager
- MKT lead creation with numeric running_no and round-robin Sale assignment
- Sale-created Lead without running_no
- Lead/Demo/Customer/Lost lifecycle
- Demo sessions, demo users, demo logs
- Customer profiles with cars/modules/billing/engagement
- Training sessions and participants schema
- Tasks and task comments
- Master data management for sources, campaigns, modules, contact statuses, lost reasons
- Board, Calendar, List, Table, Timeline views
- GitHub Pages-ready frontend with 4 files only
