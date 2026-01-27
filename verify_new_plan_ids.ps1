# Verify the new plan IDs you provided

Write-Host "Verifying new Square plan IDs..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl8j5QHd50eHUkODMkCyjYCITdm-qQMNuX5W-UxlzlbZrfMpd0LNC9qNtJss8"
$SQUARE_API_URL = "https://connect.squareup.com"

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# The new IDs from your SQL update
$newIds = @{
    "Beginner Monthly" = "GQ3AONOKUH2RC4FGTOIHV4PT"
    "Beginner Annual" = "EIFW2427U5R3U7UI2PURVXMP"
    "Pro Monthly" = "N4PHZPR5BA2JJ4UPDXHJOOK5"
    "Pro Annual" = "RT5CH73VASTTQALZCIIJUP5F"
    "Premium Monthly" = "BZIFCZ4DH7VKFYKMNUFLCKXY"
    "Premium Annual" = "4AFX4VT3AHJ33C5IKR36GV5B"
}

Write-Host "Checking each ID..." -ForegroundColor Yellow
Write-Host ""

foreach ($planName in $newIds.Keys) {
    $id = $newIds[$planName]
    Write-Host "Checking: $planName" -ForegroundColor Cyan
    Write-Host "  ID: $id" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/object/$id" `
            -Method Get `
            -Headers $headers
        
        $obj = $response.object
        
        Write-Host "  Type: $($obj.type)" -ForegroundColor Yellow
        
        if ($obj.type -eq "SUBSCRIPTION_PLAN_VARIATION") {
            Write-Host "  ✅ CORRECT TYPE - This is a variation!" -ForegroundColor Green
            Write-Host "  Name: $($obj.subscription_plan_variation_data.name)" -ForegroundColor White
            
            if ($obj.subscription_plan_variation_data.phases) {
                $phase = $obj.subscription_plan_variation_data.phases[0]
                Write-Host "  Cadence: $($phase.cadence)" -ForegroundColor Gray
                
                if ($phase.pricing) {
                    Write-Host "  Pricing Type: $($phase.pricing.type)" -ForegroundColor $(if ($phase.pricing.type -eq "STATIC") { "Green" } else { "Red" })
                }
            }
        } elseif ($obj.type -eq "SUBSCRIPTION_PLAN") {
            Write-Host "  ❌ WRONG TYPE - This is a PLAN, not a VARIATION!" -ForegroundColor Red
            Write-Host "  You need the VARIATION ID, not the PLAN ID" -ForegroundColor Yellow
            
            # Try to find variations for this plan
            Write-Host "  Looking for variations..." -ForegroundColor Gray
            $listResponse = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/list" `
                -Method Post `
                -Headers $headers `
                -Body (@{ object_types = @("SUBSCRIPTION_PLAN_VARIATION") } | ConvertTo-Json)
            
            $variations = $listResponse.objects | Where-Object { 
                $_.subscription_plan_variation_data.subscription_plan_id -eq $id 
            }
            
            if ($variations) {
                Write-Host "  Found variations for this plan:" -ForegroundColor Green
                foreach ($var in $variations) {
                    Write-Host "    Variation ID: $($var.id)" -ForegroundColor White -BackgroundColor DarkGreen
                    Write-Host "    Name: $($var.subscription_plan_variation_data.name)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "  ❌ WRONG TYPE - This is a $($obj.type), not a variation!" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "  ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        
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
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If any IDs show as SUBSCRIPTION_PLAN (not VARIATION):" -ForegroundColor Yellow
Write-Host "  - You need to get the VARIATION ID from Square Dashboard" -ForegroundColor Gray
Write-Host "  - Click on the plan → Look for 'Variation ID' or 'ID' in the variation section" -ForegroundColor Gray
Write-Host ""

