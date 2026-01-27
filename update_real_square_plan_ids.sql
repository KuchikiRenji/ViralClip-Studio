-- ============================================
-- UPDATE WITH YOUR REAL SQUARE PLAN IDs
-- ============================================
-- INSTRUCTIONS:
-- 1. Go to Square Dashboard → Subscriptions → Plans
-- 2. Get the Plan Variation ID for each plan
-- 3. Replace the placeholders below with your actual IDs
-- 4. Run this script in Supabase SQL Editor
-- ============================================

-- First, let's see what we currently have
SELECT 
  name,
  price_monthly / 100.0 AS monthly_cad,
  price_annual / 100.0 AS annual_cad,
  square_plan_id_monthly,
  square_plan_id_annual,
  is_active
FROM subscription_plans
ORDER BY price_monthly;

-- Update Beginner plan with REAL Square Plan IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'PASTE_YOUR_BEGINNER_MONTHLY_PLAN_VARIATION_ID_HERE',
  square_plan_id_annual = 'PASTE_YOUR_BEGINNER_ANNUAL_PLAN_VARIATION_ID_HERE'
WHERE name ILIKE '%beginner%' OR name ILIKE '%free%';

-- Update Pro plan with REAL Square Plan IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'PASTE_YOUR_PRO_MONTHLY_PLAN_VARIATION_ID_HERE',
  square_plan_id_annual = 'PASTE_YOUR_PRO_ANNUAL_PLAN_VARIATION_ID_HERE'
WHERE name ILIKE '%pro%';

-- Update Premium plan with REAL Square Plan IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'PASTE_YOUR_PREMIUM_MONTHLY_PLAN_VARIATION_ID_HERE',
  square_plan_id_annual = 'PASTE_YOUR_PREMIUM_ANNUAL_PLAN_VARIATION_ID_HERE'
WHERE name ILIKE '%premium%';

-- Verify the updates
SELECT 
  name,
  price_monthly / 100.0 AS monthly_cad,
  price_annual / 100.0 AS annual_cad,
  square_plan_id_monthly,
  square_plan_id_annual,
  is_active
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;

-- ============================================
-- IMPORTANT: Make sure none of the IDs say "PASTE_YOUR..." or "YOUR_SQUARE..."
-- They should all be real Square plan variation IDs
-- ============================================







