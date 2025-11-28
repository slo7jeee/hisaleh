# 🔧 تعليمات تطبيق الـ Migrations المطلوبة

## ⚠️ مهم جداً: يجب تطبيق هذه الـ SQL في Supabase

افتح **SQL Editor** في Supabase Dashboard ونفذ الكود التالي:

---

## 📋 الخطوات:

### 1. افتح Supabase Dashboard
اذهب إلى: https://supabase.com/dashboard

### 2. اختر مشروعك
اختر المشروع الخاص بـ MasonHub

### 3. افتح SQL Editor
من القائمة الجانبية، اضغط على "SQL Editor"

### 4. انسخ والصق الكود التالي

```sql
-- ==========================================
-- MasonHub Database Migrations
-- ==========================================

-- 1️⃣ Add is_banned column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- 2️⃣ Drop old update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 3️⃣ Create new update policy (admin can update any)
CREATE POLICY "Users can update own profile or admin can update any"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- 4️⃣ Drop old delete policy
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- 5️⃣ Create new delete policy (admin only)
CREATE POLICY "Admin can delete any profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- 6️⃣ Drop old project delete policy
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- 7️⃣ Create new project delete policy (admin can delete any)
CREATE POLICY "Users can delete own projects or admin can delete any"
  ON projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- 8️⃣ Create Rules Table
CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rules"
  ON rules FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert rules"
  ON rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

CREATE POLICY "Only admins can update rules"
  ON rules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

CREATE POLICY "Only admins can delete rules"
  ON rules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

INSERT INTO rules (content) VALUES ('# Platform Rules

Welcome to MasonHub! Please follow these guidelines:

## 1. Respect Everyone
- Treat all members with respect
- No harassment or hate speech
- Keep discussions professional

## 2. Content Guidelines
- Share quality projects only
- Provide accurate descriptions
- No malicious or harmful code

## 3. Account Rules
- One account per person
- No impersonation
- Keep your profile information updated

## 4. Project Submissions
- Original work or properly credited
- Include clear documentation
- Test your code before sharing

## 5. Community Behavior
- Help other members when possible
- Report issues to admins
- Follow admin instructions

Violations may result in warnings, suspensions, or permanent bans.

Thank you for being part of our community!
');

-- 9️⃣ Fix Profile Created At (التاريخ الصحيح من auth.users)
CREATE OR REPLACE FUNCTION set_profile_created_at()
RETURNS TRIGGER AS $$
BEGIN
  SELECT created_at INTO NEW.created_at
  FROM auth.users
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_profile_created_at_trigger ON profiles;
CREATE TRIGGER set_profile_created_at_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_created_at();

UPDATE profiles
SET created_at = auth.users.created_at
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.created_at IS DISTINCT FROM auth.users.created_at;
```

### 5. اضغط Run
اضغط زر "Run" أو اضغط `Ctrl + Enter`

### 6. تحقق من النجاح
إذا لم تظهر أخطاء، يعني تم بنجاح! ✅

---

## ✅ بعد التطبيق

1. **سجل خروج ثم دخول مرة ثانية**
2. **اذهب إلى Admin Panel** (`/admin`)
3. **جرب جميع الميزات:**
   - ✅ تغيير الرتب
   - ✅ التوثيق
   - ✅ الشارات
   - ✅ الحظر
   - ✅ الحذف

---

## 📊 الصلاحيات بعد التطبيق:

### Admin Panel:
- ✅ **Admin** يقدر يعدل ويحذف أي حساب
- ✅ **Admin** يقدر يحذف أي مشروع
- ✅ **Admin** يقدر يحظر أي مستخدم

### VIP Room (`/vip`):
- 💎 **VIP** يشوفون ويحملون فقط
- 🏛️ **Mason Officials** يشوفون ويحملون وينزلون
- 👑 **Admin** يشوفون ويحملون وينزلون

### Mason Room (`/mason`):
- 🏛️ **Mason Officials** يشوفون ويحملون وينزلون
- 💻 **Developers** يشوفون ويحملون وينزلون
- 👑 **Admin** يشوفون ويحملون وينزلون
- ❌ **VIP** ما يقدرون يدخلون

---

تم إنشاء هذا الدليل بواسطة MasonHub Team 🏛️
