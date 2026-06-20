# Internal CRM Ops

Current version: `1.4.0`  
Release date: `2026-06-20`  
Stack: GitHub Pages + Supabase + plain HTML/CSS/JS  
Repository files allowed: `README.md`, `index.html`, `script.js`, `style.css`

## Changelog

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

- Sidebar ย่อเป็น icon-only เป็นค่าเริ่มต้น
- Hover หรือ focus ที่ sidebar แล้วขยายอัตโนมัติ
- ไม่มีปุ่มย่อ/ขยาย sidebar
- ฟอร์มสร้าง/เพิ่มข้อมูลเปิดเป็น modal
- หน้า Leads default แสดง Lead ที่ยังเปิด แต่ยังดู All/Demo/Customer/Lost ได้
- Collection หลักมี search/filter/sort/pagination
- Master data ที่ยังไม่ถูกใช้งานลบได้
- Master data ที่ถูกใช้งานแล้วต้องปิดใช้งานแทนการลบ

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

## SQL Migration v1.4.0

ถ้าเคยรัน v1.3.0 แล้ว ให้รันไฟล์ `internal-crm-ops-v1.4.0-migration.sql` ก่อน deploy frontend

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
git commit -m "release: thai ui hover sidebar master delete v1.4.0"
git push
```

หลัง GitHub Pages deploy ให้ hard refresh:

```text
Windows: Ctrl + F5
Mac: Cmd + Shift + R
```

## Test Checklist

- Login ด้วย Admin
- รัน SQL migration v1.4.0 สำเร็จ
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

v1.4.0 ลบ column `legacy_account_id` ถ้าต้อง rollback DB ต้อง restore จาก Supabase backup เท่านั้น
