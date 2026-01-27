# Create Square subscription plans with STATIC pricing (not RELATIVE)
# This will create plans that work with the subscription API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Creating Square Plans with STATIC Pricing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Using PRODUCTION credentials (where your current plans are)
$SQUARE_ACCESS_TOKEN = "EAAAl8j5QHd50eHUkODMkCyjYCITdm-qQMNuX5W-UxlzlbZrfMpd0LNC9qNtJss8"
$SQUARE_API_URL = "https://connect.squareup.com"

Write-Host "Environment: PRODUCTION" -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# Define plans with STATIC pricing
$plans = @(
    @{
        PlanName = "Zitro Beginner"
        VariationName = "Monthly"
        Cadence = "MONTHLY"
        Price = 3499
    },
    @{
        PlanName = "Zitro Beginner"
        VariationName = "Annual"
        Cadence = "ANNUAL"
        Price = 29988
    },
    @{
        PlanName = "Zitro Pro"
        VariationName = "Monthly"
        Cadence = "MONTHLY"
        Price = 6999
    },
    @{
        PlanName = "Zitro Pro"
        VariationName = "Annual"
        Cadence = "ANNUAL"
        Price = 59988
    },
    @{
        PlanName = "Zitro Premium"
        VariationName = "Monthly"
        Cadence = "MONTHLY"
        Price = 12999
    },
    @{
        PlanName = "Zitro Premium"
        VariationName = "Annual"
        Cadence = "ANNUAL"
        Price = 107988
    }
)

$createdVariations = @()

foreach ($plan in $plans) {
    Write-Host "Creating: $($plan.PlanName) - $($plan.VariationName)..." -ForegroundColor Cyan
    
    $idKey = "$($plan.PlanName)-$($plan.VariationName)".Replace(" ", "-")
    
    # Create plan with variation using STATIC pricing
    $catalogBody = @{
        idempotency_key = [guid]::NewGuid().ToString()
        object = @{
            type = "SUBSCRIPTION_PLAN_VARIATION"
            id = "#$idKey"
            subscription_plan_variation_data = @{
                name = "$($plan.PlanName) - $($plan.VariationName)"
                phases = @(
                    @{
                        cadence = $plan.Cadence
                        pricing_type = "STATIC"  # KEY: Use STATIC pricing
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
            $variationId = $response.catalog_object.id
            
            Write-Host "  SUCCESS!" -ForegroundColor Green
            Write-Host "  Variation ID: " -NoNewline -ForegroundColor Green
            Write-Host $variationId -ForegroundColor White -BackgroundColor DarkGreen
            Write-Host ""
            
            $createdVariations += [PSCustomObject]@{
                PlanName = $plan.PlanName
                VariationName = $plan.VariationName
                VariationId = $variationId
                Cadence = $plan.Cadence
            }
        }
        
    } catch {
        Write-Host "  ERROR:" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            try {
                $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
                if ($errorJson.errors) {
                    foreach ($err in $errorJson.errors) {
                        Write-Host "  - $($err.detail)" -ForegroundColor Yellow
                    }
                }
            } catch {
                Write-Host "  $($_.ErrorDetails.Message)" -ForegroundColor Yellow
            }
        }
        Write-Host ""
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($createdVariations.Count -gt 0) {
    Write-Host "Successfully created $($createdVariations.Count) plan variation(s)!" -ForegroundColor Green
    Write-Host ""
    
    # Group by plan
    $beginnerMonthly = ($createdVariations | Where-Object { $_.PlanName -like "*Beginner*" -and $_.Cadence -eq "MONTHLY" }).VariationId
    $beginnerAnnual = ($createdVariations | Where-Object { $_.PlanName -like "*Beginner*" -and $_.Cadence -eq "ANNUAL" }).VariationId
    $proMonthly = ($createdVariations | Where-Object { $_.PlanName -like "*Pro*" -and $_.Cadence -eq "MONTHLY" }).VariationId
    $proAnnual = ($createdVariations | Where-Object { $_.PlanName -like "*Pro*" -and $_.Cadence -eq "ANNUAL" }).VariationId
    $premiumMonthly = ($createdVariations | Where-Object { $_.PlanName -like "*Premium*" -and $_.Cadence -eq "MONTHLY" }).VariationId
    $premiumAnnual = ($createdVariations | Where-Object { $_.PlanName -like "*Premium*" -and $_.Cadence -eq "ANNUAL" }).VariationId
    
    Write-Host "Variation IDs for your database:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Beginner Monthly: $beginnerMonthly" -ForegroundColor Cyan
    Write-Host "Beginner Annual:  $beginnerAnnual" -ForegroundColor Cyan
    Write-Host "Pro Monthly:      $proMonthly" -ForegroundColor Cyan
    Write-Host "Pro Annual:       $proAnnual" -ForegroundColor Cyan
    Write-Host "Premium Monthly:  $premiumMonthly" -ForegroundColor Cyan
    Write-Host "Premium Annual:   $premiumAnnual" -ForegroundColor Cyan
    Write-Host ""
    
    # Generate SQL update script
    $sqlScript = @"
-- Update subscription plans with NEW STATIC pricing variation IDs
-- Run this in Supabase SQL Editor

UPDATE subscription_plans 
SET 
  square_plan_id_monthly = '$beginnerMonthly',
  square_plan_id_annual = '$beginnerAnnual'
WHERE name ILIKE '%beginner%';

UPDATE subscription_plans 
SET 
  square_plan_id_monthly = '$proMonthly',
  square_plan_id_annual = '$proAnnual'
WHERE name ILIKE '%pro%';

UPDATE subscription_plans 
SET 
  square_plan_id_monthly = '$premiumMonthly',
  square_plan_id_annual = '$premiumAnnual'
WHERE name ILIKE '%premium%';

-- Verify
SELECT name, square_plan_id_monthly, square_plan_id_annual 
FROM subscription_plans 
WHERE is_active = true;
"@
    
    $sqlScript | Out-File -FilePath "update_with_static_pricing_ids.sql" -Encoding UTF8
    
    Write-Host "SQL script saved: update_with_static_pricing_ids.sql" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run the SQL in Supabase to update your database" -ForegroundColor Gray
    Write-Host "2. Make sure environment variables are set to PRODUCTION" -ForegroundColor Gray
    Write-Host "3. Redeploy edge function" -ForegroundColor Gray
    Write-Host "4. Test subscription - it will work!" -ForegroundColor Gray
    
} else {
    Write-Host "No plans were created. Check errors above." -ForegroundColor Red
}

Write-Host ""







