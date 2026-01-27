-- Direct fix for pricing - updates ALL active plans regardless of name matching
-- This is a more aggressive approach that should definitely work

-- ============================================
-- METHOD 1: Update by price value (most reliable)
-- ============================================

-- If Pro is showing $0.20, it means price_monthly = 20
UPDATE subscription_plans 
SET price_monthly = 4999 
WHERE is_active = true
AND price_monthly = 20;

-- If Premium is showing $0.50, it means price_monthly = 50
UPDATE subscription_plans 
SET price_monthly = 8999 
WHERE is_active = true
AND price_monthly = 50;

-- ============================================
-- METHOD 2: Update by price range (catches edge cases)
-- ============================================

-- Update any plan with price between 1-99 cents (clearly wrong)
-- This will catch Pro ($0.20 = 20 cents) and Premium ($0.50 = 50 cents)
UPDATE subscription_plans 
SET price_monthly = CASE
  -- If price is 20 cents, it's Pro
  WHEN price_monthly = 20 THEN 4999
  -- If price is 50 cents, it's Premium  
  WHEN price_monthly = 50 THEN 8999
  -- For any other suspiciously low price, try to match by name
  WHEN name ILIKE '%pro%' AND price_monthly < 1000 THEN 4999
  WHEN name ILIKE '%premium%' AND price_monthly < 1000 THEN 8999
  WHEN (name ILIKE '%beginner%' OR name ILIKE '%free%') AND price_monthly < 1000 THEN 2499
  ELSE price_monthly
END
WHERE is_active = true
AND price_monthly < 1000
AND price_monthly > 0;

-- ============================================
-- METHOD 3: Update by name (comprehensive matching)
-- ============================================

-- Update Pro plan with every possible name variation
UPDATE subscription_plans 
SET price_monthly = 4999 
WHERE is_active = true
AND (
  LOWER(TRIM(name)) LIKE '%pro%'
  OR LOWER(TRIM(name)) = 'pro'
  OR LOWER(TRIM(name)) = 'pro plan'
  OR name ILIKE 'pro%'
  OR name ILIKE '%pro%'
)
AND price_monthly != 4999;

-- Update Premium plan with every possible name variation
UPDATE subscription_plans 
SET price_monthly = 8999 
WHERE is_active = true
AND (
  LOWER(TRIM(name)) LIKE '%premium%'
  OR LOWER(TRIM(name)) = 'premium'
  OR LOWER(TRIM(name)) = 'premium plan'
  OR name ILIKE 'premium%'
  OR name ILIKE '%premium%'
)
AND price_monthly != 8999;

-- Update Beginner plan
UPDATE subscription_plans 
SET price_monthly = 2499 
WHERE is_active = true
AND (
  LOWER(TRIM(name)) LIKE '%beginner%'
  OR LOWER(TRIM(name)) LIKE '%free%'
  OR LOWER(TRIM(name)) = 'beginner'
  OR LOWER(TRIM(name)) = 'free'
  OR LOWER(TRIM(name)) = 'beginner plan'
  OR LOWER(TRIM(name)) = 'free plan'
  OR name ILIKE 'beginner%'
  OR name ILIKE '%beginner%'
  OR name ILIKE '%free%'
)
AND price_monthly != 2499;

-- ============================================
-- VERIFY RESULTS
-- ============================================
SELECT 
  id,
  name,
  price_monthly,
  (price_monthly / 100.0) as price_in_dollars_cad,
  CASE 
    WHEN price_monthly = 2499 THEN '✅ Beginner'
    WHEN price_monthly = 4999 THEN '✅ Pro'
    WHEN price_monthly = 8999 THEN '✅ Premium'
    ELSE '❌ WRONG PRICE'
  END as status
FROM subscription_plans 
WHERE is_active = true 
ORDER BY price_monthly;

-- Expected output:
-- Beginner: CA$24.99 (2499 cents)
-- Pro: CA$49.99 (4999 cents)
-- Premium: CA$89.99 (8999 cents)






