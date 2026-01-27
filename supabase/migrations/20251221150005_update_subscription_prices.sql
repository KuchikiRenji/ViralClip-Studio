-- Fix subscription plan prices that are incorrectly stored
-- Prices should be stored in cents (INTEGER)
-- This migration corrects prices that were stored as dollars instead of cents

-- Update Pro plan to $49.99 (4999 cents)
-- Currently showing as $0.20, which means database has 20 instead of 4999
UPDATE subscription_plans 
SET price_monthly = 4999 
WHERE (name ILIKE '%pro%' OR name = 'Pro')
AND is_active = true
AND (price_monthly < 1000 OR price_monthly = 20);

-- Update Premium plan to $89.99 (8999 cents)
-- Currently showing as $0.50, which means database has 50 instead of 8999
UPDATE subscription_plans 
SET price_monthly = 8999 
WHERE (name ILIKE '%premium%' OR name = 'Premium')
AND is_active = true
AND (price_monthly < 1000 OR price_monthly = 50);

-- Ensure Beginner/Free plan is $24.99 (2499 cents)
UPDATE subscription_plans 
SET price_monthly = 2499 
WHERE (name ILIKE '%beginner%' OR name ILIKE '%free%')
AND is_active = true
AND price_monthly != 2499;

-- Verify all active plans have correct pricing
-- This query can be run to check the results:
-- SELECT name, price_monthly, (price_monthly / 100.0) as price_in_dollars 
-- FROM subscription_plans 
-- WHERE is_active = true 
-- ORDER BY price_monthly;

