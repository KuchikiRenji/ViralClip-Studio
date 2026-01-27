-- Update with NEWLY CREATED Variation IDs
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'CQ4PHWSTEVLJIGNBSZOPIQKJ',
  square_plan_id_annual = 'TH5UIJO4SN7743G6C3OFSR3D'
WHERE name ILIKE '%beginner%';

UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'YZG3TKSBP2PXZYJZUJIRNVSY',
  square_plan_id_annual = 'HFN7UT54YOYGZQYC7P6CHDBO'
WHERE name ILIKE '%pro%';

UPDATE subscription_plans 
SET 
  square_plan_id_monthly = '7YY5SOG3TSKQWX3HMCVQCJIJ',
  square_plan_id_annual = '4O3GSANFDLTOAPKTHWVFMHJK'
WHERE name ILIKE '%premium%';

-- Verify
SELECT name, square_plan_id_monthly, square_plan_id_annual 
FROM subscription_plans 
WHERE is_active = true;
