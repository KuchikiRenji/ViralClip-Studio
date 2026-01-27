# Create subscription plan variation as a separate object

Write-Host "Creating subscription plan variation..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"
$PLAN_ID = "AGV7W3KDGE4RQ6EMCCU2KDGB"  # The plan we created earlier

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# Create variation as a separate object
$catalogBody = @{
    idempotency_key = [guid]::NewGuid().ToString()
    object = @{
        type = "SUBSCRIPTION_PLAN_VARIATION"
        id = "#premium-monthly-var"
        subscription_plan_variation_data = @{
            name = "Premium Monthly"
            subscription_plan_id = $PLAN_ID
            phases = @(
                @{
                    cadence = "MONTHLY"
                    recurring_price_money = @{
                        amount = 12999
                        currency = "CAD"
                    }
                }
            )
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "Request:" -ForegroundColor Yellow
Write-Host $catalogBody -ForegroundColor DarkGray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/object" `
        -Method Post `
        -Headers $headers `
        -Body $catalogBody
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    Write-Host ""
    
    $variationId = $response.catalog_object.id
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "VARIATION ID: $variationId" -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host "================================================" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
}







