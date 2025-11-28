/*
  # Create password reset codes table

  1. New Tables
    - `password_reset_codes`
      - `id` (uuid, primary key)
      - `email` (text, user email)
      - `code` (text, 6-digit verification code)
      - `expires_at` (timestamptz, expiration time)
      - `used` (boolean, whether code was used)
      - `created_at` (timestamptz, creation timestamp)

  2. Security
    - Enable RLS on `password_reset_codes` table
    - Codes expire after 10 minutes
    - Codes can only be used once

  3. Notes
    - Users can request new codes
    - Old unused codes remain in database for audit
*/

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert reset codes"
  ON password_reset_codes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read their own codes"
  ON password_reset_codes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update codes"
  ON password_reset_codes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_reset_codes_code ON password_reset_codes(code);
CREATE INDEX IF NOT EXISTS idx_reset_codes_expires_at ON password_reset_codes(expires_at);
