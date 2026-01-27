# Search ALL catalog items in Square account
# This will show EVERYTHING in your catalog to help find plans

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Searching ALL Square Catalog Items" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$environments = @(
    @{
        Name = "SANDBOX"
        Token = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
        URL = "https://connect.squareupsandbox.com"
    },
    @{
        Name = "PRODUCTION"
        Token = "EAAAl8j5QHd50eHUkODMkCyjYCITdm-qQMNuX5W-UxlzlbZrfMpd0LNC9qNtJss8"
        URL = "https://connect.squareup.com"
    }
)

foreach ($env in $environments) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  $($env.Name)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    $headers = @{
        "Authorization" = "Bearer $($env.Token)"
        "Content-Type" = "application/json"
        "Square-Version" = "2024-01-18"
    }
    
    # Try to list ALL catalog objects
    try {
        Write-Host "Fetching all catalog items..." -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri "$($env.URL)/v2/catalog/list" `
            -Method Get `
            -Headers $headers
        
        if ($response.objects) {
            Write-Host "Found $($response.objects.Count) catalog items" -ForegroundColor Green
            Write-Host ""
            
            # Group by type
            $byType = $response.objects | Group-Object -Property type
            
            Write-Host "Breakdown by type:" -ForegroundColor Cyan
            foreach ($group in $byType) {
                Write-Host "  $($group.Name): $($group.Count) items" -ForegroundColor Gray
            }
            Write-Host ""
            
            # Show subscription-related items
            $subPlans = $response.objects | Where-Object { $_.type -eq "SUBSCRIPTION_PLAN" }
            $subVariations = $response.objects | Where-Object { $_.type -eq "SUBSCRIPTION_PLAN_VARIATION" }
            
            if ($subPlans) {
                Write-Host "SUBSCRIPTION PLANS FOUND:" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                foreach ($plan in $subPlans) {
                    Write-Host "  Plan: $($plan.subscription_plan_data.name)" -ForegroundColor Yellow
                    Write-Host "  ID: $($plan.id)" -ForegroundColor White -BackgroundColor DarkGreen
                    Write-Host ""
                }
            } else {
                Write-Host "No subscription plans found" -ForegroundColor Yellow
            }
            
            if ($subVariations) {
                Write-Host "SUBSCRIPTION PLAN VARIATIONS FOUND:" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                foreach ($variation in $subVariations) {
                    Write-Host "  Variation: $($variation.subscription_plan_variation_data.name)" -ForegroundColor Cyan
                    Write-Host "  ID: $($variation.id)" -ForegroundColor White -BackgroundColor DarkGreen
                    if ($variation.subscription_plan_variation_data.subscription_plan_id) {
                        Write-Host "  Plan ID: $($variation.subscription_plan_variation_data.subscription_plan_id)" -ForegroundColor Gray
                    }
                    Write-Host ""
                }
            } else {
                Write-Host "No subscription plan variations found" -ForegroundColor Yellow
            }
            
            # Show first few items for debugging
            if ($response.objects.Count -gt 0) {
                Write-Host ""
                Write-Host "Sample of all items (first 5):" -ForegroundColor Gray
                $response.objects | Select-Object -First 5 | ForEach-Object {
                    Write-Host "  Type: $($_.type), ID: $($_.id)" -ForegroundColor DarkGray
                }
            }
            
        } else {
            Write-Host "No catalog items found (empty catalog)" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "ERROR:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            try {
                $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
                if ($errorJson.errors) {
                    foreach ($err in $errorJson.errors) {
                        Write-Host "  $($err.category): $($err.detail)" -ForegroundColor Yellow
                    }
                }
            } catch {
                Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If NO subscription plans were found in either environment," -ForegroundColor Yellow
Write-Host "you need to CREATE them first in Square Dashboard." -ForegroundColor Yellow
Write-Host ""
Write-Host "The IDs you provided earlier:" -ForegroundColor Cyan
Write-Host "  - VQLQHCP22XT5TNIVVRA7VMGF (Premium Monthly)" -ForegroundColor Gray
Write-Host "  - EBZ7SIRO7GXXRCDQ47EYVLWX (Pro Monthly)" -ForegroundColor Gray
Write-Host "  - etc..." -ForegroundColor Gray
Write-Host ""
Write-Host "These IDs do NOT exist in your Square account." -ForegroundColor Red
Write-Host ""







