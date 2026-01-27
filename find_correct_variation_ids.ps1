# Find the correct VARIATION IDs for your new plans

Write-Host "Finding correct Variation IDs for your plans..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl8j5QHd50eHUkODMkCyjYCITdm-qQMNuX5W-UxlzlbZrfMpd0LNC9qNtJss8"
$SQUARE_API_URL = "https://connect.squareup.com"

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# Your PLAN IDs (not variations)
$planIds = @{
    "Beginner Monthly" = "GQ3AONOKUH2RC4FGTOIHV4PT"
    "Beginner Annual" = "EIFW2427U5R3U7UI2PURVXMP"
    "Pro Monthly" = "N4PHZPR5BA2JJ4UPDXHJOOK5"
    "Pro Annual" = "RT5CH73VASTTQALZCIIJUP5F"
    "Premium Monthly" = "BZIFCZ4DH7VKFYKMNUFLCKXY"
    "Premium Annual" = "4AFX4VT3AHJ33C5IKR36GV5B"
}

Write-Host "Fetching all subscription plan variations..." -ForegroundColor Yellow
Write-Host ""

# Get all variations
$body = @{
    object_types = @("SUBSCRIPTION_PLAN_VARIATION")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/list" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    if ($response.objects) {
        Write-Host "Found $($response.objects.Count) variation(s)" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Matching Variations to Your Plans" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        $foundVariations = @()
        
        foreach ($variation in $response.objects) {
            $planId = $variation.subscription_plan_variation_data.subscription_plan_id
            $variationName = $variation.subscription_plan_variation_data.name
            $variationId = $variation.id
            
            # Check if this variation belongs to one of your plans
            $matchingPlan = $planIds.GetEnumerator() | Where-Object { $_.Value -eq $planId } | Select-Object -First 1
            
            if ($matchingPlan) {
                $planName = $matchingPlan.Key
                Write-Host "✅ $planName" -ForegroundColor Green
                Write-Host "   Plan ID: $planId" -ForegroundColor Gray
                Write-Host "   Variation Name: $variationName" -ForegroundColor Gray
                Write-Host "   Variation ID: " -NoNewline -ForegroundColor Yellow
                Write-Host $variationId -ForegroundColor White -BackgroundColor DarkGreen
                
                # Get pricing info
                if ($variation.subscription_plan_variation_data.phases) {
                    $phase = $variation.subscription_plan_variation_data.phases[0]
                    Write-Host "   Cadence: $($phase.cadence)" -ForegroundColor Gray
                    
                    if ($phase.pricing) {
                        Write-Host "   Pricing Type: $($phase.pricing.type)" -ForegroundColor $(if ($phase.pricing.type -eq "STATIC") { "Green" } else { "Red" })
                    }
                }
                
                Write-Host ""
                
                $foundVariations += [PSCustomObject]@{
                    PlanName = $planName
                    PlanId = $planId
                    VariationId = $variationId
                    VariationName = $variationName
                }
            }
        }
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "SQL Update Script" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        if ($foundVariations.Count -gt 0) {
            $beginnerMonthly = ($foundVariations | Where-Object { $_.PlanName -eq "Beginner Monthly" }).VariationId
            $beginnerAnnual = ($foundVariations | Where-Object { $_.PlanName -eq "Beginner Annual" }).VariationId
            $proMonthly = ($foundVariations | Where-Object { $_.PlanName -eq "Pro Monthly" }).VariationId
            $proAnnual = ($foundVariations | Where-Object { $_.PlanName -eq "Pro Annual" }).VariationId
            $premiumMonthly = ($foundVariations | Where-Object { $_.PlanName -eq "Premium Monthly" }).VariationId
            $premiumAnnual = ($foundVariations | Where-Object { $_.PlanName -eq "Premium Annual" }).VariationId
            
            $sqlScript = @"
-- Update with CORRECT VARIATION IDs (not plan IDs)
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
            
            Write-Host $sqlScript -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Copy this SQL and run it in Supabase!" -ForegroundColor Yellow
            
            # Save to file
            $sqlScript | Out-File -FilePath "update_with_correct_variation_ids.sql" -Encoding UTF8
            Write-Host "SQL saved to: update_with_correct_variation_ids.sql" -ForegroundColor Green
            
        } else {
            Write-Host "⚠️  No variations found for your plans!" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "This means:" -ForegroundColor Red
            Write-Host "  - Your plans might not have variations created yet" -ForegroundColor Gray
            Write-Host "  - Or the variations are in a different location" -ForegroundColor Gray
            Write-Host ""
            Write-Host "All variations found:" -ForegroundColor Cyan
            foreach ($variation in $response.objects) {
                Write-Host "  - $($variation.subscription_plan_variation_data.name) (ID: $($variation.id))" -ForegroundColor Gray
            }
        }
        
    } else {
        Write-Host "No variations found in your Square account" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""






