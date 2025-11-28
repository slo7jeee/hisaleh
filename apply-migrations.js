import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Starting migration process...');
console.log('⚠️  Note: Some operations require service_role key or must be done via Supabase Dashboard SQL Editor');
console.log('');

async function checkSchema() {
  console.log('1️⃣ Checking current schema...');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_banned')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('   ❌ Column "is_banned" does not exist');
        return false;
      }
    } else {
      console.log('   ✅ Column "is_banned" exists');
      return true;
    }
  } catch (err) {
    console.log('   ❌ Error checking schema:', err.message);
    return false;
  }
}

async function main() {
  const hasBannedColumn = await checkSchema();

  console.log('');
  console.log('📋 MIGRATION REQUIRED:');
  console.log('');
  console.log('Please run the following SQL in your Supabase Dashboard > SQL Editor:');
  console.log('');
  console.log('---------------------------------------------------');
  console.log(`
-- 1️⃣ Add is_banned column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- 2️⃣ Drop old update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 3️⃣ Create new update policy (admin can update any)
CREATE POLICY "Users can update own profile or admin can update any"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- 4️⃣ Drop old delete policy
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- 5️⃣ Create new delete policy (admin only)
CREATE POLICY "Admin can delete any profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );

-- 6️⃣ Drop old project delete policy
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- 7️⃣ Create new project delete policy (admin can delete any)
CREATE POLICY "Users can delete own projects or admin can delete any"
  ON projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_rank = 'admin'
    )
  );
  `);
  console.log('---------------------------------------------------');
  console.log('');
  console.log('After running the SQL:');
  console.log('1. Logout and login again');
  console.log('2. Test the Admin Panel features');
  console.log('3. Everything should work! ✅');
}

main();
