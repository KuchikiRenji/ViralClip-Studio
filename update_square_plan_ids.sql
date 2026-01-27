-- Replace the placeholder values below with your actual Square Plan IDs
-- Then run this file using: supabase db execute -f update_square_plan_ids.sql

-- ============================================
-- BEGINNER PLAN
-- ============================================
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'PASTE_YOUR_BEGINNER_MONTHLY_PLAN_ID_HERE',
  square_plan_id_annual = 'PASTE_YOUR_BEGINNER_ANNUAL_PLAN_ID_HERE',
  price_annual = 29988  -- CA$299.88 annually
WHERE (name ILIKE '%beginner%' OR name ILIKE '%free%')
  AND is_active = true;

-- ============================================
-- PRO PLAN
-- ============================================
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'PASTE_YOUR_PRO_MONTHLY_PLAN_ID_HERE',
  square_plan_id_annual = 'PASTE_YOUR_PRO_ANNUAL_PLAN_ID_HERE',
  price_annual = 59988  -- CA$599.88 annually
WHERE name ILIKE '%pro%'
  AND is_active = true;

-- ============================================
-- PREMIUM PLAN
-- ============================================
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'PASTE_YOUR_PREMIUM_MONTHLY_PLAN_ID_HERE',
  square_plan_id_annual = 'PASTE_YOUR_PREMIUM_ANNUAL_PLAN_ID_HERE',
  price_annual = 107988  -- CA$1079.88 annually
WHERE name ILIKE '%premium%'
  AND is_active = true;

-- ============================================
-- VERIFY THE UPDATES
-- ============================================
SELECT 
  name,
  price_monthly / 100.0 AS monthly_cad,
  price_annual / 100.0 AS annual_cad,
  square_plan_id_monthly AS monthly_plan_id,
  square_plan_id_annual AS annual_plan_id,
  is_active
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;







