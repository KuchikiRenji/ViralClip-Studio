-- Detailed fix for pricing issue
-- This script will:
-- 1. Show current state
-- 2. Update prices more reliably
-- 3. Verify the results

-- ============================================
-- STEP 1: Check current state
-- ============================================
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

-- ============================================
-- STEP 2: Update prices with more specific matching
-- ============================================

-- Update Beginner plan (should be CA$24.99 = 2499 cents)
-- Try multiple name patterns to ensure we catch it
UPDATE subscription_plans 
SET price_monthly = 2499 
WHERE is_active = true
AND (
  name ILIKE '%beginner%' 
  OR name ILIKE '%free%'
  OR name = 'Beginner'
  OR name = 'Free'
  OR LOWER(name) = 'beginner plan'
  OR LOWER(name) = 'free plan'
)
AND price_monthly != 2499;

-- Update Pro plan (should be CA$49.99 = 4999 cents)
-- Try multiple name patterns
UPDATE subscription_plans 
SET price_monthly = 4999 
WHERE is_active = true
AND (
  name ILIKE '%pro%'
  OR name = 'Pro'
  OR name = 'Pro Plan'
  OR LOWER(name) = 'pro plan'
  OR LOWER(name) LIKE '%pro%'
)
AND price_monthly != 4999;

-- Update Premium plan (should be CA$89.99 = 8999 cents)
-- Try multiple name patterns
UPDATE subscription_plans 
SET price_monthly = 8999 
WHERE is_active = true
AND (
  name ILIKE '%premium%'
  OR name = 'Premium'
  OR name = 'Premium Plan'
  OR LOWER(name) = 'premium plan'
  OR LOWER(name) LIKE '%premium%'
)
AND price_monthly != 8999;

-- ============================================
-- STEP 3: Force update if prices are still wrong
-- ============================================
-- If the above didn't work, this will update ALL active plans
-- based on price_monthly value (for plans with obviously wrong prices)

-- Fix Pro plan if it's showing $0.20 (20 cents)
UPDATE subscription_plans 
SET price_monthly = 4999 
WHERE is_active = true
AND price_monthly = 20
AND (name ILIKE '%pro%' OR name = 'Pro');

-- Fix Premium plan if it's showing $0.50 (50 cents)
UPDATE subscription_plans 
SET price_monthly = 8999 
WHERE is_active = true
AND price_monthly = 50
AND (name ILIKE '%premium%' OR name = 'Premium');

-- Fix any plan with suspiciously low prices (< 1000 cents = < $10)
-- This catches any edge cases
UPDATE subscription_plans 
SET price_monthly = CASE
  WHEN name ILIKE '%beginner%' OR name ILIKE '%free%' THEN 2499
  WHEN name ILIKE '%pro%' THEN 4999
  WHEN name ILIKE '%premium%' THEN 8999
  ELSE price_monthly
END
WHERE is_active = true
AND price_monthly < 1000
AND price_monthly > 0
AND (
  name ILIKE '%beginner%' 
  OR name ILIKE '%free%'
  OR name ILIKE '%pro%'
  OR name ILIKE '%premium%'
);

-- ============================================
-- STEP 4: Verify final state
-- ============================================
SELECT 
  id,
  name,
  price_monthly,
  (price_monthly / 100.0) as price_in_dollars_cad,
  is_active
FROM subscription_plans 
WHERE is_active = true 
ORDER BY price_monthly;

-- Expected results:
-- Beginner: 2499 cents = CA$24.99
-- Pro: 4999 cents = CA$49.99
-- Premium: 8999 cents = CA$89.99






