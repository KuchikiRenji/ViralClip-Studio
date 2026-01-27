# Create a subscription plan WITH a variation properly

Write-Host "Creating subscription plan with variation..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# Create plan with explicit variation
$catalogBody = @{
    idempotency_key = [guid]::NewGuid().ToString()
    object = @{
        type = "SUBSCRIPTION_PLAN"
        id = "#premium-monthly-plan"
        subscription_plan_data = @{
            name = "Premium Monthly"
            subscription_plan_variations = @(
                @{
                    type = "SUBSCRIPTION_PLAN_VARIATION"
                    id = "#premium-monthly-variation"
                    subscription_plan_variation_data = @{
                        name = "Premium Monthly Subscription"
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
            )
        }
    }
} | ConvertTo-Json -Depth 15

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
    Write-Host "Full response:" -ForegroundColor Cyan
    $jsonResponse = $response | ConvertTo-Json -Depth 15
    Write-Host $jsonResponse -ForegroundColor Gray
    Write-Host ""
    
    # Extract the variation ID from id_mappings
    $variationMapping = $response.id_mappings | Where-Object { $_.client_object_id -eq "#premium-monthly-variation" }
    if ($variationMapping) {
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "VARIATION ID: $($variationMapping.object_id)" -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host "================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Use this ID in your database!" -ForegroundColor Yellow
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







