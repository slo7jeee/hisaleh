/*
  # Remove background_color column from profiles table

  ## Description
  Removes the background_color column from the profiles table as users will now use
  background images instead of solid colors for their profile backgrounds.

  ## Changes
  1. Drop the background_color column from profiles table

  ## Notes
  - Users should now use background_image_url for custom profile backgrounds
  - This is a non-destructive change as background_color is being deprecated
*/

-- Remove background_color column from profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'background_color'
  ) THEN
    ALTER TABLE profiles DROP COLUMN background_color;
  END IF;
END $$;
