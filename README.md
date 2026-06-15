# CRM Central

Current version: **v0.1.2**

CRM web app สำหรับบริหาร **Lead → Demo → Customer → CS Task → Dashboard**  
Frontend ใช้ **GitHub Pages** และ backend ใช้ **Supabase Auth + Postgres + RLS**

Repo นี้ตั้งใจให้มีเพียง 4 ไฟล์เท่านั้น:

```text
README.md
index.html
script.js
style.css
```

---

## Changelog

### v0.1.2
- UI: required fields แสดง `*` สีแดง
- CS Task: รองรับการเลือก `Demo Session` ตอนสร้าง/แก้ไขงาน และแสดง Demo Session ในตาราง/รายละเอียด Task
- Admin: เพิ่มคำอธิบายในหน้า Admin ว่าการสร้าง Sale / CS ต้องสร้าง Auth user ใน Supabase ก่อน แล้วค่อยแก้ role/profile ในระบบ
- SQL delivery: แยกไฟล์ SQL ไว้นอก repo เพื่อให้ copy ไปรันใน Supabase SQL Editor ได้ง่าย
- README: อัปเดตขั้นตอน SQL และระบุ hotfix RLS recursion เป็น v0.1.2

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

## SQL Files

ไฟล์ SQL สำหรับรันใน Supabase จะส่งแยกเป็นโฟลเดอร์ `sql/` นอก repo เพื่อให้คัดลอกไปรันง่าย  
ไม่ต้อง commit โฟลเดอร์ `sql/` ขึ้น GitHub ถ้าต้องการให้ repo มีแค่ 4 ไฟล์

```text
sql/
  001_schema_v0.1.2_full.sql
  002_promote_first_admin.sql
  003_hotfix_rls_recursion_v0.1.2.sql
```

สำหรับ project ที่รัน v0.1.1 ผ่านแล้ว ให้รันเฉพาะ:

```text
003_hotfix_rls_recursion_v0.1.2.sql
```

ถ้าเคยรัน hotfix recursion ที่ส่งในแชทไปแล้ว ไม่ต้องรันซ้ำก็ได้ แต่ไฟล์นี้ออกแบบให้รันซ้ำได้

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

แล้วรัน SQL จากไฟล์ที่ส่งแยกในโฟลเดอร์ `sql/`

---

## Database Schema + RLS SQL

SQL เต็มถูกแยกไว้ในโฟลเดอร์ `sql/` ที่ส่งคู่กับ release นี้ เพื่อให้ copy ไปรันใน Supabase SQL Editor ได้ง่าย และไม่ต้อง commit เข้า repo

### Fresh setup

รันไฟล์นี้เมื่อเป็น Supabase project ใหม่ หรือยังไม่มีข้อมูลจริง:

```text
sql/001_schema_v0.1.2_full.sql
```

### Existing project ที่รัน v0.1.1 แล้ว

รันไฟล์นี้เพื่อแก้ policy recursion และอัปเดต RLS เป็น v0.1.2:

```text
sql/003_hotfix_rls_recursion_v0.1.2.sql
```

ไฟล์นี้ออกแบบให้รันซ้ำได้ โดย `drop policy if exists` ก่อนสร้าง policy ใหม่ และไม่ลบข้อมูลเดิม

### Current tables

```text
profiles
accounts
demo_sessions
cs_tasks
app_events
app_settings
```

### Key RLS helper

```text
current_user_role()
is_admin()
is_management_or_admin()
can_access_account(target_account_id)
```

`can_access_account()` ใช้เป็น helper กลางเพื่อลดการเขียน policy ที่ query ย้อนกันจนเกิด infinite recursion

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

## Add Users / สร้าง Sale และ CS

การสร้าง Sale / CS ทำที่ Supabase ก่อน เพราะ GitHub Pages ใช้ anon key และไม่ควรสร้าง password จาก frontend โดยตรง

ขั้นตอน:
1. Supabase Dashboard → Authentication → Users → Add user
2. สร้าง email/password หรือส่ง invite ให้ user
3. Login ด้วย Admin ใน Web App
4. เข้าเมนู **Admin**
5. กดแก้ไข user เพื่อกำหนด:

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
git commit -m "Release v0.1.2 CRM Central"
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
git commit -m "Release v0.1.2 CRM Central"
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
15. สร้าง CS Task โดยเลือก Account หรือ Demo Session / ปิด Task
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
