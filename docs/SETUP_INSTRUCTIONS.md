# SmartExam - Sozlash Ko'rsatmalari (O'zbek tilida)

## ✅ Yaratilgan Fayllar

Quyidagi fayllar `C:\Projects\SmartExamweb\SmartExam` papkasida yaratildi:

1. ✅ `script/create-test-user.sql` - Test foydalanuvchi (R002) yaratish uchun SQL skripti
2. ✅ `MIGRATION_SUMMARY.md` - Barcha o'zgarishlar hujjati
3. ✅ Kod fayllari yangilandi:
   - `server/db.ts` - PostgreSQL ulanishi
   - `server/routes.ts` - Xatolarni log qilish
   - `package.json` - Paketlar yangilandi
   - `script/build.ts` - Build skripti yangilandi

## 📋 Keyingi Qadamlar

### 1. Paketlarni O'rnatish

```bash
cd C:\Projects\SmartExamweb\SmartExam
npm install
```

Bu `pg` paketini dependencies ga o'rnatadi.

### 2. Ma'lumotlar Bazasi Jadvalarini Yaratish

Drizzle ORM yordamida jadvallarni yaratish:

```bash
npm run db:push
```

Bu quyidagi jadvallarni yaratadi:
- users
- faculties
- departments
- student_groups
- subjects
- teacher_subjects
- lectures
- questions
- exams
- exam_tickets
- exam_sessions
- student_answers
- activity_logs

### 3. Test Foydalanuvchini Yaratish

PostgreSQL'da test foydalanuvchini yaratish:

**Variant 1: SQL fayl orqali**
```bash
# PostgreSQL bin papkasini PATH ga qo'shing yoki to'liq yo'l bilan:
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d smartexam -f script/create-test-user.sql
```

**Variant 2: pgAdmin yoki boshqa tool orqali**
- `script/create-test-user.sql` faylini oching
- SQL kodini ko'chirib, PostgreSQL'da bajarib qo'ying

**Variant 3: psql orqali (agar PATH da bo'lsa)**
```bash
psql -U postgres -d smartexam -f script/create-test-user.sql
```

**Yaratiladigan foydalanuvchi:**
- **User ID:** R002
- **Parol:** admin@2025
- **Rol:** registrator
- **To'liq ism:** Test Admin

### 4. Serverni Ishga Tushirish

```bash
npm run dev
```

Server `http://localhost:5000` da ishga tushadi.

### 5. Tizimga Kirishni Test Qilish

Brauzerda oching: http://localhost:5000

**Kirish ma'lumotlari:**
- **User ID:** R002
- **Parol:** admin@2025
- **Rol:** registrator

## 🔍 Tekshirish

### Ma'lumotlar bazasi jadvallari mavjudligini tekshirish:

```sql
-- PostgreSQL'da bajarish:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Test foydalanuvchini tekshirish:

```sql
SELECT id, user_id, role, full_name, is_active, created_at 
FROM users 
WHERE user_id = 'R002';
```

### Ma'lumotlar bazasiga ulanishni tekshirish:

`.env` faylida quyidagi sozlash bo'lishi kerak:
```
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/smartexam
```

## ⚠️ Muammolar va Yechimlar

### Agar `npm run db:push` xatolik bersa:

1. PostgreSQL ishlayotganini tekshiring
2. `.env` faylida `DATABASE_URL` to'g'ri ekanligini tekshiring
3. `smartexam` ma'lumotlar bazasi yaratilganini tekshiring:
   ```sql
   CREATE DATABASE smartexam;  -- agar mavjud bo'lmasa
   ```

### Agar login 500 xatolik bersa:

1. Server konsolida batafsil xatolik loglarini ko'ring
2. Ma'lumotlar bazasiga ulanishni tekshiring
3. Test foydalanuvchi yaratilganini tekshiring

### Agar WebSocket xatoliklari ko'rsatilsa:

- Bu Neon Database'dan qolgan xatoliklar bo'lishi mumkin
- Brauzer cache'ni tozalang (Ctrl+Shift+R)
- Serverni qayta ishga tushiring

## 📝 Qo'shimcha Ma'lumot

Batafsil ma'lumot uchun `MIGRATION_SUMMARY.md` faylini ko'rib chiqing.

