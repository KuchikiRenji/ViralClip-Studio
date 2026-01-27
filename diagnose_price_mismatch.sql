-- Diagnose price mismatch issue
-- Run this in Supabase SQL Editor to see which plan has which Square ID

SELECT 
  id,
  name,
  price_monthly,
  (price_monthly / 100.0) as price_in_dollars,
  square_plan_id_monthly,
  square_plan_id_annual,
  is_active
FROM subscription_plans 
WHERE is_active = true
ORDER BY price_monthly;

-- Expected mapping:
-- Beginner: $24.99 (2499 cents) -> Should have Beginner Monthly Square ID
-- Pro: $49.99 (4999 cents) -> Should have Pro Monthly Square ID  
-- Premium: $89.99 (8999 cents) -> Should have Premium Monthly Square ID

-- If Pro ($49.99) has Premium's Square ID, that's why you're getting $69.99!

-- Check which Square plan ID corresponds to which price:
-- You may need to check Square Dashboard to see what price each Square plan ID has






