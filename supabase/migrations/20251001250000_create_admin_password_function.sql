/*
  # Admin Password Change Function

  1. New Functions
    - `admin_change_user_password` - Allows admins to change any user's password
      - Parameters: target_user_id (uuid), new_password (text)
      - Updates both auth.users and profiles table
      - Only callable by admins
      - Returns success boolean

  2. Security
    - Function has SECURITY DEFINER to access auth schema
    - Validates caller is an admin
    - Updates password in auth.users (Supabase Auth)
    - Updates password in profiles (backup)
    - Validates password length (minimum 6 characters)

  3. Important Notes
    - This function runs with elevated privileges (SECURITY DEFINER)
    - Only admins can execute it successfully
    - Password is hashed using bcrypt (gen_salt('bf'))
    - Both auth.users and profiles are updated atomically
*/

-- Create function to change user password (admin only)
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

-- Grant execute permission to authenticated users (function will check admin internally)
GRANT EXECUTE ON FUNCTION admin_change_user_password(uuid, text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION admin_change_user_password IS 'Allows admins to change any user password in both auth.users and profiles tables. Validates admin privileges and password length.';
