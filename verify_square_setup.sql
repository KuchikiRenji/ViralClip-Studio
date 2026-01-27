-- Check what Plan ID is currently in the database
SELECT 
  name,
  price_monthly / 100.0 AS price_cad,
  square_plan_id_monthly,
  is_active
FROM subscription_plans
WHERE is_active = true;

-- This will show you what Plan ID the system is trying to use
-- Compare this with your Square Dashboard → Subscriptions → Plans







