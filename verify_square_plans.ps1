# PowerShell script to verify Square subscription plans
# This will fetch all your actual plans from Square and show their IDs

Write-Host "🔍 Square Plan Verification Tool" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Use Sandbox credentials
$SQUARE_ACCESS_TOKEN = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"

Write-Host "Using Sandbox Environment" -ForegroundColor Yellow
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

Write-Host "📡 Fetching subscription plans from Square..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/list" `
        -Method Post `
        -Headers $headers `
        -Body $body

    if ($response.objects -and $response.objects.Count -gt 0) {
        Write-Host "✅ Found $($response.objects.Count) subscription plan(s)" -ForegroundColor Green
        Write-Host ""
        
        $allVariations = @()
        
        foreach ($obj in $response.objects) {
            $plan = $obj.subscription_plan_data
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
            Write-Host "📦 Plan: " -NoNewline -ForegroundColor Yellow
            Write-Host $plan.name -ForegroundColor White
            Write-Host "   Object ID: " -NoNewline -ForegroundColor Gray
            Write-Host $obj.id
            
            if ($plan.subscription_plan_variations) {
                Write-Host ""
                foreach ($variation in $plan.subscription_plan_variations) {
                    Write-Host "   📋 Variation: " -NoNewline -ForegroundColor Cyan
                    Write-Host $variation.name -ForegroundColor White
                    Write-Host "      ID: " -NoNewline -ForegroundColor Green
                    Write-Host $variation.id -ForegroundColor White -BackgroundColor DarkGreen
                    
                    if ($variation.subscription_plan_variation_data) {
                        $varData = $variation.subscription_plan_variation_data
                        
                        if ($varData.phases -and $varData.phases.Count -gt 0) {
                            $phase = $varData.phases[0]
                            Write-Host "      Cadence: " -NoNewline -ForegroundColor Gray
                            Write-Host $phase.cadence
                            
                            if ($phase.recurring_price_money) {
                                $price = $phase.recurring_price_money
                                $amount = $price.amount / 100
                                Write-Host "      Price: " -NoNewline -ForegroundColor Gray
                                Write-Host "$amount $($price.currency)"
                            }
                        }
                    }
                    
                    # Store for summary
                    $allVariations += [PSCustomObject]@{
                        PlanName = $plan.name
                        VariationName = $variation.name
                        VariationId = $variation.id
                    }
                    
                    Write-Host ""
                }
            }
        }
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "📊 SUMMARY - Copy these IDs to update your database:" -ForegroundColor Yellow
        Write-Host ""
        
        foreach ($var in $allVariations) {
            $label = "$($var.PlanName) - $($var.VariationName)"
            Write-Host "   $label" -ForegroundColor Cyan
            Write-Host "   ID: " -NoNewline -ForegroundColor Gray
            Write-Host $var.VariationId -ForegroundColor White
            Write-Host ""
        }
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
        Write-Host "   Compare the IDs above with what you provided earlier." -ForegroundColor Yellow
        Write-Host "   The IDs must match EXACTLY (case-sensitive)." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📝 Your current plan IDs:" -ForegroundColor Cyan
        Write-Host "   Beginner Monthly: O226LIAVKLZLCB2KDF3GPOC4" -ForegroundColor Gray
        Write-Host "   Beginner Annual:  B5I37N43S7NP4HXVAWHERAM3" -ForegroundColor Gray
        Write-Host "   Pro Monthly:      EBZ7SIRO7GXXRCDQ47EYVLWX" -ForegroundColor Gray
        Write-Host "   Pro Annual:       BDE6LZ6M6TQOVWCUF6OVPAHW" -ForegroundColor Gray
        Write-Host "   Premium Monthly:  VQLQHCP22XT5TNIVVRA7VMGF" -ForegroundColor Gray
        Write-Host "   Premium Annual:   XV3KEGH3IBE7UIN7OPG565AB" -ForegroundColor Gray
        Write-Host ""
        
    } else {
        Write-Host "⚠️  No subscription plans found in your Square account!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "This means you need to create subscription plans in Square Dashboard:" -ForegroundColor Cyan
        Write-Host "  1. Go to https://developer.squareup.com/apps" -ForegroundColor Gray
        Write-Host "  2. Select your sandbox app" -ForegroundColor Gray
        Write-Host "  3. Go to Subscriptions → Plans" -ForegroundColor Gray
        Write-Host "  4. Create plans for: Beginner, Pro, Premium (Monthly & Annual)" -ForegroundColor Gray
        Write-Host ""
    }
    
} catch {
    Write-Host "❌ Error fetching plans from Square:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Error Details:" -ForegroundColor Yellow
            Write-Host ($errorJson | ConvertTo-Json -Depth 10) -ForegroundColor Gray
            Write-Host ""
            
            if ($errorJson.errors) {
                foreach ($err in $errorJson.errors) {
                    Write-Host "  Category: $($err.category)" -ForegroundColor Red
                    Write-Host "  Code: $($err.code)" -ForegroundColor Red
                    Write-Host "  Detail: $($err.detail)" -ForegroundColor Red
                    Write-Host ""
                }
            }
        } catch {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
        }
    }
    
    Write-Host "💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  - Verify your access token is correct" -ForegroundColor Gray
    Write-Host "  - Make sure you're using the sandbox token with sandbox URL" -ForegroundColor Gray
    Write-Host "  - Check that your token has 'SUBSCRIPTIONS_READ' permission" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

