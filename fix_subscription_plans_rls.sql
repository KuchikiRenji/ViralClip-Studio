-- Fix RLS policies for subscription_plans table
-- This allows anonymous users to read active subscription plans
-- Run this in Supabase SQL Editor

-- Step 1: Check current policies
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
WHERE tablename = 'subscription_plans';

-- Step 2: Drop existing policy if it exists (optional - only if you want to recreate)
-- DROP POLICY IF EXISTS "Allow anonymous read active plans" ON subscription_plans;

-- Step 3: Create policy to allow anonymous users to read active plans
CREATE POLICY IF NOT EXISTS "Allow anonymous read active plans"
ON subscription_plans
FOR SELECT
TO anon
USING (is_active = true);

-- Step 4: Also allow authenticated users to read all plans
CREATE POLICY IF NOT EXISTS "Allow authenticated read all plans"
ON subscription_plans
FOR SELECT
TO authenticated
USING (true);

-- Step 5: Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'subscription_plans';

-- Step 6: Test the policy (should return active plans)
-- Run this to verify it works:
SELECT 
  id,
  name,
  price_monthly,
  is_active
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;

-- Expected result: Should return 3 plans (Beginner, Pro, Premium)






