# Try to create variations for your existing plans via API

Write-Host "Creating variations for your plans..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl8j5QHd50eHUkODMkCyjYCITdm-qQMNuX5W-UxlzlbZrfMpd0LNC9qNtJss8"
$SQUARE_API_URL = "https://connect.squareup.com"

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# Plan IDs and their configurations
$plans = @(
    @{
        PlanId = "GQ3AONOKUH2RC4FGTOIHV4PT"
        PlanName = "Beginner Monthly"
        VariationName = "Monthly"
        Cadence = "MONTHLY"
        Price = 3499
    },
    @{
        PlanId = "EIFW2427U5R3U7UI2PURVXMP"
        PlanName = "Beginner Annual"
        VariationName = "Annual"
        Cadence = "ANNUAL"
        Price = 29988
    },
    @{
        PlanId = "N4PHZPR5BA2JJ4UPDXHJOOK5"
        PlanName = "Pro Monthly"
        VariationName = "Monthly"
        Cadence = "MONTHLY"
        Price = 6999
    },
    @{
        PlanId = "RT5CH73VASTTQALZCIIJUP5F"
        PlanName = "Pro Annual"
        VariationName = "Annual"
        Cadence = "ANNUAL"
        Price = 59988
    },
    @{
        PlanId = "BZIFCZ4DH7VKFYKMNUFLCKXY"
        PlanName = "Premium Monthly"
        VariationName = "Monthly"
        Cadence = "MONTHLY"
        Price = 12999
    },
    @{
        PlanId = "4AFX4VT3AHJ33C5IKR36GV5B"
        PlanName = "Premium Annual"
        VariationName = "Annual"
        Cadence = "ANNUAL"
        Price = 107988
    }
)

$createdVariations = @()

foreach ($plan in $plans) {
    Write-Host "Creating variation for: $($plan.PlanName)..." -ForegroundColor Yellow
    
    $variationBody = @{
        idempotency_key = [guid]::NewGuid().ToString()
        object = @{
            type = "SUBSCRIPTION_PLAN_VARIATION"
            id = "#var-$([guid]::NewGuid().ToString())"
            subscription_plan_variation_data = @{
                name = $plan.VariationName
                subscription_plan_id = $plan.PlanId
                phases = @(
                    @{
                        cadence = $plan.Cadence
                        pricing = @{
                            type = "STATIC"
                            price_money = @{
                                amount = $plan.Price
                                currency = "CAD"
                            }
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
            -Body $variationBody
        
        if ($response.catalog_object) {
            $variationId = $response.catalog_object.id
            Write-Host "  ✅ SUCCESS!" -ForegroundColor Green
            Write-Host "  Variation ID: " -NoNewline -ForegroundColor Yellow
            Write-Host $variationId -ForegroundColor White -BackgroundColor DarkGreen
            Write-Host ""
            
            $createdVariations += [PSCustomObject]@{
                PlanName = $plan.PlanName
                PlanId = $plan.PlanId
                VariationId = $variationId
            }
        }
        
    } catch {
        Write-Host "  ❌ ERROR:" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            try {
                $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
                if ($errorJson.errors) {
                    foreach ($err in $errorJson.errors) {
                        Write-Host "    $($err.detail)" -ForegroundColor Yellow
                    }
                }
            } catch {
                Write-Host "    $($_.ErrorDetails.Message)" -ForegroundColor Yellow
            }
        }
        Write-Host ""
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($createdVariations.Count -gt 0) {
    Write-Host "✅ Created $($createdVariations.Count) variation(s)!" -ForegroundColor Green
    Write-Host ""
    
    $beginnerMonthly = ($createdVariations | Where-Object { $_.PlanName -eq "Beginner Monthly" }).VariationId
    $beginnerAnnual = ($createdVariations | Where-Object { $_.PlanName -eq "Beginner Annual" }).VariationId
    $proMonthly = ($createdVariations | Where-Object { $_.PlanName -eq "Pro Monthly" }).VariationId
    $proAnnual = ($createdVariations | Where-Object { $_.PlanName -eq "Pro Annual" }).VariationId
    $premiumMonthly = ($createdVariations | Where-Object { $_.PlanName -eq "Premium Monthly" }).VariationId
    $premiumAnnual = ($createdVariations | Where-Object { $_.PlanName -eq "Premium Annual" }).VariationId
    
    if ($beginnerMonthly -and $beginnerAnnual -and $proMonthly -and $proAnnual -and $premiumMonthly -and $premiumAnnual) {
        $sqlScript = @"
-- Update with NEWLY CREATED Variation IDs
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
        
        Write-Host "SQL Update Script:" -ForegroundColor Yellow
        Write-Host $sqlScript -ForegroundColor Cyan
        Write-Host ""
        
        $sqlScript | Out-File -FilePath "update_with_new_variation_ids.sql" -Encoding UTF8
        Write-Host "✅ SQL saved to: update_with_new_variation_ids.sql" -ForegroundColor Green
        Write-Host ""
        Write-Host "Run this SQL in Supabase, then test your subscription!" -ForegroundColor Yellow
        
    } else {
        Write-Host "⚠️  Not all variations were created successfully" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Failed to create variations via API" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to create variations manually in Square Dashboard:" -ForegroundColor Yellow
    Write-Host "  1. Go to https://squareup.com/dashboard/subscriptions/plans" -ForegroundColor Gray
    Write-Host "  2. Click on each plan" -ForegroundColor Gray
    Write-Host "  3. Create/add a variation" -ForegroundColor Gray
    Write-Host "  4. Copy the Variation ID (not Plan ID)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OR switch to Stripe - I can set it up for you in 30 minutes!" -ForegroundColor Cyan
}

Write-Host ""






