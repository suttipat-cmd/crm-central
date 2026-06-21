# Internal CRM

Current version: **0.1.1**

Internal CRM สำหรับจัดการ journey เดียวตั้งแต่ **Lead → Demo → Customer → Lost/Churn** โดยใช้ `crm_cases` เป็น record หลัก ทำให้ข้อมูลไม่หายเมื่อเปลี่ยนสถานะ และยังดู Demo history / Task / Activity ย้อนหลังได้เสมอ

## Changelog

### v0.1.1

- ปรับแพ็กเกจส่งมอบให้ตรง requirement: เหลือเฉพาะ 4 ไฟล์หลัก + โฟลเดอร์ `sql/`
- ย้าย `src/app.js` เป็น `script.js`
- ย้าย `src/styles.css` เป็น `style.css`
- รวม runtime config default ไว้ใน `script.js` แทน `config.js`
- SQL schema เดิมยังอยู่ใน `sql/001_initial_schema.sql`

### v0.1.0

- สร้าง Static Web App ด้วย HTML/CSS/JavaScript
- เชื่อม Supabase Auth + Database ผ่าน anon key
- เพิ่มหน้า My Work เป็นหน้าแรกหลัง Login
- เพิ่มหน้า Lead, Demo Queue, Customer, Task และ History
- เพิ่ม journey action:
  - สร้าง Lead
  - ส่ง Lead เข้า Demo
  - Convert Lead/Demo เป็น Customer
  - ปิด Lead/Demo เป็น Lost
  - Mark Customer เป็น Churn
  - สร้าง/ปิด Task
  - ดู Activity + Demo history ย้อนหลัง
- เพิ่ม RLS policies สำหรับ role `admin`, `manager`, `mkt`, `sale`, `cs`

## Project Structure

```text
internal-crm-v0.1.1/
  index.html
  style.css
  script.js
  README.md
  sql/
    001_initial_schema.sql
```

## Setup

1. สร้าง Supabase project
2. เปิด SQL Editor แล้วรันไฟล์:

```text
sql/001_initial_schema.sql
```

3. สร้างผู้ใช้ใน Supabase Auth
4. Promote admin คนแรก:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

เปลี่ยน `admin@example.com` เป็นอีเมลจริงก่อนรัน

5. เปิด `index.html` ผ่าน static server เช่น VS Code Live Server หรือ deploy ไปยัง static hosting
6. หน้า Setup ของระบบจะให้กรอก:
   - Supabase URL
   - Supabase anon key

ระบบจะเก็บค่านี้ใน `localStorage` ของ browser

อีกทางเลือกหนึ่ง สามารถแก้ค่า default ใน `script.js` ได้:

```js
window.CRM_CONFIG = window.CRM_CONFIG || {
  supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY"
};
```

ห้ามใส่ `service_role key`, database password, private token หรือ secret ใด ๆ ใน frontend

## System Overview

ระบบใช้ `crm_cases` เป็น record หลักของ journey และใช้ table ลูกเก็บข้อมูลเฉพาะช่วง:

```text
crm_cases
  ├── demo_sessions
  ├── customer_profiles
  ├── tasks
  └── case_activities
```

หลักการสำคัญ:

- Lead, Demo, Customer, Lost, Churn เป็นเคสเดียวกัน
- ไม่ hard delete ข้อมูลธุรกิจ
- Demo history ยังดูย้อนหลังได้ แม้เคสนั้นเปลี่ยนเป็น Customer แล้ว
- Task เป็นตัวขับเคลื่อนหน้า “งานของฉัน”
- ทุก status transition ต้องสร้าง activity log
- Lost ใช้กับ Lead/Demo ที่ไม่ซื้อ
- Churn ใช้กับ Customer ที่เคยซื้อแล้วเลิกใช้

## User Flows

### Lead

Role `mkt`, `sale`, `admin` สร้าง Lead ได้

ข้อมูลหลัก:

- บริษัท/หน่วยงาน
- ผู้ติดต่อ
- Email/Phone
- Source channel
- Sale owner
- สินค้าที่สนใจ
- ระดับความสนใจ
- Qualification note
- Next follow-up date

Sale owner สามารถส่งเข้า Demo, Convert เป็น Customer, ปิด Lost และสร้าง Task ต่อได้

### Demo Queue

เมื่อ Lead สนใจแต่ต้องทดลองก่อน ระบบจะสร้าง record ใน `demo_sessions` และเปลี่ยน `crm_cases.stage` เป็น `demo`

CS เห็น Demo ร่วมกันทั้งทีม และบันทึก Demo status, start/end date, demo users, requirements, result, notes และ next follow-up ได้

หลัง Demo สามารถ Convert เป็น Customer หรือปิด Lost ได้

### Customer

เมื่อเป็น Customer ระบบสร้าง/อัปเดต `customer_profiles` โดยผูกกับ `case_id`

CS ใช้ดูแล plan/package, billing cycle, renewal date, risk level, health status, usage status, training status และ notes

ถ้าลูกค้าเลิกใช้ ให้เปลี่ยน `crm_cases.stage` เป็น `churn` และบันทึก `churn_reason`

### My Work

หน้าแรกหลัง Login รวมงานที่ต้องทำทันที:

- Task เปิดอยู่ที่ assigned ให้ผู้ใช้
- Lead ของ Sale ที่ต้อง follow-up ภายใน 7 วัน
- Demo ที่ใกล้สิ้นสุดภายใน 7 วัน
- Customer high risk สำหรับ CS/Admin/Manager

### History

หน้า History แสดงเคสที่ผู้ใช้มีสิทธิ์ดูตาม RLS และเปิดดูข้อมูลหลัก, Demo history, Customer profile, Task และ Activity log ได้

## Roles and Permissions

| Role | สิทธิ์หลัก |
|---|---|
| admin | เห็นและจัดการ operational records ทั้งหมด, จัดการ profiles |
| manager | Read-only overview ตาม RLS |
| mkt | สร้าง Lead, เห็น case ที่ตัวเองสร้าง |
| sale | เห็น/อัปเดต Lead/Customer journey ที่ตัวเองเป็น `owner_sale_id` |
| cs | เห็น Demo/Customer/Churn ร่วมกันทั้งทีม และอัปเดต Demo/Customer operations |

หมายเหตุ: `profiles` เปิดให้ internal users เห็นรายชื่อ/อีเมล/role เพื่อใช้เลือก owner/assignee ภายในระบบ

## Database Schema

### `profiles`

| Column | Type | Meaning |
|---|---|---|
| id | uuid PK | อ้างถึง `auth.users.id` |
| email | text | อีเมลผู้ใช้ |
| full_name | text | ชื่อผู้ใช้ |
| role | text | `admin`, `manager`, `mkt`, `sale`, `cs` |
| is_active | boolean | สถานะใช้งาน |
| created_at / updated_at | timestamptz | audit timestamps |

### `crm_cases`

| Column | Type | Meaning |
|---|---|---|
| id | uuid PK | case id หลัก |
| case_number | bigint identity unique | เลขเคส |
| stage | text | `lead`, `demo`, `customer`, `lost`, `churn`, `archived` |
| source_team | text | `mkt`, `sale`, `cs`, `admin` |
| company/contact fields | text | ข้อมูลลูกค้า/ผู้ติดต่อ |
| interested_product | text | สินค้าที่สนใจ |
| interest_level | text | `low`, `medium`, `high` |
| qualification_notes | text | note การคัดกรอง |
| current_need | text | ความต้องการปัจจุบัน |
| lost_reason | text | เหตุผล Lost |
| churn_reason | text | เหตุผล Churn |
| next_follow_up_at | date | วันติดตามต่อ |
| owner_sale_id | uuid FK | Sale owner |
| owner_cs_id | uuid FK | CS owner ถ้ามี |
| created_by / updated_by | uuid FK | ผู้สร้าง/แก้ล่าสุด |
| timestamps | timestamptz | audit timestamps |

### `demo_sessions`

| Column | Type | Meaning |
|---|---|---|
| id | uuid PK | demo id |
| case_id | uuid FK | อ้างถึง `crm_cases.id` |
| demo_status | text | `queued`, `scheduled`, `in_progress`, `completed`, `cancelled`, `lost`, `converted` |
| scheduled_at | timestamptz | เวลานัด demo |
| start_date / end_date | date | ช่วงทดลอง/demo |
| demo_users | text | ผู้ใช้งาน demo |
| requirements | text | requirement |
| demo_result | text | ผล demo |
| notes | text | หมายเหตุ |
| next_follow_up_at | date | วันติดตามต่อ |
| assigned_cs_id | uuid FK | CS ที่รับผิดชอบถ้ามี |

### `customer_profiles`

| Column | Type | Meaning |
|---|---|---|
| id | uuid PK | customer profile id |
| case_id | uuid FK unique | ผูก 1:1 กับ case |
| customer_since | date | วันที่เริ่มเป็นลูกค้า |
| plan_name | text | package/plan |
| billing_cycle | text | รอบบิล |
| renewal_date | date | วันต่ออายุ |
| risk_level | text | `low`, `medium`, `high` |
| health_status | text | สถานะสุขภาพลูกค้า |
| usage_status | text | สถานะการใช้งาน |
| training_status | text | สถานะอบรม |
| notes | text | หมายเหตุ |

### `tasks`

| Column | Type | Meaning |
|---|---|---|
| id | uuid PK | task id |
| case_id | uuid FK | case ที่เกี่ยวข้อง |
| title | text | ชื่องาน |
| task_type | text | `follow_up`, `demo`, `training`, `billing`, `risk`, `other` |
| assigned_to | uuid FK | ผู้รับผิดชอบ |
| due_date | date | วันครบกำหนด |
| status | text | `open`, `done`, `cancelled` |
| priority | text | `low`, `medium`, `high` |
| notes | text | หมายเหตุ |
| completed_at | timestamptz | เวลาปิดงาน |

### `case_activities`

| Column | Type | Meaning |
|---|---|---|
| id | uuid PK | activity id |
| case_id | uuid FK | case ที่เกี่ยวข้อง |
| actor_id | uuid FK | ผู้ทำ action |
| activity_type | text | ประเภท action |
| from_stage / to_stage | text | stage ก่อน/หลัง |
| note | text | note |
| metadata | jsonb | รายละเอียดเพิ่มเติม |
| created_at | timestamptz | เวลาบันทึก |

## RLS Summary

เปิด RLS ทุก table ที่ frontend เข้าถึง

- `admin`: เห็นและจัดการทั้งหมด
- `manager`: อ่านข้อมูล operational ทั้งหมด
- `mkt`: สร้าง Lead และเห็น case ที่ตัวเองสร้าง
- `sale`: เห็น/แก้ case ที่ตัวเองเป็น `owner_sale_id`
- `cs`: เห็น Demo/Customer/Churn ร่วมกันทั้งทีม และอัปเดต operations ที่เกี่ยวข้อง
- ไม่มี delete policy สำหรับ business tables

รายละเอียด policy อยู่ใน `sql/001_initial_schema.sql`

## Deploy

เหมาะกับ static hosting เช่น Netlify, Vercel Static, GitHub Pages หรือ internal web server

ต้อง deploy ไฟล์เหล่านี้พร้อมกัน:

```text
index.html
style.css
script.js
README.md
sql/001_initial_schema.sql
```

สำหรับ GitHub Pages ให้เปิดจาก root ของ repository ได้เลย

## Test Checklist

ตรวจแล้วในระดับไฟล์:

- `script.js` ผ่าน syntax check ด้วย `node --check`
- `index.html` อ้างอิงเฉพาะ `style.css` และ `script.js`
- ZIP มีเฉพาะ 4 ไฟล์หลัก + `sql/`
- README ไม่มี secret/password/token/service_role key จริง

ต้องทดสอบเองหลังเชื่อม Supabase จริง:

- Login/logout
- Role permission ทั้ง 5 role
- Create Lead
- Send to Demo
- Convert to Customer
- Close Lost
- Mark Churn
- Create/complete/cancel Task
- My Work แสดงงานถูกต้อง
- Demo history ยังอยู่หลัง convert เป็น Customer
- RLS ไม่ leak ข้อมูลข้าม role

## Rollback

Frontend:

- กลับไปใช้ไฟล์ ZIP/release ก่อนหน้า หรือ revert commit ล่าสุด

Database:

- ถ้ายังไม่มีข้อมูลจริง สามารถ drop table/policy/function ตามลำดับ dependency ใน migration note ได้
- ถ้ามีข้อมูลจริงแล้ว ให้ backup database ก่อน และใช้ migration rollback เฉพาะจุด ห้าม drop table ตรง ๆ

## Known Limitations

- ยังไม่มี report/export ขั้นสูง
- ยังไม่มี file upload
- ยังไม่มี print/PDF layout
- ยังไม่มี automated test ที่รันกับ Supabase จริง
- ต้องตั้งค่า Supabase URL และ anon key เองผ่านหน้า Setup หรือแก้ `script.js`
