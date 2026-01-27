-- Update database with CORRECT Square Plan VARIATION IDs
-- These are the real variation IDs from your PRODUCTION Square account
-- Run this in Supabase SQL Editor

-- Update Beginner plan
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'NKISKO27CCF4ABTV2BMDBKHM',  -- Beginner Monthly Variation
  square_plan_id_annual = 'VNELEISTJBP2R5A5SF6UW46I'    -- Beginner Annual Variation
WHERE name ILIKE '%beginner%' OR name ILIKE '%free%';

-- Update Pro plan
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'SIPJFZUV5EMHYVONVP74QOL4',  -- Pro Monthly Variation (first one)
  square_plan_id_annual = 'THFYEHH2MRGWNY47RS7ULF5X'    -- Pro Annual Variation
WHERE name ILIKE '%pro%';

-- Update Premium plan
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'NBAZGSMGABC7IY3IKFEEZZKP',  -- Premium Monthly Variation
  square_plan_id_annual = 'JBVRPTIVWEPI5SKT4WXBMK2S'    -- Premium Annual Variation
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

-- Expected results:
-- Beginner: Monthly = NKISKO27CCF4ABTV2BMDBKHM, Annual = VNELEISTJBP2R5A5SF6UW46I
-- Pro:      Monthly = SIPJFZUV5EMHYVONVP74QOL4, Annual = THFYEHH2MRGWNY47RS7ULF5X
-- Premium:  Monthly = NBAZGSMGABC7IY3IKFEEZZKP, Annual = JBVRPTIVWEPI5SKT4WXBMK2S







