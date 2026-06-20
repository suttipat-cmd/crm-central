# Internal CRM Ops

Current version: `1.5.0`  
Release date: `2026-06-21`  
Stack: GitHub Pages + Supabase + plain HTML/CSS/JS  
Repository files allowed: `README.md`, `index.html`, `script.js`, `style.css`

## Changelog

### v1.5.0 — UX Flow Stabilization

- หลัง login เปิดหน้า `งานของฉัน` เป็นค่าเริ่มต้น
- เมื่อผู้ใช้สลับไป browser tab อื่นแล้วกลับมา ระบบจะ reload ข้อมูลล่าสุดและเลื่อนกลับขึ้นบนหน้า
- ป้องกัน reload อัตโนมัติถ้ามี modal/form เปิดอยู่ เพื่อไม่ให้ข้อมูลที่กำลังกรอกหาย
- หน้า `เดโม` ใช้ `demo_sessions` เป็น source of truth จึงแสดงประวัติเดโมแม้ account จะเปลี่ยนเป็นลูกค้า หรือปิด Lost แล้ว
- หน้า `เดโม` default แสดงรายการที่กำลังทำ/รอทำ และมี tab สำหรับทั้งหมด/จบแล้ว/เป็นลูกค้า/ปิด Lost
- ลด view ที่ไม่จำเป็นในแต่ละหน้าให้ตรงกับ flow งานจริง: Lead/Account/Customer ใช้ตาราง+รายการ, Demo ใช้ตาราง+รายการ+ปฏิทิน, Task ใช้บอร์ด+รายการ+ปฏิทิน, Training ใช้ปฏิทิน+รายการ+ตาราง
- ไม่มี SQL migration ใหม่

### v1.4.2 — Hotfix Render Permission Helper

- แก้ runtime error `hasRole is not defined` หลัง login สำเร็จ
- คืนชื่อ internal helper ที่ถูกแปลผิดกลับเป็นภาษาอังกฤษ: `hasRole`, `findAccount`, `formatDate`
- คงข้อความ UI ภาษาไทยตาม requirement เดิม
- ไม่มี SQL migration ใหม่


### v1.4.1 — Hotfix Login Auth Method

- แก้ regression จาก v1.4.0 ที่ internal JS identifier ถูกแปลเป็นภาษาไทย ทำให้เรียก `signInWithPassword()` ผิดเป็น `signInWithรหัสผ่าน()` และ login ไม่ได้
- คืนชื่อ internal identifier/API/property ที่ต้องเป็นภาษาอังกฤษ เช่น `autoRefreshToken`, `dataset.filterName`, `dataset.navAccount`, `className`, `DateTimeFormat`, `accountModules`, `leadSources`, `contactStatuses`, `accountCsOwners`
- ไม่มี SQL migration ใหม่ และไม่กระทบ schema/RLS


### v1.4.0 — Thai UI, Hover Sidebar, Master Delete Guard

- ตัด `legacy_account_id` / Account ID ระบบเดิมออกจาก frontend, RPC และ database migration
- Master data ลบได้เมื่อยังไม่ถูกใช้งาน และถ้าถูกใช้งานแล้วให้ใช้ปิดใช้งานแทน
- ปรับข้อความ UI ให้สั้นลงและใช้ภาษาไทยเป็นหลัก
- Sidebar default เป็น icon-only และขยายอัตโนมัติเมื่อ hover/focus โดยไม่มีปุ่มย่อ/ขยาย
- อัปเดต README ให้ตรงกับ schema และ flow ล่าสุด

## System Overview

ระบบนี้เป็น CRM ภายในสำหรับจัดการ Lead, Demo, Customer, Training และ Task ของทีม MKT, Sale, CS, Manager และ Admin

เส้นทางหลัก:

```text
Lead → Lost
Lead → Customer
Lead → Demo → Lost
Lead → Demo → Customer
Lead → Demo → Customer → Lost / Churn
```

ข้อมูลทุกช่วงผูกกับ `accounts.id` เดียวกัน เพื่อดูประวัติและทำงานต่อได้ แม้ Lead จะเปลี่ยนเป็น Demo, Customer หรือ Lost แล้ว

## Roles

| Role | สิทธิ์หลัก |
|---|---|
| Admin | จัดการได้ทั้งหมด รวม user, master data, account, demo, customer, task |
| MKT | สร้าง MKT Lead, ได้เลข MKT, เห็น Lead จาก MKT ทั้งทีม |
| Sale | เห็นและแก้เฉพาะ account ที่ตัวเองเป็น owner |
| CS | เห็น Demo / Customer / Task ฝั่ง CS ร่วมกัน |
| Manager | ดู dashboard/report แบบ read-only |

## Current UX Behavior

- หลัง login เปิด `งานของฉัน` เป็นหน้าแรก
- เมื่อกลับมาจาก browser tab อื่น ระบบ reload ข้อมูลและเลื่อนขึ้นบน โดยไม่ interrupt modal/form
- Sidebar ย่อเป็น icon-only เป็นค่าเริ่มต้น
- Hover หรือ focus ที่ sidebar แล้วขยายอัตโนมัติ
- ไม่มีปุ่มย่อ/ขยาย sidebar
- ฟอร์มสร้าง/เพิ่มข้อมูลเปิดเป็น modal
- หน้า Leads default แสดง Lead ที่ยังเปิด แต่ยังดู All/Demo/Customer/Lost ได้
- หน้า Demo แสดงจากบันทึก `demo_sessions` ทั้ง active และ history
- Collection หลักมี search/filter/sort/pagination
- Master data ที่ยังไม่ถูกใช้งานลบได้
- Master data ที่ถูกใช้งานแล้วต้องปิดใช้งานแทนการลบ


## UX Flow v1.5.0

- หน้าเริ่มต้นหลัง login คือ `#/my-work`
- การกลับมาจาก browser tab อื่นจะ reload data และ scroll ขึ้นบน
- ถ้ามี modal/form เปิดอยู่ ระบบจะไม่ reload อัตโนมัติ
- เมนูเดโมแสดงจาก `demo_sessions` ไม่ได้ดูเฉพาะ `accounts.lifecycle_stage = demo`
- เดโมที่เคยบันทึกไว้ยังค้นเจอ แม้บัญชีจะเป็น Customer หรือ Lost แล้ว

## Frontend Pages

```text
#/dashboard
#/my-work
#/leads
#/accounts
#/account/:id
#/demo
#/customers
#/tasks
#/training
#/reports
#/admin
#/unauthorized
#/not-found
```

## Database Schema

Core tables:

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
lead_channels
campaigns
business_types
contact_statuses
account_cs_owners
app_settings
```

Important account fields:

```text
accounts.id
accounts.running_no
accounts.source_type
accounts.lifecycle_stage
accounts.lifecycle_status
accounts.company_name
accounts.short_name
accounts.tax_id
accounts.lead_source_id
accounts.lead_channel_id
accounts.campaign_id
accounts.business_type_id
accounts.contact_status_id
accounts.address
accounts.current_gps_provider
accounts.product_interest
accounts.initial_note
accounts.cars_estimate
accounts.sale_owner_id
accounts.created_by
accounts.mkt_created_by
accounts.lost_reason_id
accounts.lost_note
accounts.lost_from_stage
accounts.converted_to_customer_at
```

Contact fields:

```text
account_contacts.contact_name
account_contacts.position
account_contacts.phone
account_contacts.phone_2
account_contacts.phone_3
account_contacts.email
account_contacts.email_2
account_contacts.contact_role
```

## Supabase Config

Frontend ใช้ Supabase anon key เท่านั้น

```js
const CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
}
```

ห้ามใส่ `service_role key` ใน frontend

## SQL / Migration

v1.5.0 ไม่มี SQL migration ใหม่ ถ้าระบบของคุณเคยรัน migration v1.4.x แล้ว deploy frontend ได้เลย

### SQL Migration v1.4.x

ถ้าอัปเกรดจาก v1.3.0 ให้รัน migration v1.4.x ก่อน deploy frontend

สิ่งที่ migration ทำ:

```text
- drop accounts.legacy_account_id
- drop idx_accounts_legacy_account_id
- recreate create_mkt_lead โดยไม่มี p_legacy_account_id
- recreate create_sales_lead โดยไม่มี p_legacy_account_id
- keep lead_channels และ business_types
```

## Deploy

```bash
git status
git add README.md index.html script.js style.css
git commit -m "release: ux flow stabilization v1.5.0"
git push
```

หลัง GitHub Pages deploy ให้ hard refresh:

```text
Windows: Ctrl + F5
Mac: Cmd + Shift + R
```

## Test Checklist

- Login ด้วย Admin แล้วควรเข้า `งานของฉัน`
- เปิดหน้าอื่น เลื่อนลงล่าง สลับ browser tab แล้วกลับมา ต้อง reload และ scroll ขึ้นบน
- เมนูเดโมต้องเห็นรายการจาก demo_sessions แม้ account จะเป็นลูกค้าแล้ว
- รัน SQL migration v1.4.1 สำเร็จ
- เปิด Sidebar แล้วเห็น icon-only
- Hover sidebar แล้วเมนูขยาย
- ไม่มีปุ่มย่อ/ขยาย sidebar
- ฟอร์ม MKT/Sale ไม่มี Account ID ระบบเดิม
- สร้าง MKT Lead ได้และเห็นเลข MKT + Sale ที่ได้รับงาน
- สร้าง Sale Lead ได้
- Account Detail ไม่มี Account ID เดิม
- Master data ที่ยังไม่ถูกใช้งานลบได้
- Master data ที่ถูกใช้งานแล้วไม่มีปุ่มลบ และปิดใช้งานได้
- Sale ยังเห็นเฉพาะ account ของตัวเอง
- CS ยังเห็น Demo/Customer ตาม rule เดิม
- `node --check script.js` ผ่าน

## Rollback

Frontend:

```bash
git revert <commit_sha>
git push
```

Database:

v1.4.x ลบ column `legacy_account_id` ถ้าต้อง rollback DB ต้อง restore จาก Supabase backup เท่านั้น
