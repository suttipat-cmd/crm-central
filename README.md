# CRM Central

Current version: **v0.1.3**

CRM web app สำหรับบริหาร **Lead → Demo → Customer → CS Task → Dashboard**  
Frontend ใช้ **GitHub Pages** และ backend ใช้ **Supabase Auth + Postgres + RLS**

Repo นี้ตั้งใจให้มีเพียง 4 ไฟล์เท่านั้น:

```text
README.md
index.html
script.js
style.css
```

ไฟล์ SQL จะส่งแยกเป็น ZIP/โฟลเดอร์สำหรับคัดลอกไปรันใน Supabase SQL Editor และไม่จำเป็นต้อง commit เข้า repo

---

## Changelog

### v0.1.3
- Database: เพิ่ม `staff_members` สำหรับสร้างรายชื่อ Sale / CS แยกจาก Login User
- Admin: เพิ่มปุ่มสร้าง/แก้ไข Sale และ CS จากหน้า Admin
- Owner assignment: `Sales Owner` / `CS Owner` ใช้ข้อมูลจาก `staff_members`
- Auth separation: Login User ยังต้องสร้างใน Supabase Authentication เท่านั้น
- UX: เพิ่ม Global Loading Overlay ตรงกลางจอ พร้อมพื้นหลังเบลอ
- UX: แก้ required `*` สีแดงให้อยู่บรรทัดเดียวกับ label ไม่ตกบรรทัด
- CS Task: ยังรองรับการเลือก `Demo Session` และ auto ผูก `account_id` จาก demo session
- SQL delivery: เพิ่มไฟล์ migration `003_migrate_staff_members_v0.1.3.sql`

### v0.1.2
- UI: required fields แสดง `*` สีแดง
- CS Task: รองรับการเลือก `Demo Session` ตอนสร้าง/แก้ไขงาน และแสดง Demo Session ในตาราง/รายละเอียด Task
- SQL delivery: แยกไฟล์ SQL ไว้นอก repo เพื่อให้ copy ไปรันใน Supabase SQL Editor ได้ง่าย
- RLS: เพิ่ม hotfix ลดปัญหา infinite recursion ผ่าน `can_access_account()`

### v0.1.1
- Hotfix SQL: ย้ายการสร้าง helper functions ที่อ้าง `public.profiles` ไปหลังการสร้าง table เพื่อแก้ error `relation "public.profiles" does not exist`

### v0.1.0
- เปลี่ยนจาก prototype `localStorage` เป็น GitHub Pages + Supabase
- รวม Lead / Demo / Customer เป็น `accounts`
- แยก `demo_sessions` เพราะ 1 account สามารถ demo ได้หลายรอบ
- เพิ่ม `cs_tasks`, `app_events`, `app_settings`
- เพิ่ม Supabase Auth login และ RLS ตาม role

---

## Current Flow

```text
Admin
  → สร้าง Login User ที่ Supabase Authentication เท่านั้น
  → สร้าง/แก้ไขรายชื่อ Sale และ CS ในหน้า Admin ของระบบ
  → กำหนด role ของ Login User เช่น marketing, sales, cs, management, admin
  → จัดการ staff active และ sales_queue_order

Marketing สร้าง Lead
  → ระบบออก marketing_lead_no เช่น 0, 1, 2, 3...
  → Auto assign ไปยัง Sale ที่ active ใน staff_members แบบ round-robin
  → Account stage = lead

Sales สร้าง Lead เอง
  → ไม่มี marketing_lead_no
  → sales_owner_id อ้างอิง Sale ใน staff_members
  → Account stage = lead

Sales ติดต่อ Lead
  → บันทึก note / update status
  → ตัดจบ Lost
  → ส่ง Demo
  → หรือปิดเป็น Customer ได้ทันที

Demo
  → 1 Account มี Demo Session ได้หลายรอบ
  → Demo รอบใหม่ default ใช้ CS Owner เดิม
  → Lost After Demo หรือ Won / Converted

CS
  → รับ Demo Lead / Customer
  → สร้าง Customer เองได้
  → Customer ทุก record ต้องมี Sales Owner
  → สร้าง CS Task โดยผูก Account หรือ Demo Session ได้
  → ปิด CS Task

Management
  → ดู Dashboard
  → ดู Report / Performance
  → Export CSV
```

---

## Important Concept: Login User vs Sale / CS Staff

ระบบแยกข้อมูลเป็น 2 ชั้น:

```text
profiles
- คือ user ที่ login ผ่าน Supabase Auth
- ใช้ควบคุม permission / role ในระบบ
- ต้องสร้างจาก Supabase Authentication เท่านั้น

staff_members
- คือรายชื่อ Sale / CS สำหรับ assign lead, demo, customer, task
- Admin สร้างและแก้ไขได้จากหน้า Admin ในระบบ
- ไม่จำเป็นต้องเป็น user ที่ login ได้
```

ถ้าคนเดียวกันต้องทั้งถูก assign งานและ login เข้าใช้งานเอง ให้ตั้ง email ใน `staff_members` ให้ตรงกับ email ของ Supabase Auth user เพื่อให้ RLS จับคู่สิทธิ์ได้

---

## Files

```text
index.html
- HTML shell
- โหลด style.css
- โหลด Supabase JS ผ่าน CDN
- โหลด script.js
- มี global loading overlay

style.css
- Layout, sidebar, table, modal, form, dashboard, responsive
- Required star style
- Loading overlay / spinner

script.js
- Supabase client config
- Auth
- Router/render
- Accounts
- Demo Sessions
- CS Tasks
- Activity
- Admin
- Staff Members
- Export CSV
- Global loading state

README.md
- Current system spec
- Database schema
- RLS summary
- Setup
- Deploy
- Rollback
```

---

## Required Configuration

เปิด `script.js` แล้วตรวจ 2 ค่านี้:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

ใช้ได้เฉพาะ **anon key** เท่านั้น  
ห้ามใส่ `service_role key` ใน frontend หรือ repo

---

## SQL Files

ไฟล์ SQL สำหรับรันใน Supabase จะส่งแยกเป็นโฟลเดอร์ `sql/` นอก repo

```text
sql/
  001_schema_v0.1.3_full.sql
  002_promote_first_admin.sql
  003_migrate_staff_members_v0.1.3.sql
```

### Existing project ที่ใช้งาน v0.1.2 แล้ว

รันเฉพาะ:

```text
sql/003_migrate_staff_members_v0.1.3.sql
```

ไฟล์นี้:
- สร้าง `staff_members`
- migrate Sales / CS เดิมจาก `profiles` ไปเป็น staff
- เปลี่ยน foreign key ของ owner fields ให้ชี้ไปที่ `staff_members`
- อัปเดต RPC `create_marketing_account()`
- อัปเดต RLS helper และ policies
- ไม่ลบข้อมูลเดิม

### Fresh setup project ใหม่

รัน:

```text
sql/001_schema_v0.1.3_full.sql
```

จากนั้นสร้าง admin user ใน Supabase Authentication แล้วรัน:

```text
sql/002_promote_first_admin.sql
```

---

## Current Database Schema

### profiles

Login user profile ที่ผูกกับ Supabase Auth

```text
id uuid PK references auth.users(id)
email text
full_name text
role text check marketing/sales/cs/management/admin
is_active boolean
sales_queue_order integer legacy nullable
created_at timestamptz
updated_at timestamptz
```

> ตั้งแต่ v0.1.3 ไม่ใช้ `profiles.sales_queue_order` เป็นคิว assign หลักแล้ว แต่ยังคงไว้เพื่อ backward compatibility

### staff_members

รายชื่อ Sale / CS ที่ใช้ assign งาน

```text
id uuid PK
full_name text not null
role text check sales/cs
phone text
email text
is_active boolean
sales_queue_order integer
linked_profile_id uuid nullable references profiles(id)
created_by uuid references profiles(id)
created_at timestamptz
updated_at timestamptz
```

### accounts

Account หลักที่แทน Lead / Demo / Customer / Closed

```text
id uuid PK
marketing_lead_no integer unique nullable
origin text check marketing/sales/cs
lifecycle_stage text check lead/demo/customer/closed
company_name text not null
contact_name text
phone text
email text
line_id text
province text
business_type text
lead_source text
campaign text
sales_owner_id uuid references staff_members(id)
cs_owner_id uuid references staff_members(id)
lead_status text
customer_status text
priority text
next_action text
next_followup_date date
last_contact_date date
product_package text
customer_start_date date
notes text
created_by uuid references profiles(id)
created_at timestamptz
updated_at timestamptz
```

Constraint สำคัญ:

```text
Customer ทุก record ต้องมี sales_owner_id
```

### demo_sessions

Demo แต่ละรอบของ Account

```text
id uuid PK
account_id uuid references accounts(id)
demo_no integer
cs_owner_id uuid references staff_members(id)
status text
demo_date date
demo_time time
demo_result text
pain_point text
next_followup_date date
notes text
created_by uuid references profiles(id)
created_at timestamptz
updated_at timestamptz
closed_at timestamptz
unique(account_id, demo_no)
```

### cs_tasks

งาน CS ที่ผูก Account หรือ Demo Session ได้

```text
id uuid PK
account_id uuid references accounts(id)
demo_session_id uuid nullable references demo_sessions(id)
task_name text not null
cs_owner_id uuid references staff_members(id)
task_type text
status text
priority text
due_date date
blocker text
notes text
created_by uuid references profiles(id)
created_at timestamptz
updated_at timestamptz
closed_at timestamptz
```

### app_events

รวม note / audit / notification

```text
id uuid PK
event_type text
title text
message text
account_id uuid nullable
demo_session_id uuid nullable
task_id uuid nullable
assigned_to_id uuid nullable references profiles(id)
is_read boolean
metadata jsonb
created_by uuid references profiles(id)
created_at timestamptz
```

### app_settings

Counter และ config เล็ก ๆ

```text
key text PK
value jsonb
updated_at timestamptz
```

Keys หลัก:

```text
marketing_lead_counter
sales_round_robin_pointer
```

---

## RLS / Permission Summary

```text
profiles
- authenticated select
- admin insert/update

staff_members
- authenticated select
- admin insert/update

accounts
- admin/management เห็นทั้งหมด
- creator เห็น record ที่ตัวเองสร้าง
- sales/cs เห็น record ที่ staff_members email ตรงกับ login email หรือ linked_profile_id ตรงกับตัวเอง
- customer ต้องมี sales_owner_id

demo_sessions / cs_tasks
- ดูและแก้ตาม account access หรือ staff owner ที่เกี่ยวข้อง
- admin ทำได้ทั้งหมด

app_events
- admin/management เห็นทั้งหมด
- creator / assigned_to เห็นของตัวเอง
- เห็น event ที่ผูก account ที่ตัวเอง access ได้

app_settings
- admin เท่านั้น
```

RLS helper หลัก:

```text
current_user_role()
is_admin()
is_management_or_admin()
current_user_staff_ids()
can_access_account(target_account_id)
```

---

## Create First Admin

1. ไปที่ Supabase Dashboard
2. เข้า **Authentication → Users**
3. กด **Add user**
4. ใส่ email ของคุณ
5. ตั้ง password เอง หรือใช้ invite/reset password
6. กลับไป SQL Editor แล้วรัน `sql/002_promote_first_admin.sql`
7. แก้ email ใน SQL เป็น email จริงก่อนรัน

> ห้ามส่ง password ในแชทหรือ commit ลง repo

---

## Add Sale / CS Staff

ทำในหน้าเว็บหลัง login ด้วย Admin:

```text
Admin → Sale / CS Staff → + Sale หรือ + CS
```

ข้อมูลที่กรอก:

```text
ชื่อ
Role: sales / cs
Phone
Email
Active
Sales Queue Order
```

สำหรับ Marketing auto assign:
- ต้องมี staff role = `sales`
- `is_active = true`
- ใส่ `sales_queue_order` เช่น 1, 2, 3

---

## Add Login Users

Login User ยังต้องสร้างที่ Supabase:

```text
Supabase Dashboard → Authentication → Users → Add user
```

หลังจาก user ถูกสร้างแล้ว ให้ Admin เข้าเว็บ:

```text
Admin → Login Users → แก้ไข role / active
```

ถ้า user นั้นต้องเห็นงานที่ assign ให้ Sale/CS ของตัวเอง ให้กรอก email ใน `staff_members` ให้ตรงกับ email ของ login user

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

## VS Code Push Commands

กรณีมี repo อยู่แล้ว:

```bash
cd crm-central

# วาง 4 ไฟล์ล่าสุดลงใน repo:
# README.md
# index.html
# script.js
# style.css

git status
git add README.md index.html script.js style.css
git commit -m "Release v0.1.3 CRM Central"
git push origin main
```

กรณียังไม่ได้ clone:

```bash
git clone https://github.com/suttipat-cmd/crm-central.git
cd crm-central

# วาง 4 ไฟล์ล่าสุดลงใน repo

git status
git add README.md index.html script.js style.css
git commit -m "Release v0.1.3 CRM Central"
git push origin main
```

---

## Manual Test Checklist

หลังรัน SQL และ push code แล้วให้ทดสอบ:

```text
1. Login ด้วย Admin
2. เข้า Admin
3. สร้าง Sale อย่างน้อย 1 คน
4. สร้าง CS อย่างน้อย 1 คน
5. ตรวจว่า Sale / CS ไม่ต้องเป็น Login User ก็ถูกเลือกใน owner dropdown ได้
6. สร้าง Marketing Lead
7. ตรวจว่า marketing_lead_no รันต่อ และ auto assign ไปยัง Sale ใน staff_members
8. สร้าง / แก้ไข Account แล้ว required * อยู่บรรทัดเดียวกับ label
9. สร้าง Demo Session และเลือก CS Owner จาก staff_members
10. สร้าง CS Task โดยเลือก Demo Session
11. ตรวจว่า account_id ถูกผูกจาก Demo Session อัตโนมัติ
12. กด refresh / save / export / mark notification read แล้วเห็น loading overlay
13. Export CSV จาก Admin / Management
```

---

## Rollback

Frontend rollback:

```bash
git log --oneline
git revert <commit_hash>
git push origin main
```

Database rollback หลังรัน v0.1.3 migration:
- ถ้ายังเป็นข้อมูลทดสอบ สามารถ restore project หรือ recreate schema ได้
- ถ้ามีข้อมูลจริงแล้ว ห้าม drop table ทันที
- ให้ backup ก่อนทุกครั้ง

Rollback แบบ safe ควรทำ migration เฉพาะจุด เช่น:
- คืน foreign key owner fields ไปที่ `profiles`
- คง `staff_members` ไว้เป็น archive ก่อน ไม่ลบทันที

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
- Staff/Login matching ใช้ linked_profile_id หรือ email ที่ตรงกัน
- Frontend ใช้ Supabase anon key ได้ตามปกติ แต่ห้ามใช้ service_role key
```

---

## Security Notes

```text
- เปิด RLS ทุก table ที่ frontend เข้าถึง
- ใช้ Supabase Auth เป็น identity
- ใช้ profiles.id เป็น login user source of truth
- ใช้ staff_members.id เป็น Sales/CS assignment source of truth
- Customer ทุก record บังคับ sales_owner_id
- Marketing Lead No. และ round-robin ทำผ่าน RPC เพื่อกันเลขชน
- README ไม่มี password/token/service_role key
```
