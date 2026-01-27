# Check plan status and try to enable if disabled

Write-Host "Checking Square Plan Status..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl8j5QHd50eHUkODMkCyjYCITdm-qQMNuX5W-UxlzlbZrfMpd0LNC9qNtJss8"
$SQUARE_API_URL = "https://connect.squareup.com"

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# The plan that's failing
$planVariationId = "NBAZGSMGABC7IY3IKFEEZZKP"

Write-Host "Checking plan: $planVariationId" -ForegroundColor Yellow
Write-Host ""

try {
    # Fetch the plan variation details
    $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/object/$planVariationId" `
        -Method Get `
        -Headers $headers
    
    Write-Host "Plan Details:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Cyan
    Write-Host ""
    
    $plan = $response.object
    
    if ($plan) {
        Write-Host "Plan Name: $($plan.subscription_plan_variation_data.name)" -ForegroundColor Yellow
        Write-Host "Plan ID: $($plan.id)" -ForegroundColor Yellow
        
        # Check if there's a status field
        if ($plan.subscription_plan_variation_data.PSObject.Properties.Name -contains "state") {
            Write-Host "Status: $($plan.subscription_plan_variation_data.state)" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Note: Square plans might need to be enabled in the Dashboard." -ForegroundColor Gray
        Write-Host "Go to: https://squareup.com/dashboard/subscriptions/plans" -ForegroundColor Gray
        Write-Host "Find the plan and make sure it's enabled/active." -ForegroundColor Gray
    }
    
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Checking all your plan variations..." -ForegroundColor Cyan
Write-Host ""

# Check all your plan variation IDs
$allPlanIds = @(
    "NKISKO27CCF4ABTV2BMDBKHM",  # Beginner Monthly
    "VNELEISTJBP2R5A5SF6UW46I",  # Beginner Annual
    "SIPJFZUV5EMHYVONVP74QOL4",  # Pro Monthly
    "THFYEHH2MRGWNY47RS7ULF5X",  # Pro Annual
    "NBAZGSMGABC7IY3IKFEEZZKP",  # Premium Monthly
    "JBVRPTIVWEPI5SKT4WXBMK2S"   # Premium Annual
)

foreach ($planId in $allPlanIds) {
    Write-Host "Checking: $planId" -ForegroundColor Gray
    
    try {
        $planResponse = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/object/$planId" `
            -Method Get `
            -Headers $headers
        
        $planName = $planResponse.object.subscription_plan_variation_data.name
        Write-Host "  ✅ Found: $planName" -ForegroundColor Green
        
    } catch {
        Write-Host "  ❌ Error or not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SOLUTION:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to Square Dashboard:" -ForegroundColor White
Write-Host "   https://squareup.com/dashboard/subscriptions/plans" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. For EACH plan (Beginner, Pro, Premium - Monthly & Annual):" -ForegroundColor White
Write-Host "   - Click on the plan" -ForegroundColor Gray
Write-Host "   - Look for 'Status', 'Enabled', or 'Active' toggle" -ForegroundColor Gray
Write-Host "   - Make sure it's ENABLED/ACTIVE" -ForegroundColor Gray
Write-Host "   - Click Save" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test your subscription again" -ForegroundColor White
Write-Host ""







