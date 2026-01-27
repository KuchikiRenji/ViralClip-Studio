# Debug version - Create just one plan to see the response

Write-Host "Creating ONE test plan to debug..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

# Try to create just the Premium Monthly plan
$catalogBody = @{
    idempotency_key = [guid]::NewGuid().ToString()
    object = @{
        type = "SUBSCRIPTION_PLAN"
        id = "#premium-monthly"
        subscription_plan_data = @{
            name = "Premium Monthly"
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

Write-Host "Request body:" -ForegroundColor Yellow
Write-Host $catalogBody -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/object" `
        -Method Post `
        -Headers $headers `
        -Body $catalogBody
    
    Write-Host "SUCCESS! Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Error details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
}







