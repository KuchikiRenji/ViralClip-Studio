# Fetch Square subscription plan IDs

Write-Host "Fetching Square subscription plans..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

$body = @{
    object_types = @("SUBSCRIPTION_PLAN")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/list" `
        -Method Post `
        -Headers $headers `
        -Body $body

    if ($response.objects) {
        Write-Host "SUCCESS: Found $($response.objects.Count) subscription plan(s)" -ForegroundColor Green
        Write-Host ""
        Write-Host "================================================" -ForegroundColor DarkGray
        Wri
        foreach ($obj in $response.objects) {
            $plan = $obj.subscription_plan_data
            Write-Host "PLAN: $($plan.name)" -ForegroundColor Yellow
            Write-Host ""
            
            foreach ($variation in $plan.subscription_plan_variations) {
                Write-Host "  Variation: $($variation.name)" -ForegroundColor Cyan
                Write-Host "  ID: " -NoNewline -ForegroundColor Green
                Write-Host $variation.id -ForegroundColor White -BackgroundColor DarkGreen
                
                if ($variation.subscription_plan_variation_data.phases) {
                    $phase = $variation.subscription_plan_variation_data.phases[0]
                    Write-Host "  Cadence: $($phase.cadence)" -ForegroundColor Gray
                    
                    if ($phase.recurring_price_money) {
                        $price = $phase.recurring_price_money
                        $amount = $price.amount / 100
                        Write-Host "  Price: $amount $($price.currency)" -ForegroundColor Gray
                    }
                }
                Write-Host ""
            }
            Write-Host ""
        }
        
        Write-Host "================================================" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Compare the IDs above with what you used:" -ForegroundColor Yellow
        Write-Host "  Beginner Monthly: O226LIAVKLZLCB2KDF3GPOC4" -ForegroundColor Gray
        Write-Host "  Beginner Annual:  B5I37N43S7NP4HXVAWHERAM3" -ForegroundColor Gray
        Write-Host "  Pro Monthly:      EBZ7SIRO7GXXRCDQ47EYVLWX" -ForegroundColor Gray
        Write-Host "  Pro Annual:       BDE6LZ6M6TQOVWCUF6OVPAHW" -ForegroundColor Gray
        Write-Host "  Premium Monthly:  VQLQHCP22XT5TNIVVRA7VMGF" -ForegroundColor Gray
        Write-Host "  Premium Annual:   XV3KEGH3IBE7UIN7OPG565AB" -ForegroundColor Gray
        Write-Host ""
        
    } else {
        Write-Host "WARNING: No subscription plans found!" -ForegroundColor Yellow
        Write-Host "  You need to create plans in Square Dashboard first." -ForegroundColor Gray
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







