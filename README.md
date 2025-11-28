# MasonHub - Rock Collectors Community

A retro-styled community platform for rock collectors built with React, TypeScript, and Supabase.

## Quick Start

### 1. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env`
3. Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2. Setup Database

Copy all SQL from `setup-supabase.sql` and run it in Supabase SQL Editor.

This will create:
- All tables (profiles, projects, rules, announcements)
- Security policies (RLS)
- Database functions
- Initial configuration

### 3. Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 4. Make Yourself Admin

After registering your account, run this in Supabase SQL Editor:

```sql
UPDATE profiles
SET user_rank = 'admin', is_verified = true
WHERE username = 'YOUR_USERNAME';
```

Then log out and log back in.

## Features

### User Features
- User registration and authentication
- Profile customization (avatar, bio, social links)
- Project uploads with demo and download links
- View other users' profiles and projects
- Community rules and announcements

### Rank System
- **Member** - Regular users (default)
- **VIP** - Access to VIP-only projects
- **Mason Official** - Trusted community members
- **Developer** - Platform developers
- **Admin** - Full system access

### Admin Features
- User management (promote, verify, ban, delete)
- Change user passwords
- Edit user badges
- Manage announcements
- Full access to all content

### Access Levels
- **Public** - Everyone can see
- **VIP Room** - Only VIP+ ranks
- **Mason Room** - Only Mason Officials, Developers, and Admins

## Documentation

- `SUPABASE_SETUP.md` - Complete Supabase setup guide
- `ADMIN_SETUP.md` - Admin setup and features
- `setup-supabase.sql` - Complete database schema
- `.env.example` - Environment variables template

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS (retro green terminal theme)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── imageUpload.ts       # Image upload helper
│   ├── pages/
│   │   ├── HomePage.tsx         # Landing page
│   │   ├── AuthPage.tsx         # Login/Register
│   │   ├── ProjectsPage.tsx     # Projects list
│   │   ├── MembersPage.tsx      # Members list
│   │   ├── AdminPanel.tsx       # Admin dashboard
│   │   └── ...
│   ├── types.ts                 # TypeScript types
│   └── App.tsx                  # Main app
├── supabase/
│   └── migrations/              # Database migrations
├── setup-supabase.sql           # Complete DB setup
└── .env                         # Environment variables
```

## Database Schema

### Tables

1. **profiles** - User profiles
   - Basic info (username, email, display_name)
   - Rank and verification status
   - Avatar, bio, social links
   - Mason badge

2. **projects** - User projects
   - Title, description
   - Demo and download URLs
   - Access level (public/vip/mason)
   - Download counter

3. **rules** - Community rules
   - Bilingual (EN/AR)
   - Order and active status

4. **announcements** - Admin announcements
   - Bilingual (EN/AR)
   - Pinned status

5. **password_reset_codes** - Password reset
   - Verification codes
   - Expiration tracking

### Functions

1. **increment_project_downloads** - Auto-increment downloads
2. **admin_change_user_password** - Admin password management

## Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication
- Secure password hashing (bcrypt)
- Admin-only functions with proper validation
- No direct access to sensitive tables

## Development

```bash
# Start dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build

# Preview build
npm run preview
```

## Environment Variables

Required:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

## License

MIT

## Support

For setup help, check:
- `SUPABASE_SETUP.md` - Detailed setup guide
- `ADMIN_SETUP.md` - Admin configuration
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)

---

Built with ❤️ for the rock collecting community
