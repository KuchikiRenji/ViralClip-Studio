# Test Square API Configuration (PowerShell version for Windows)
# Replace these with your actual values

$SQUARE_ACCESS_TOKEN = "EAAAlzaUnv3U8cgNDgBY4BvwxETDbIYWB80ZC4nDPQKw55mMdVWvd0xEZPw7B2Qr"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"  # or https://connect.squareup.com for production

Write-Host "Testing Square API Configuration..." -ForegroundColor Cyan
Write-Host "API URL: $SQUARE_API_URL" -ForegroundColor Yellow
Write-Host ""

# Test 1: List Locations
Write-Host "=== Test 1: List Your Locations ===" -ForegroundColor Green
$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Square-Version" = "2024-01-18"
    "Content-Type" = "application/json"
}

try {
    $locationsResponse = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/locations" -Headers $headers -Method Get
    $locationsResponse | ConvertTo-Json -Depth 10
    
    Write-Host ""
    Write-Host "Your Location IDs:" -ForegroundColor Yellow
    foreach ($location in $locationsResponse.locations) {
        Write-Host "  - Name: $($location.name)" -ForegroundColor White
        Write-Host "    ID: $($location.id)" -ForegroundColor Cyan
        Write-Host ""
    }
} catch {
    Write-Host "Error fetching locations: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test 2: List Your Subscription Plans ===" -ForegroundColor Green

try {
    $plansResponse = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/list?types=SUBSCRIPTION_PLAN" -Headers $headers -Method Get
    $plansResponse | ConvertTo-Json -Depth 10
    
    Write-Host ""
    Write-Host "Your Subscription Plan IDs:" -ForegroundColor Yellow
    foreach ($object in $plansResponse.objects) {
        if ($object.type -eq "SUBSCRIPTION_PLAN") {
            Write-Host "  - Name: $($object.subscription_plan_data.name)" -ForegroundColor White
            Write-Host "    ID: $($object.id)" -ForegroundColor Cyan
            Write-Host ""
        }
    }
} catch {
    Write-Host "Error fetching subscription plans: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ If you see locations and plans above, your Square credentials work!" -ForegroundColor Green
Write-Host "❌ If you see errors, check your Access Token and API URL" -ForegroundColor Red







