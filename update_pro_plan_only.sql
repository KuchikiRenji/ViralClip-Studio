-- Update ONLY the Pro plan with your Square Plan ID
-- Other plans will remain inactive/unavailable

-- ============================================
-- PRO PLAN (Monthly Only)
-- ============================================
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'EBZ7SIRO7GXXRCDQ47EYVLWX',
  square_plan_id_annual = NULL
WHERE name ILIKE '%pro%'
  AND is_active = true;

-- Optionally deactivate other plans so they don't show up
UPDATE subscription_plans 
SET is_active = false
WHERE name NOT ILIKE '%pro%';

-- Verify only Pro plan is active
SELECT 
  name,
  price_monthly / 100.0 AS monthly_cad,
  square_plan_id_monthly AS monthly_plan_id,
  is_active
FROM subscription_plans
ORDER BY price_monthly;

-- Expected result: Only Pro plan with is_active=true and plan_id populated







