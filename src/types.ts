export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  background_color?: string;
  background_image_url?: string;
  social_links?: Array<{ platform: string; url: string }>;
  user_rank?: 'admin' | 'developer' | 'mason_official' | 'vip' | 'member';
  mason_badge?: string;
  is_verified?: boolean;
  is_banned?: boolean;
  created_at?: string;
  updated_at?: string;
  email?: string;
  banned_until?: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  language?: string;
  download_link: string;
  image_url?: string;
  created_at?: string;
  is_official?: boolean;
  featured?: boolean;
  download_count?: number;
  project_type?: 'public' | 'vip' | 'mason';
  profiles?: Profile;
}

export interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
}
