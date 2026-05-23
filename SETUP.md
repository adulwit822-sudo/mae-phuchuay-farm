# 🥚 Mae Phuchuay Farm — คู่มือการติดตั้งและ Deploy

## ภาพรวมระบบ
- **Frontend**: Next.js 14 + Tailwind CSS + Recharts
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Auth**: Supabase Auth (Email/Password)

---

## ขั้นตอนที่ 1 — สร้าง Supabase Project

1. ไปที่ [https://supabase.com](https://supabase.com) แล้วกด **Start your project**
2. สมัคร/เข้าสู่ระบบด้วย GitHub หรือ Email
3. กด **New project**
   - Organization: (ของคุณ)
   - Name: `mae-phuchuay-farm`
   - Database Password: (ตั้งรหัสผ่านที่แข็งแรง — บันทึกไว้!)
   - Region: `Southeast Asia (Singapore)`
4. รอประมาณ 1–2 นาที จนโปรเจกต์พร้อม

### สร้าง Database Schema

5. ใน Supabase → เลือก **SQL Editor** (เมนูซ้าย)
6. กด **New query**
7. Copy ทั้งหมดจากไฟล์ `supabase/schema.sql` แล้ว Paste ลงไป
8. กด **Run** (หรือ Ctrl+Enter)

### ดึง API Keys

9. ไปที่ **Settings** → **API**
10. Copy:
    - `Project URL` → จะใช้เป็น `NEXT_PUBLIC_SUPABASE_URL`
    - `anon public` key → จะใช้เป็น `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ขั้นตอนที่ 2 — ตั้งค่าโปรเจกต์ในเครื่อง

```bash
# 1. ไปที่โฟลเดอร์โปรเจกต์
cd mae-phuchuay-farm

# 2. Copy ไฟล์ environment
cp .env.local.example .env.local

# 3. แก้ไขไฟล์ .env.local ใส่ค่าที่ได้จาก Supabase
```

แก้ไข `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```bash
# 4. ติดตั้ง dependencies
npm install

# 5. รันในโหมด development
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

---

## ขั้นตอนที่ 3 — ตั้งค่า Email Auth ใน Supabase (สำคัญ!)

1. ใน Supabase → **Authentication** → **Providers**
2. ตรวจสอบว่า **Email** เปิดอยู่ (เปิดเป็นค่าเริ่มต้น)
3. ไปที่ **Authentication** → **Email Templates** (ถ้าต้องการ customize)
4. ไปที่ **Authentication** → **URL Configuration**:
   - Site URL: `http://localhost:3000` (ระหว่าง dev)
   - Redirect URLs: `http://localhost:3000/**`

> หลัง Deploy Vercel แล้ว ให้มาเปลี่ยนเป็น URL ของ Vercel

---

## ขั้นตอนที่ 4 — Deploy ขึ้น Vercel

### สร้าง Git Repository

```bash
# ใน folder โปรเจกต์
git init
git add .
git commit -m "Initial commit: Mae Phuchuay Farm app"
```

1. ไปที่ [https://github.com](https://github.com) → สร้าง repository ใหม่ชื่อ `mae-phuchuay-farm`
2. Push code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/mae-phuchuay-farm.git
git branch -M main
git push -u origin main
```

### Deploy บน Vercel

1. ไปที่ [https://vercel.com](https://vercel.com) → สมัคร/เข้าสู่ระบบ
2. กด **New Project**
3. เลือก **Import Git Repository** → เลือก `mae-phuchuay-farm`
4. ใน **Environment Variables** ใส่:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   ```
5. กด **Deploy**
6. รอ 2–3 นาที จะได้ URL เช่น `mae-phuchuay-farm.vercel.app`

### อัปเดต Supabase URL หลัง Deploy

กลับไปที่ Supabase → **Authentication** → **URL Configuration**:
- Site URL: `https://mae-phuchuay-farm.vercel.app`
- Redirect URLs: `https://mae-phuchuay-farm.vercel.app/**`

---

## ขั้นตอนที่ 5 — สร้างบัญชีผู้ใช้แรก

1. เปิด URL เว็บแอป
2. กด **สมัครสมาชิก**
3. ใส่ Email และรหัสผ่าน
4. ตรวจสอบ Email เพื่อยืนยัน (ถ้า Email Confirmation เปิดอยู่)
5. เข้าสู่ระบบ → Dashboard พร้อมใช้งาน!

> หากไม่ต้องการยืนยัน Email: Supabase → **Authentication** → **Providers** → Email → ปิด **Confirm email**

---

## โครงสร้างโปรเจกต์

```
mae-phuchuay-farm/
├── src/
│   ├── app/
│   │   ├── login/          # หน้าเข้าสู่ระบบ
│   │   ├── dashboard/      # Dashboard หลัก
│   │   ├── records/        # รายการบันทึกและฟอร์ม
│   │   ├── stock/          # สต็อก
│   │   └── reports/        # รายงาน + Export
│   ├── components/
│   │   └── Sidebar.tsx     # Navigation
│   └── lib/
│       ├── supabase.ts     # Supabase client (browser)
│       ├── supabase-server.ts  # Supabase client (server)
│       └── types.ts        # TypeScript types + helpers
├── supabase/
│   └── schema.sql          # Database schema
└── .env.local.example      # Template environment variables
```

---

## คุณสมบัติของระบบ

| ฟีเจอร์ | รายละเอียด |
|---|---|
| 🔐 Login/Register | Supabase Email Auth |
| 🏠 Dashboard | KPI cards, กราฟผลผลิต, รายได้, กำไร |
| 📝 บันทึกรายวัน | ฟอร์มครบถ้วน + คำนวณอัตโนมัติ |
| 📋 รายการข้อมูล | ค้นหา, กรอง, ลบรายการ |
| 📦 สต็อก | ติดตามสต็อกไข่และอาหารไก่ + แจ้งเตือน |
| 📊 รายงาน | สรุปรายเดือน/ปี + Export CSV |
| 📱 Responsive | ใช้งานได้ทั้งมือถือและคอม |

---

## แก้ไขปัญหาที่พบบ่อย

**Q: Login แล้วไม่เข้า Dashboard?**
→ ตรวจสอบว่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ถูกต้อง

**Q: ข้อมูลไม่บันทึก?**
→ ตรวจสอบว่ารัน SQL Schema ใน Supabase แล้ว และ RLS policy ถูกต้อง

**Q: Build ล้มเหลวบน Vercel?**
→ ตรวจสอบว่าใส่ Environment Variables ครบทั้งสอง key

**Q: ต้องการเพิ่มโรงเรือนใหม่?**
→ แก้ไข `COOP_OPTIONS` ใน `src/lib/types.ts`

---

*Mae Phuchuay Farm · ไข่สดใหม่ทุกวัน จากฟาร์ม!* 🥚
