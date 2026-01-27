-- Diagnostic script to find why Pro and Premium prices aren't updating
-- Run this FIRST to see what's actually in the database

-- Show ALL plans (active and inactive)
SELECT 
  id,
  name,
  price_monthly,
  (price_monthly / 100.0) as price_in_dollars_cad,
  is_active,
  created_at,
  updated_at
FROM subscription_plans 
ORDER BY is_active DESC, price_monthly;

-- Check if there are multiple plans with similar names
SELECT 
  name,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as plan_ids,
  STRING_AGG(price_monthly::text, ', ') as prices
FROM subscription_plans
WHERE is_active = true
GROUP BY name
HAVING COUNT(*) > 1;

-- Check exact name matching
SELECT 
  id,
  name,
  price_monthly,
  (price_monthly / 100.0) as price_in_dollars_cad,
  CASE 
    WHEN name ILIKE '%pro%' THEN 'MATCHES PRO'
    WHEN name ILIKE '%premium%' THEN 'MATCHES PREMIUM'
    WHEN name ILIKE '%beginner%' OR name ILIKE '%free%' THEN 'MATCHES BEGINNER'
    ELSE 'NO MATCH'
  END as name_match
FROM subscription_plans 
WHERE is_active = true
ORDER BY price_monthly;

-- Check for plans with suspiciously low prices
SELECT 
  id,
  name,
  price_monthly,
  (price_monthly / 100.0) as price_in_dollars_cad,
  CASE 
    WHEN price_monthly = 20 THEN '⚠️ This is Pro showing $0.20'
    WHEN price_monthly = 50 THEN '⚠️ This is Premium showing $0.50'
    WHEN price_monthly = 2499 THEN '✅ Beginner correct'
    WHEN price_monthly = 4999 THEN '✅ Pro correct'
    WHEN price_monthly = 8999 THEN '✅ Premium correct'
    ELSE '❓ Unknown price'
  END as price_status
FROM subscription_plans 
WHERE is_active = true
ORDER BY price_monthly;

