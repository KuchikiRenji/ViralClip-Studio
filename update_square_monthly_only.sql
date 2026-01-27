-- Update subscription plans with ONLY monthly Square Plan IDs
-- Replace the placeholder values with your actual Square monthly Plan IDs
-- Annual plan IDs are set to NULL (not available yet)

-- ============================================
-- BEGINNER PLAN (Monthly Only)
-- ============================================
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'PASTE_YOUR_BEGINNER_MONTHLY_ID_HERE',
  square_plan_id_annual = NULL
WHERE (name ILIKE '%beginner%' OR name ILIKE '%free%')
  AND is_active = true;

-- ============================================
-- PRO PLAN (Monthly Only)
-- ============================================
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'PASTE_YOUR_PRO_MONTHLY_ID_HERE',
  square_plan_id_annual = NULL
WHERE name ILIKE '%pro%'
  AND is_active = true;

-- ============================================
-- PREMIUM PLAN (Monthly Only)
-- ============================================
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'PASTE_YOUR_PREMIUM_MONTHLY_ID_HERE',
  square_plan_id_annual = NULL
WHERE name ILIKE '%premium%'
  AND is_active = true;

-- ============================================
-- VERIFY THE UPDATES
-- ============================================
SELECT 
  name,
  price_monthly / 100.0 AS monthly_cad,
  square_plan_id_monthly AS monthly_plan_id,
  square_plan_id_annual AS annual_plan_id,
  is_active
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;

-- Expected result: 3 rows with monthly_plan_id populated and annual_plan_id = NULL







