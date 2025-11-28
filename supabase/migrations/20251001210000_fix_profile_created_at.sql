/*
  # Fix Profile Creation Date

  ## Description
  Ensures that profile creation dates match the actual auth.users creation date.
  This migration creates a trigger to automatically set the correct created_at
  from auth.users when a profile is created.

  ## Changes
  - Create trigger function to set created_at from auth.users
  - Apply trigger on INSERT to profiles table
  - Update existing profiles to use auth.users.created_at

  ## Security
  - No changes to RLS policies
  - Only affects created_at timestamp accuracy
*/

-- Create function to set created_at from auth.users
CREATE OR REPLACE FUNCTION set_profile_created_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the created_at from auth.users
  SELECT created_at INTO NEW.created_at
  FROM auth.users
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before INSERT on profiles
DROP TRIGGER IF EXISTS set_profile_created_at_trigger ON profiles;
CREATE TRIGGER set_profile_created_at_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_created_at();

-- Update existing profiles to use correct created_at from auth.users
UPDATE profiles
SET created_at = auth.users.created_at
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.created_at IS DISTINCT FROM auth.users.created_at;
