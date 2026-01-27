-- ============================================
-- UPDATE DATABASE WITH REAL SQUARE PLAN IDs
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- First, let's see what we currently have
SELECT 
  name,
  price_monthly / 100.0 AS monthly_cad,
  price_annual / 100.0 AS annual_cad,
  square_plan_id_monthly,
  square_plan_id_annual,
  is_active
FROM subscription_plans
ORDER BY price_monthly;

-- Update Beginner plan with REAL Square Plan IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'O226LIAVKLZLCB2KDF3GPOC4',
  square_plan_id_annual = 'B5I37N43S7NP4HXVAWHERAM3'
WHERE name ILIKE '%beginner%' OR name ILIKE '%free%';

-- Update Pro plan with REAL Square Plan IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'EBZ7SIRO7GXXRCDQ47EYVLWX',
  square_plan_id_annual = 'BDE6LZ6M6TQOVWCUF6OVPAHW'
WHERE name ILIKE '%pro%';

-- Update Premium plan with REAL Square Plan IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'VQLQHCP22XT5TNIVVRA7VMGF',
  square_plan_id_annual = 'XV3KEGH3IBE7UIN7OPG565AB'
WHERE name ILIKE '%premium%';

-- Verify the updates
SELECT 
  name,
  price_monthly / 100.0 AS monthly_cad,
  price_annual / 100.0 AS annual_cad,
  square_plan_id_monthly,
  square_plan_id_annual,
  is_active
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;

-- ============================================
-- SUCCESS! Your plan IDs should now be set correctly.
-- ============================================
-- Expected results:
-- Beginner: Monthly = O226LIAVKLZLCB2KDF3GPOC4, Annual = B5I37N43S7NP4HXVAWHERAM3
-- Pro:      Monthly = EBZ7SIRO7GXXRCDQ47EYVLWX, Annual = BDE6LZ6M6TQOVWCUF6OVPAHW
-- Premium:  Monthly = VQLQHCP22XT5TNIVVRA7VMGF, Annual = XV3KEGH3IBE7UIN7OPG565AB
-- ============================================







