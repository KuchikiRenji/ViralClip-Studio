-- Check current prices in database
-- Run this in Supabase SQL Editor to see what's actually stored

SELECT 
  id,
  name,
  price_monthly,
  (price_monthly / 100.0) as price_in_dollars_cad,
  is_active,
  created_at
FROM subscription_plans 
WHERE is_active = true 
ORDER BY price_monthly;

-- This will show us:
-- 1. What prices are actually stored
-- 2. How many plans exist
-- 3. The exact names of the plans (to match them correctly)






