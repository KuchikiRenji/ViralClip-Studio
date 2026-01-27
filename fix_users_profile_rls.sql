-- Fix RLS policies for users_profile table
-- This allows users to create and update their own profiles
-- Run this in Supabase SQL Editor

-- Step 1: Check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users_profile';

-- Step 2: Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users_profile';

-- Step 3: Enable RLS if not already enabled
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (optional - only if you want to recreate)
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;
-- DROP POLICY IF EXISTS "Users can read their own profile" ON users_profile;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;

-- Step 5: Create policy to allow users to INSERT their own profile
CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
ON users_profile
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Step 6: Create policy to allow users to READ their own profile
CREATE POLICY IF NOT EXISTS "Users can read their own profile"
ON users_profile
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Step 7: Create policy to allow users to UPDATE their own profile
CREATE POLICY IF NOT EXISTS "Users can update their own profile"
ON users_profile
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 8: Allow service_role to do everything (for triggers and admin operations)
-- The trigger function uses SECURITY DEFINER, but we still need this for safety
CREATE POLICY IF NOT EXISTS "Service role can manage all profiles"
ON users_profile
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 9: Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Users can read their own profile'
    WHEN cmd = 'INSERT' THEN '✅ Users can insert their own profile'
    WHEN cmd = 'UPDATE' THEN '✅ Users can update their own profile'
    ELSE 'Other'
  END as description
FROM pg_policies 
WHERE tablename = 'users_profile';

-- Step 10: Test the policies (optional - run as a test)
-- This should work for authenticated users:
-- INSERT INTO users_profile (id, display_name) VALUES (auth.uid(), 'Test User');






