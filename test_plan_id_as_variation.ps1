# Test if the plan ID works directly as a variation ID for subscriptions

Write-Host "Testing if plan ID can be used as variation ID..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
$SQUARE_LOCATION_ID = "LKXHQZGTCYFT4"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"
$PLAN_ID = "AGV7W3KDGE4RQ6EMCCU2KDGB"

Write-Host "Plan ID: $PLAN_ID" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create a test customer
Write-Host "Creating test customer..." -ForegroundColor Cyan

$customerBody = @{
    idempotency_key = [guid]::NewGuid().ToString()
    given_name = "Test"
    family_name = "User"
    email_address = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

try {
    $customerResponse = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/customers" `
        -Method Post `
        -Headers $headers `
        -Body $customerBody

    $customerId = $customerResponse.customer.id
    Write-Host "Customer created: $customerId" -ForegroundColor Green
    Write-Host ""
    
    # Step 2: Try to create subscription with the plan ID
    Write-Host "Creating subscription with plan ID..." -ForegroundColor Cyan
    
    $subscriptionBody = @{
        idempotency_key = [guid]::NewGuid().ToString()
        location_id = $SQUARE_LOCATION_ID
        customer_id = $customerId
        plan_variation_id = $PLAN_ID
    } | ConvertTo-Json
    
    try {
        $subscriptionResponse = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/subscriptions" `
            -Method Post `
            -Headers $headers `
            -Body $subscriptionBody

        Write-Host "================================================" -ForegroundColor Green
        Write-Host "SUCCESS! The plan ID WORKS as variation ID!" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Subscription ID: $($subscriptionResponse.subscription.id)" -ForegroundColor Cyan
        Write-Host "Plan Variation ID to use: $PLAN_ID" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "This means we can use the Plan ID directly!" -ForegroundColor Green
        
    } catch {
        Write-Host "ERROR creating subscription:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            Write-Host ""
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorJson.errors | ForEach-Object {
                Write-Host "  Detail: $($_.detail)" -ForegroundColor Yellow
            }
        }
    }
    
} catch {
    Write-Host "ERROR creating customer:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}







