-- Check which plan has which price and ID
-- Run this in Supabase SQL Editor to diagnose the price mismatch

SELECT 
  id,
  name,
  price_monthly,
  (price_monthly / 100.0) as price_in_dollars,
  square_plan_id_monthly,
  is_active
FROM subscription_plans 
WHERE is_active = true
ORDER BY price_monthly;

-- Expected:
-- Beginner: $24.99 (2499 cents)
-- Pro: $49.99 (4999 cents) 
-- Premium: $89.99 (8999 cents)

-- If Pro shows $69.99 (6999 cents), that's the problem!






