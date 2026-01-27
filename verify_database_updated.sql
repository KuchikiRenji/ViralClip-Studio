-- Quick check: Are the variation IDs updated in your database?
-- Run this in Supabase SQL Editor to verify

SELECT 
  name,
  square_plan_id_monthly,
  square_plan_id_annual,
  CASE 
    WHEN square_plan_id_monthly = 'NKISKO27CCF4ABTV2BMDBKHM' THEN '✅ CORRECT'
    WHEN square_plan_id_monthly LIKE 'YOUR_%' THEN '❌ PLACEHOLDER'
    WHEN square_plan_id_monthly = 'O226LIAVKLZLCB2KDF3GPOC4' THEN '❌ PLAN ID (need VARIATION ID)'
    ELSE '❓ UNKNOWN'
  END as beginner_monthly_status,
  CASE 
    WHEN square_plan_id_monthly = 'SIPJFZUV5EMHYVONVP74QOL4' THEN '✅ CORRECT'
    WHEN square_plan_id_monthly LIKE 'YOUR_%' THEN '❌ PLACEHOLDER'
    WHEN square_plan_id_monthly = 'EBZ7SIRO7GXXRCDQ47EYVLWX' THEN '❌ PLAN ID (need VARIATION ID)'
    ELSE '❓ UNKNOWN'
  END as pro_monthly_status,
  CASE 
    WHEN square_plan_id_monthly = 'NBAZGSMGABC7IY3IKFEEZZKP' THEN '✅ CORRECT'
    WHEN square_plan_id_monthly LIKE 'YOUR_%' THEN '❌ PLACEHOLDER'
    WHEN square_plan_id_monthly = 'VQLQHCP22XT5TNIVVRA7VMGF' THEN '❌ PLAN ID (need VARIATION ID)'
    ELSE '❓ UNKNOWN'
  END as premium_monthly_status
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;

-- Expected results:
-- Beginner should have: NKISKO27CCF4ABTV2BMDBKHM (monthly), VNELEISTJBP2R5A5SF6UW46I (annual)
-- Pro should have:      SIPJFZUV5EMHYVONVP74QOL4 (monthly), THFYEHH2MRGWNY47RS7ULF5X (annual)
-- Premium should have:  NBAZGSMGABC7IY3IKFEEZZKP (monthly), JBVRPTIVWEPI5SKT4WXBMK2S (annual)







