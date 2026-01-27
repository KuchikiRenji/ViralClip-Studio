-- Add Square integration columns to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS square_plan_id_monthly TEXT,
ADD COLUMN IF NOT EXISTS square_plan_id_annual TEXT,
ADD COLUMN IF NOT EXISTS price_annual INTEGER;

-- Add Square customer ID and admin flag to users_profile table
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS square_customer_id TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_square_monthly 
ON subscription_plans(square_plan_id_monthly);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_square_annual 
ON subscription_plans(square_plan_id_annual);

CREATE INDEX IF NOT EXISTS idx_users_profile_square_customer 
ON users_profile(square_customer_id);

-- Add comment
COMMENT ON COLUMN subscription_plans.square_plan_id_monthly IS 'Square subscription plan ID for monthly billing';
COMMENT ON COLUMN subscription_plans.square_plan_id_annual IS 'Square subscription plan ID for annual billing';
COMMENT ON COLUMN subscription_plans.price_annual IS 'Annual subscription price in cents';
COMMENT ON COLUMN users_profile.square_customer_id IS 'Square customer ID for payment processing';
COMMENT ON COLUMN users_profile.is_admin IS 'Flag indicating if user has admin privileges';

