/*
  # Create Announcements Table

  ## Description
  Creates a table for admin announcements with support for multiple images
  and rich content. Admins can post announcements with text and images.

  ## New Tables

  ### `announcements`
  Platform announcements from admins
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text, required) - Announcement title
  - `content` (text, required) - Announcement content/article
  - `images` (jsonb) - Array of image URLs
  - `created_by` (uuid) - References profiles table (admin who created)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on announcements table
  - Everyone can read announcements
  - Only admins can create/update/delete announcements

  ## Storage
  - Uses 'announcements' storage bucket for images
*/

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read announcements
CREATE POLICY "Anyone can read announcements"
  ON announcements
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert announcements
CREATE POLICY "Only admins can insert announcements"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- Policy: Only admins can update announcements
CREATE POLICY "Only admins can update announcements"
  ON announcements
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

-- Policy: Only admins can delete announcements
CREATE POLICY "Only admins can delete announcements"
  ON announcements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- Create announcements storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can view announcement images
CREATE POLICY "Anyone can view announcement images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'announcements');

-- Storage policy: Admins can upload announcement images
CREATE POLICY "Admins can upload announcement images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'announcements'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- Storage policy: Admins can delete announcement images
CREATE POLICY "Admins can delete announcement images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'announcements'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );
