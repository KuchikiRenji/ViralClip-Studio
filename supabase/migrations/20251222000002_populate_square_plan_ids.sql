-- Sample data for populating Square plan IDs
-- IMPORTANT: Replace these with actual Square plan IDs from your Square Dashboard

-- Update Beginner plan with Square IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'YOUR_SQUARE_BEGINNER_MONTHLY_PLAN_ID',
  square_plan_id_annual = 'YOUR_SQUARE_BEGINNER_ANNUAL_PLAN_ID',
  price_annual = 29988  -- CA$299.88 annually (20% discount)
WHERE name ILIKE '%beginner%' OR name ILIKE '%free%';

-- Update Pro plan with Square IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'YOUR_SQUARE_PRO_MONTHLY_PLAN_ID',
  square_plan_id_annual = 'YOUR_SQUARE_PRO_ANNUAL_PLAN_ID',
  price_annual = 59988  -- CA$599.88 annually (20% discount)
WHERE name ILIKE '%pro%';

-- Update Premium plan with Square IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'YOUR_SQUARE_PREMIUM_MONTHLY_PLAN_ID',
  square_plan_id_annual = 'YOUR_SQUARE_PREMIUM_ANNUAL_PLAN_ID',
  price_annual = 107988  -- CA$1079.88 annually (20% discount)
WHERE name ILIKE '%premium%';

-- Verify the updates
SELECT 
  name,
  price_monthly / 100.0 AS price_monthly_cad,
  price_annual / 100.0 AS price_annual_cad,
  square_plan_id_monthly,
  square_plan_id_annual
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;







