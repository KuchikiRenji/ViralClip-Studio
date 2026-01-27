# PowerShell script to retrieve Square subscription plans
# This will show you all your plan variation IDs

# Set your Square credentials
$SQUARE_ACCESS_TOKEN = $env:SQUARE_ACCESS_TOKEN
$SQUARE_API_URL = if ($env:SQUARE_API_URL) { $env:SQUARE_API_URL } else { "https://connect.squareupsandbox.com" }

if (-not $SQUARE_ACCESS_TOKEN) {
    Write-Host "❌ Error: SQUARE_ACCESS_TOKEN environment variable is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set it with:" -ForegroundColor Yellow
    Write-Host '  $env:SQUARE_ACCESS_TOKEN = "your_access_token_here"' -ForegroundColor Cyan
    exit 1
}

Write-Host "🔍 Fetching Square subscription plans..." -ForegroundColor Cyan
Write-Host "API URL: $SQUARE_API_URL" -ForegroundColor Gray
Write-Host ""

# Fetch catalog items of type SUBSCRIPTION_PLAN
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
        Write-Host "✅ Found $($response.objects.Count) subscription plan(s):" -ForegroundColor Green
        Write-Host ""
        
        foreach ($obj in $response.objects) {
            $plan = $obj.subscription_plan_data
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
            Write-Host "Plan Name: " -NoNewline -ForegroundColor Yellow
            Write-Host $plan.name
            
            if ($plan.subscription_plan_variations) {
                foreach ($variation in $plan.subscription_plan_variations) {
                    Write-Host "  Variation: " -NoNewline -ForegroundColor Cyan
                    Write-Host $variation.name
                    Write-Host "  📋 Plan Variation ID: " -NoNewline -ForegroundColor Green
                    Write-Host $variation.id -ForegroundColor White
                    
                    if ($variation.subscription_plan_variation_data) {
                        $varData = $variation.subscription_plan_variation_data
                        Write-Host "     Cadence: " -NoNewline -ForegroundColor Gray
                        Write-Host $varData.phases[0].cadence
                        
                        if ($varData.phases[0].recurring_price_money) {
                            $price = $varData.phases[0].recurring_price_money
                            $amount = $price.amount / 100
                            Write-Host "     Price: " -NoNewline -ForegroundColor Gray
                            Write-Host "$amount $($price.currency)"
                        }
                    }
                    Write-Host ""
                }
            }
        }
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "📝 Copy the 'Plan Variation ID' values above" -ForegroundColor Yellow
        Write-Host "   and paste them into update_real_square_plan_ids.sql" -ForegroundColor Yellow
        
    } else {
        Write-Host "⚠️  No subscription plans found" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You need to create subscription plans in Square Dashboard:" -ForegroundColor Cyan
        Write-Host "  → Go to Subscriptions → Plans" -ForegroundColor Gray
        Write-Host "  → Create plans for: Beginner, Pro, Premium (Monthly & Annual)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error fetching plans:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host ($errorJson | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    }
}
