# Create Square Subscription Plans via API
# This will create all 6 subscription plans in your Square Sandbox account

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Square Subscription Plans Creator" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Using SANDBOX credentials
$SQUARE_ACCESS_TOKEN = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
$SQUARE_LOCATION_ID = "LKXHQZGTCYFT4"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"

Write-Host "Environment: SANDBOX" -ForegroundColor Yellow
Write-Host "Location ID: $SQUARE_LOCATION_ID" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# Define all 6 subscription plans
$plans = @(
    @{
        Name = "Beginner Monthly"
        Cadence = "MONTHLY"
        Price = 3499  # $34.99 in cents
    },
    @{
        Name = "Beginner Annual"
        Cadence = "ANNUAL"
        Price = 29988  # $299.88 in cents
    },
    @{
        Name = "Pro Monthly"
        Cadence = "MONTHLY"
        Price = 6999  # $69.99 in cents
    },
    @{
        Name = "Pro Annual"
        Cadence = "ANNUAL"
        Price = 59988  # $599.88 in cents
    },
    @{
        Name = "Premium Monthly"
        Cadence = "MONTHLY"
        Price = 12999  # $129.99 in cents
    },
    @{
        Name = "Premium Annual"
        Cadence = "ANNUAL"
        Price = 107988  # $1079.88 in cents
    }
)

$createdPlans = @()

foreach ($plan in $plans) {
    Write-Host "Creating plan: $($plan.Name)..." -ForegroundColor Cyan
    
    # Create the plan using Catalog API
    $catalogBody = @{
        idempotency_key = [guid]::NewGuid().ToString()
        object = @{
            type = "SUBSCRIPTION_PLAN"
            id = "#plan-$([guid]::NewGuid().ToString())"
            subscription_plan_data = @{
                name = $plan.Name
                phases = @(
                    @{
                        cadence = $plan.Cadence
                        recurring_price_money = @{
                            amount = $plan.Price
                            currency = "CAD"
                        }
                    }
                )
            }
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/object" `
            -Method Post `
            -Headers $headers `
            -Body $catalogBody
        
        if ($response.catalog_object) {
            $planId = $response.catalog_object.id
            $variationId = $response.catalog_object.subscription_plan_data.subscription_plan_variations[0].id
            
            Write-Host "  SUCCESS!" -ForegroundColor Green
            Write-Host "  Plan ID: $planId" -ForegroundColor Gray
            Write-Host "  Variation ID: " -NoNewline -ForegroundColor Green
            Write-Host $variationId -ForegroundColor White -BackgroundColor DarkGreen
            Write-Host ""
            
            $createdPlans += [PSCustomObject]@{
                Name = $plan.Name
                PlanId = $planId
                VariationId = $variationId
            }
        }
        
    } catch {
        Write-Host "  ERROR:" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorJson.errors) {
                foreach ($err in $errorJson.errors) {
                    Write-Host "  - $($err.detail)" -ForegroundColor Yellow
                }
            }
        }
        Write-Host ""
    }
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if ($createdPlans.Count -gt 0) {
    Write-Host "Successfully created $($createdPlans.Count) plan(s)!" -ForegroundColor Green
    Write-Host ""
    
    # Generate SQL update script
    Write-Host "Copy these IDs for your database:" -ForegroundColor Yellow
    Write-Host ""
    
    $beginnerMonthly = ($createdPlans | Where-Object { $_.Name -eq "Beginner Monthly" }).VariationId
    $beginnerAnnual = ($createdPlans | Where-Object { $_.Name -eq "Beginner Annual" }).VariationId
    $proMonthly = ($createdPlans | Where-Object { $_.Name -eq "Pro Monthly" }).VariationId
    $proAnnual = ($createdPlans | Where-Object { $_.Name -eq "Pro Annual" }).VariationId
    $premiumMonthly = ($createdPlans | Where-Object { $_.Name -eq "Premium Monthly" }).VariationId
    $premiumAnnual = ($createdPlans | Where-Object { $_.Name -eq "Premium Annual" }).VariationId
    
    Write-Host "Beginner Monthly: $beginnerMonthly" -ForegroundColor Cyan
    Write-Host "Beginner Annual:  $beginnerAnnual" -ForegroundColor Cyan
    Write-Host "Pro Monthly:      $proMonthly" -ForegroundColor Cyan
    Write-Host "Pro Annual:       $proAnnual" -ForegroundColor Cyan
    Write-Host "Premium Monthly:  $premiumMonthly" -ForegroundColor Cyan
    Write-Host "Premium Annual:   $premiumAnnual" -ForegroundColor Cyan
    Write-Host ""
    
    # Generate and save SQL update script
    $sqlScript = @"
-- Auto-generated SQL to update subscription plans with real Square IDs
-- Run this in Supabase SQL Editor

-- Update Beginner plan
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = '$beginnerMonthly',
  square_plan_id_annual = '$beginnerAnnual'
WHERE name ILIKE '%beginner%' OR name ILIKE '%free%';

-- Update Pro plan
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = '$proMonthly',
  square_plan_id_annual = '$proAnnual'
WHERE name ILIKE '%pro%';

-- Update Premium plan
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = '$premiumMonthly',
  square_plan_id_annual = '$premiumAnnual'
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
"@
    
    $sqlScript | Out-File -FilePath "auto_update_plan_ids.sql" -Encoding UTF8
    
    Write-Host "SQL script saved to: auto_update_plan_ids.sql" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open Supabase SQL Editor" -ForegroundColor Gray
    Write-Host "2. Run the SQL from auto_update_plan_ids.sql" -ForegroundColor Gray
    Write-Host "3. Test your subscription in the app" -ForegroundColor Gray
    
} else {
    Write-Host "No plans were created. Check the errors above." -ForegroundColor Red
}

Write-Host ""







