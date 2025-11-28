/*
  # Create MasonHub Database Schema

  ## Description
  Creates the complete database schema for MasonHub - a rock collectors community platform.
  This includes user profiles, projects, and all necessary security policies.

  ## New Tables
  
  ### 1. `profiles`
  User profile information and permissions
  - `id` (uuid, primary key) - References auth.users
  - `username` (text, unique, required) - User's unique username
  - `display_name` (text) - Display name for the profile
  - `bio` (text) - User biography
  - `avatar_url` (text) - URL to avatar image
  - `background_color` (text) - Profile background color
  - `background_image_url` (text) - Profile background image URL
  - `social_links` (jsonb) - Array of social media links
  - `user_rank` (text) - User rank: admin, developer, mason_official, vip, member
  - `mason_badge` (text) - Special badge text for high-rank users
  - `is_verified` (boolean) - Verification status
  - `banned_until` (timestamptz) - Ban expiration date
  - `email` (text) - User email (for admin access)
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `projects`
  Community projects and downloads
  - `id` (uuid, primary key) - Unique project identifier
  - `user_id` (uuid, required) - References profiles table
  - `title` (text, required) - Project title
  - `description` (text) - Project description
  - `language` (text) - Programming language used
  - `download_link` (text, required) - URL to download the project
  - `image_url` (text) - Project preview image URL
  - `project_type` (text) - Access level: public, vip, mason
  - `is_official` (boolean) - Official project flag
  - `featured` (boolean) - Featured project flag
  - `download_count` (integer) - Number of downloads
  - `created_at` (timestamptz) - Project creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Profiles: Users can read all profiles, update only their own
  - Projects: Users can read based on access level, create/update/delete their own
  - Admin users have full access to all operations

  ## Storage Buckets
  - Creates storage buckets for avatars and project images
  - Public access for viewing, authenticated for uploading
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  background_color text DEFAULT '#000000',
  background_image_url text,
  social_links jsonb DEFAULT '[]'::jsonb,
  user_rank text DEFAULT 'member' CHECK (user_rank IN ('admin', 'developer', 'mason_official', 'vip', 'member')),
  mason_badge text,
  is_verified boolean DEFAULT false,
  banned_until timestamptz,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  language text,
  download_link text NOT NULL,
  image_url text,
  project_type text DEFAULT 'public' CHECK (project_type IN ('public', 'vip', 'mason')),
  is_official boolean DEFAULT false,
  featured boolean DEFAULT false,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_user_rank_idx ON profiles(user_rank);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_project_type_idx ON projects(project_type);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Projects RLS Policies
CREATE POLICY "Public projects are viewable by everyone"
  ON projects FOR SELECT
  USING (
    project_type = 'public' OR
    project_type IS NULL OR
    (project_type = 'vip' AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND user_rank IN ('admin', 'vip', 'mason_official')
    )) OR
    (project_type = 'mason' AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND user_rank IN ('admin', 'mason_official')
    ))
  );

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND user_rank IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND user_rank IN ('admin', 'developer')
    )
  );

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND user_rank IN ('admin', 'developer')
    )
  );

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for project images
CREATE POLICY "Project images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Users can update own project images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own project images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();