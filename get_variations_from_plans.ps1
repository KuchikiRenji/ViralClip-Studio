# Get variations by checking each plan directly

Write-Host "Getting variations from plans..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl8j5QHd50eHUkODMkCyjYCITdm-qQMNuX5W-UxlzlbZrfMpd0LNC9qNtJss8"
$SQUARE_API_URL = "https://connect.squareup.com"

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# Your PLAN IDs
$planIds = @{
    "Beginner Monthly" = "GQ3AONOKUH2RC4FGTOIHV4PT"
    "Beginner Annual" = "EIFW2427U5R3U7UI2PURVXMP"
    "Pro Monthly" = "N4PHZPR5BA2JJ4UPDXHJOOK5"
    "Pro Annual" = "RT5CH73VASTTQALZCIIJUP5F"
    "Premium Monthly" = "BZIFCZ4DH7VKFYKMNUFLCKXY"
    "Premium Annual" = "4AFX4VT3AHJ33C5IKR36GV5B"
}

$foundVariations = @()

foreach ($planName in $planIds.Keys) {
    $planId = $planIds[$planName]
    
    Write-Host "Checking: $planName" -ForegroundColor Yellow
    Write-Host "  Plan ID: $planId" -ForegroundColor Gray
    
    try {
        # Get the plan with related objects
        $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/object/$planId?include_related_objects=true" `
            -Method Get `
            -Headers $headers
        
        $plan = $response.object
        
        if ($plan.subscription_plan_data.subscription_plan_variations) {
            Write-Host "  ✅ Found variations:" -ForegroundColor Green
            
            foreach ($variation in $plan.subscription_plan_data.subscription_plan_variations) {
                $variationId = $variation.id
                $variationName = $variation.name
                
                Write-Host "    Variation: $variationName" -ForegroundColor Cyan
                Write-Host "    Variation ID: " -NoNewline -ForegroundColor Yellow
                Write-Host $variationId -ForegroundColor White -BackgroundColor DarkGreen
                Write-Host ""
                
                $foundVariations += [PSCustomObject]@{
                    PlanName = $planName
                    PlanId = $planId
                    VariationId = $variationId
                    VariationName = $variationName
                }
            }
        } else {
            Write-Host "  ❌ No variations found for this plan" -ForegroundColor Red
            Write-Host ""
        }
        
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
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
    
    if ($beginnerMonthly -and $beginnerAnnual -and $proMonthly -and $proAnnual -and $premiumMonthly -and $premiumAnnual) {
        $sqlScript = @"
-- Update with CORRECT VARIATION IDs
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
        Write-Host "✅ Copy this SQL and run it in Supabase!" -ForegroundColor Green
        
        $sqlScript | Out-File -FilePath "update_with_correct_variation_ids.sql" -Encoding UTF8
        Write-Host "SQL saved to: update_with_correct_variation_ids.sql" -ForegroundColor Green
        
    } else {
        Write-Host "⚠️  Not all variations found. Missing:" -ForegroundColor Yellow
        if (-not $beginnerMonthly) { Write-Host "  - Beginner Monthly" -ForegroundColor Red }
        if (-not $beginnerAnnual) { Write-Host "  - Beginner Annual" -ForegroundColor Red }
        if (-not $proMonthly) { Write-Host "  - Pro Monthly" -ForegroundColor Red }
        if (-not $proAnnual) { Write-Host "  - Pro Annual" -ForegroundColor Red }
        if (-not $premiumMonthly) { Write-Host "  - Premium Monthly" -ForegroundColor Red }
        if (-not $premiumAnnual) { Write-Host "  - Premium Annual" -ForegroundColor Red }
    }
} else {
    Write-Host "❌ No variations found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "This means your plans don't have variations created yet." -ForegroundColor Yellow
    Write-Host "You need to create variations in Square Dashboard." -ForegroundColor Yellow
}

Write-Host ""






