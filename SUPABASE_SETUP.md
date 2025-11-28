# Supabase Setup Guide

## Arabic (العربية)

### كيف تربط المشروع بـ Supabase الخاص بك

#### الخطوة 1: إنشاء مشروع Supabase جديد

1. اذهب إلى [supabase.com](https://supabase.com)
2. سجل دخول أو أنشئ حساب جديد
3. اضغط "New Project"
4. اختر:
   - **Name**: اسم المشروع (مثلاً: mason-hub)
   - **Database Password**: كلمة مرور قوية (احفظها!)
   - **Region**: اختر أقرب منطقة لك
5. انتظر 2-3 دقائق حتى يتم إنشاء المشروع

#### الخطوة 2: الحصول على API Keys

1. بعد إنشاء المشروع، اذهب إلى **Settings** (⚙️)
2. اذهب إلى **API**
3. ستجد:
   - **Project URL**: مثلاً `https://xxxxx.supabase.co`
   - **anon public key**: مفتاح طويل يبدأ بـ `eyJ...`

#### الخطوة 3: تحديث ملف .env

1. افتح ملف `.env` في المشروع
2. استبدل القيم بالقيم الخاصة بك:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
```

مثال:
```env
VITE_SUPABASE_URL=https://abcdefgh12345678.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

#### الخطوة 4: تطبيق Database Schema

الآن تحتاج تنشئ الجداول في Supabase الخاص بك:

1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. انسخ والصق كل المحتوى من الملفات التالية **بالترتيب**:

##### 1. إنشاء الجداول الأساسية:
من ملف: `supabase/migrations/20251001151846_create_profiles_and_projects_tables.sql`

##### 2. إضافة دالة زيادة التحميلات:
من ملف: `supabase/migrations/20251001152159_add_increment_download_function.sql`

##### 3. إضافة حقل الحظر:
من ملف: `supabase/migrations/20251001184848_add_is_banned_field.sql`

##### 4. حذف background_color:
من ملف: `supabase/migrations/20251001190000_remove_background_color.sql`

##### 5. إنشاء جدول القواعد:
من ملف: `supabase/migrations/20251001200000_create_rules_table.sql`

##### 6. إصلاح created_at:
من ملف: `supabase/migrations/20251001210000_fix_profile_created_at.sql`

##### 7. تعديل القواعد:
من ملف: `supabase/migrations/20251001220000_modify_rules_to_individual.sql`

##### 8. إنشاء جدول الإعلانات:
من ملف: `supabase/migrations/20251001230000_create_announcements_table.sql`

##### 9. إنشاء جدول رموز استعادة كلمة المرور:
من ملف: `supabase/migrations/20251001240000_create_password_reset_codes.sql`

##### 10. إنشاء دالة تغيير كلمة المرور للأدمن:
من ملف: `supabase/migrations/20251001250000_create_admin_password_function.sql`

#### الخطوة 5: إعادة تشغيل المشروع

```bash
# أوقف المشروع (Ctrl+C)
# ثم شغّل من جديد:
npm run dev
```

#### الخطوة 6: اختبار الاتصال

1. افتح المتصفح على `http://localhost:5173`
2. حاول سجل حساب جديد
3. إذا نجح التسجيل، الاتصال يعمل! ✅
4. اذهب إلى Supabase Dashboard → Table Editor → `profiles`
5. يجب أن تشوف حسابك الجديد

#### الخطوة 7: اجعل نفسك Admin

بعد التسجيل، نفّذ هذا SQL في SQL Editor:

```sql
UPDATE profiles
SET
  user_rank = 'admin',
  mason_badge = 'SYSTEM ADMIN',
  is_verified = true
WHERE username = 'YOUR_USERNAME';
```

استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك.

---

## English

### How to Connect Your Project to Your Own Supabase

#### Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create a new account
3. Click "New Project"
4. Choose:
   - **Name**: project name (e.g., mason-hub)
   - **Database Password**: strong password (save it!)
   - **Region**: choose closest region
5. Wait 2-3 minutes for project creation

#### Step 2: Get API Keys

1. After project creation, go to **Settings** (⚙️)
2. Go to **API**
3. You'll find:
   - **Project URL**: e.g., `https://xxxxx.supabase.co`
   - **anon public key**: long key starting with `eyJ...`

#### Step 3: Update .env File

1. Open `.env` file in the project
2. Replace values with your own:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
```

Example:
```env
VITE_SUPABASE_URL=https://abcdefgh12345678.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

#### Step 4: Apply Database Schema

Now you need to create tables in your Supabase:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste all content from these files **in order**:

##### 1. Create base tables:
From: `supabase/migrations/20251001151846_create_profiles_and_projects_tables.sql`

##### 2. Add download increment function:
From: `supabase/migrations/20251001152159_add_increment_download_function.sql`

##### 3. Add ban field:
From: `supabase/migrations/20251001184848_add_is_banned_field.sql`

##### 4. Remove background_color:
From: `supabase/migrations/20251001190000_remove_background_color.sql`

##### 5. Create rules table:
From: `supabase/migrations/20251001200000_create_rules_table.sql`

##### 6. Fix created_at:
From: `supabase/migrations/20251001210000_fix_profile_created_at.sql`

##### 7. Modify rules:
From: `supabase/migrations/20251001220000_modify_rules_to_individual.sql`

##### 8. Create announcements table:
From: `supabase/migrations/20251001230000_create_announcements_table.sql`

##### 9. Create password reset codes table:
From: `supabase/migrations/20251001240000_create_password_reset_codes.sql`

##### 10. Create admin password change function:
From: `supabase/migrations/20251001250000_create_admin_password_function.sql`

#### Step 5: Restart Project

```bash
# Stop project (Ctrl+C)
# Then run again:
npm run dev
```

#### Step 6: Test Connection

1. Open browser at `http://localhost:5173`
2. Try to register a new account
3. If registration succeeds, connection works! ✅
4. Go to Supabase Dashboard → Table Editor → `profiles`
5. You should see your new account

#### Step 7: Make Yourself Admin

After registration, run this SQL in SQL Editor:

```sql
UPDATE profiles
SET
  user_rank = 'admin',
  mason_badge = 'SYSTEM ADMIN',
  is_verified = true
WHERE username = 'YOUR_USERNAME';
```

Replace `YOUR_USERNAME` with your username.

---

## Database Schema Overview

### Tables Created:

1. **profiles** - User profiles
   - id, username, email, password, display_name
   - user_rank (admin, developer, mason_official, vip, member)
   - avatar_url, bio, social_links
   - is_verified, is_banned, mason_badge

2. **projects** - User projects
   - id, user_id, title, description
   - demo_url, download_url, thumbnail_url
   - access_level (public, vip, mason)
   - is_official, download_count

3. **rules** - Community rules
   - id, title_en, title_ar
   - content_en, content_ar
   - order_index, is_active

4. **announcements** - Admin announcements
   - id, title_en, title_ar
   - content_en, content_ar
   - is_pinned, created_at

5. **password_reset_codes** - Password reset verification codes
   - id, email, code
   - expires_at, used

### Functions Created:

1. **increment_project_downloads()** - Auto-increment download counter
2. **admin_change_user_password()** - Allow admin to change passwords

---

## Important Security Notes

### Row Level Security (RLS) Policies:

All tables have RLS enabled with proper policies:

- **profiles**: Users can read all, update/delete own only (admins can update/delete any)
- **projects**: Users can read accessible projects, manage own only (admins can manage any)
- **rules**: Everyone can read, only admins can create/update/delete
- **announcements**: Everyone can read, only admins can create/update/delete
- **password_reset_codes**: Only accessible via functions

### Authentication:

- Uses Supabase Auth for user authentication
- Email/Password authentication enabled
- JWT tokens for session management
- Admin password change via secure database function

---

## Troubleshooting

### Problem: "Missing Supabase environment variables"
**Solution**: Make sure `.env` file has correct values

### Problem: Can't create account
**Solution**:
1. Check if migrations are applied
2. Verify Supabase project is active
3. Check browser console for errors

### Problem: Admin features not working
**Solution**:
1. Make sure you set `user_rank = 'admin'` in database
2. Log out and log back in
3. Verify admin function is created

### Problem: Password change not working
**Solution**: Run the admin password change function SQL from migration file

---

## Need Help?

Check these files for complete SQL:
- `/supabase/migrations/*.sql` - All database migrations
- `ADMIN_SETUP.md` - Admin setup instructions
- `MIGRATION_INSTRUCTIONS.md` - Migration instructions

---

## Development vs Production

### Development (Local):
```env
VITE_SUPABASE_URL=https://YOUR-DEV-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-DEV-ANON-KEY
```

### Production (Live):
Create a separate Supabase project for production with different keys:
```env
VITE_SUPABASE_URL=https://YOUR-PROD-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-PROD-ANON-KEY
```

Always use different projects for dev and production!

---

**That's it! Your project is now connected to your own Supabase database! 🎉**
