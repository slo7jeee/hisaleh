/*
  # Add is_banned field to profiles table

  1. Changes
    - Add `is_banned` boolean column to profiles table
    - Default value is false (not banned)
    - This allows admins to ban/unban users from the admin panel

  2. Notes
    - Existing users will have is_banned set to false by default
    - Admins can toggle this field through the admin panel
*/

-- Add is_banned column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_banned boolean DEFAULT false;
  END IF;
END $$;
