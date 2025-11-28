/*
  # Modify Rules Table for Individual Entries

  ## Description
  Changes the rules system to allow each admin to add their own rule.
  Each rule has a title and content, and admins can manage their own rules.

  ## Changes
  - Add title column to rules table
  - Rename updated_by to created_by
  - Update policies to allow admins to edit/delete their own rules
  - Clear existing default rule

  ## Security
  - Everyone can read all rules
  - Only admins can create rules
  - Admins can edit/delete their own rules
  - Admins can delete any rule
*/

-- Add title column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rules' AND column_name = 'title'
  ) THEN
    ALTER TABLE rules ADD COLUMN title text;
  END IF;
END $$;

-- Rename updated_by to created_by if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rules' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE rules RENAME COLUMN updated_by TO created_by;
  END IF;
END $$;

-- Make title NOT NULL with default for existing rows
UPDATE rules SET title = 'Platform Rules' WHERE title IS NULL;
ALTER TABLE rules ALTER COLUMN title SET NOT NULL;

-- Drop old policies
DROP POLICY IF EXISTS "Only admins can update rules" ON rules;
DROP POLICY IF EXISTS "Only admins can delete rules" ON rules;

-- Create new update policy (admins can edit their own rules)
CREATE POLICY "Admins can update own rules"
  ON rules
  FOR UPDATE
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

-- Create new delete policy (admins can delete any rule)
CREATE POLICY "Admins can delete any rule"
  ON rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- Clear default rules (admins will add their own)
DELETE FROM rules WHERE created_by IS NULL;
