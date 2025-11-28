/*
  # Create rules table for platform rules/guidelines

  ## Description
  Creates a table to store platform rules and guidelines that can be
  managed by administrators. Only one active rules entry should exist at a time.

  ## New Tables

  ### `rules`
  Platform rules and guidelines
  - `id` (uuid, primary key) - Unique identifier
  - `content` (text, required) - Rules content in markdown format
  - `updated_by` (uuid) - References profiles table (admin who last updated)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on rules table
  - Everyone can read rules
  - Only admins can create/update/delete rules

  ## Notes
  - Content should be in markdown format for rich text support
  - Only one rules entry should exist, or use a version system
  - Admins can edit the rules through the admin panel
*/

-- Create rules table
CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read rules
CREATE POLICY "Anyone can read rules"
  ON rules
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert rules
CREATE POLICY "Only admins can insert rules"
  ON rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- Policy: Only admins can update rules
CREATE POLICY "Only admins can update rules"
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

-- Policy: Only admins can delete rules
CREATE POLICY "Only admins can delete rules"
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

-- Insert default rules
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
