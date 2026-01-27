-- Update subscription plan prices to correct values
-- Prices are stored in cents (INTEGER)
-- Beginner: CA$24.99 = 2499 cents
-- Pro: CA$49.99 = 4999 cents
-- Premium: CA$89.99 = 8999 cents

-- Update Beginner plan
UPDATE subscription_plans 
SET price_monthly = 2499 
WHERE (name ILIKE '%beginner%' OR name ILIKE '%free%')
AND is_active = true;

-- Update Pro plan
UPDATE subscription_plans 
SET price_monthly = 4999 
WHERE (name ILIKE '%pro%' OR name = 'Pro')
AND is_active = true;

-- Update Premium plan
UPDATE subscription_plans 
SET price_monthly = 8999 
WHERE (name ILIKE '%premium%' OR name = 'Premium')
AND is_active = true;

-- Verify the updates
SELECT 
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






