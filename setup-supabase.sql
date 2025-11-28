-- =====================================================
-- MasonHub - Complete Database Setup
-- =====================================================
-- Copy all of this SQL and paste it into your Supabase SQL Editor
-- This will create all tables, functions, and security policies
-- =====================================================

-- Step 1: Create profiles table
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  social_links jsonb DEFAULT '{}',
  user_rank text DEFAULT 'member',
  is_verified boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  mason_badge text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile or admin can update any"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = auth_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = auth_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

CREATE POLICY "Admin can delete any profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- Step 2: Create projects table
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  demo_url text,
  download_url text,
  thumbnail_url text,
  access_level text DEFAULT 'public',
  is_official boolean DEFAULT false,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view accessible projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    access_level = 'public' OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND (
        profiles.user_rank IN ('admin', 'developer', 'mason_official') OR
        (access_level = 'vip' AND profiles.user_rank IN ('vip', 'admin', 'developer', 'mason_official')) OR
        (access_level = 'mason' AND profiles.user_rank IN ('admin', 'developer', 'mason_official'))
      )
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND profiles.id = user_id
    )
  );

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND profiles.id = user_id
    )
  );

CREATE POLICY "Users can delete own projects or admin can delete any"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND (
        profiles.id = user_id OR
        profiles.user_rank = 'admin'
      )
    )
  );

-- Step 3: Create increment download function
-- =====================================================

CREATE OR REPLACE FUNCTION increment_project_downloads(project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET download_count = download_count + 1
  WHERE id = project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_project_downloads(uuid) TO authenticated;

-- Step 4: Create rules table
-- =====================================================

CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL,
  content_en text NOT NULL,
  content_ar text NOT NULL,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rules"
  ON rules FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Only admins can manage rules"
  ON rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- Step 5: Create announcements table
-- =====================================================

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL,
  content_en text NOT NULL,
  content_ar text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view announcements"
  ON announcements FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- Step 6: Create password reset codes table
-- =====================================================

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- No public access - only via functions
CREATE POLICY "No direct access"
  ON password_reset_codes FOR ALL
  TO authenticated
  USING (false);

-- Step 7: Create admin password change function
-- =====================================================

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
  WHERE auth_id = calling_user_id;

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

GRANT EXECUTE ON FUNCTION admin_change_user_password(uuid, text) TO authenticated;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Next steps:
-- 1. Update your .env file with your Supabase credentials
-- 2. Register a new account
-- 3. Run this SQL to make yourself admin:
--    UPDATE profiles SET user_rank = 'admin', is_verified = true WHERE username = 'YOUR_USERNAME';
-- 4. Log out and log back in
-- 5. Enjoy! 🎉
-- =====================================================
