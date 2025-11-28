# How to Make Yourself Admin

## Arabic (العربية)

### كيف تجعل نفسك مدير (Admin)

بعد تسجيل حسابك في الموقع، اتبع الخطوات التالية:

#### الطريقة 1: عبر Supabase Dashboard

1. افتح لوحة تحكم Supabase الخاصة بمشروعك
2. اذهب إلى **Table Editor**
3. افتح جدول `profiles`
4. ابحث عن صف حسابك (username الخاص بك)
5. عدّل القيم التالية:
   - `user_rank` → غيّرها إلى `admin`
   - `mason_badge` → غيّرها إلى `SYSTEM ADMIN` (اختياري)
   - `is_verified` → غيّرها إلى `true`
6. احفظ التغييرات
7. سجّل خروج ثم سجّل دخول مرة أخرى لتحديث البيانات

#### الطريقة 2: عبر SQL Editor في Supabase

1. افتح **SQL Editor** في لوحة تحكم Supabase
2. نفّذ هذا الاستعلام (استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك):

```sql
UPDATE profiles
SET
  user_rank = 'admin',
  mason_badge = 'SYSTEM ADMIN',
  is_verified = true
WHERE username = 'YOUR_USERNAME';
```

3. سجّل خروج ثم سجّل دخول مرة أخرى

---

## English

### How to Make Yourself Admin

After registering your account on the site, follow these steps:

#### Method 1: Via Supabase Dashboard

1. Open your Supabase project dashboard
2. Go to **Table Editor**
3. Open the `profiles` table
4. Find your account row (your username)
5. Edit the following values:
   - `user_rank` → change to `admin`
   - `mason_badge` → change to `SYSTEM ADMIN` (optional)
   - `is_verified` → change to `true`
6. Save the changes
7. Log out and log back in to refresh your data

#### Method 2: Via SQL Editor in Supabase

1. Open **SQL Editor** in Supabase dashboard
2. Execute this query (replace `YOUR_USERNAME` with your username):

```sql
UPDATE profiles
SET
  user_rank = 'admin',
  mason_badge = 'SYSTEM ADMIN',
  is_verified = true
WHERE username = 'YOUR_USERNAME';
```

3. Log out and log back in

---

## Available User Ranks

- `admin` - Full system access
- `developer` - Developer privileges
- `mason_official` - Mason Official member
- `vip` - VIP member
- `member` - Regular member (default)

## Features Unlocked as Admin

- Access to Admin Panel
- Promote/demote users
- Verify/unverify users
- Ban/unban users
- **Change user passwords** (via Supabase Auth)
- Delete users
- Edit user badges
- Full access to all projects (public, VIP, Mason)

## Database Migration Required

To enable admin password change functionality, you need to run this SQL in your Supabase Dashboard:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the following SQL:

```sql
-- Create admin password change function
CREATE OR REPLACE FUNCTION admin_change_user_password(
  target_user_id uuid,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  calling_user_id uuid;
  calling_user_rank text;
  target_auth_id uuid;
BEGIN
  -- Get the calling user's ID from JWT
  calling_user_id := auth.uid();

  -- Check if caller exists and is admin
  SELECT user_rank INTO calling_user_rank
  FROM public.profiles
  WHERE id = calling_user_id;

  IF calling_user_rank IS NULL OR calling_user_rank != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change passwords';
  END IF;

  -- Validate password length
  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  -- Get target user's auth_id
  SELECT auth_id INTO target_auth_id
  FROM public.profiles
  WHERE id = target_user_id;

  IF target_auth_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update password in auth.users (Supabase Auth)
  UPDATE auth.users
  SET
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_auth_id;

  -- Update password in profiles table (for backup reference)
  UPDATE public.profiles
  SET password = new_password
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_change_user_password(uuid, text) TO authenticated;
```

3. Click **Run**
4. Done! Admins can now change user passwords from the Admin Panel
