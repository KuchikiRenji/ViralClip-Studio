# Test creating a subscription with your plan ID
# This simulates what your edge function does

Write-Host "Testing Square Subscription Creation..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
$SQUARE_LOCATION_ID = "LKXHQZGTCYFT4"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"

# Test with Premium Monthly plan ID
$PLAN_VARIATION_ID = "VQLQHCP22XT5TNIVVRA7VMGF"

Write-Host "Config:" -ForegroundColor Yellow
Write-Host "  API URL: $SQUARE_API_URL" -ForegroundColor Gray
Write-Host "  Location ID: $SQUARE_LOCATION_ID" -ForegroundColor Gray
Write-Host "  Plan Variation ID: $PLAN_VARIATION_ID" -ForegroundColor Gray
Write-Host ""

# Step 1: Create a test customer first
Write-Host "Step 1: Creating test customer..." -ForegroundColor Cyan

$customerBody = @{
    idempotency_key = [guid]::NewGuid().ToString()
    given_name = "Test"
    family_name = "Customer"
    email_address = "test@example.com"
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
    Write-Host "SUCCESS: Customer created with ID: $customerId" -ForegroundColor Green
    Write-Host ""
    
    # Step 2: Try to create subscription
    Write-Host "Step 2: Creating subscription..." -ForegroundColor Cyan
    
    $subscriptionBody = @{
        idempotency_key = [guid]::NewGuid().ToString()
        location_id = $SQUARE_LOCATION_ID
        customer_id = $customerId
        plan_variation_id = $PLAN_VARIATION_ID
    } | ConvertTo-Json
    
    Write-Host "Request body:" -ForegroundColor Gray
    Write-Host $subscriptionBody -ForegroundColor DarkGray
    Write-Host ""
    
    try {
        $subscriptionResponse = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/subscriptions" `
            -Method Post `
            -Headers $headers `
            -Body $subscriptionBody

        Write-Host "SUCCESS: Subscription created!" -ForegroundColor Green
        Write-Host "Subscription ID: $($subscriptionResponse.subscription.id)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your plan IDs are CORRECT!" -ForegroundColor Green
        
    } catch {
        Write-Host "ERROR: Failed to create subscription" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            Write-Host ""
            Write-Host "Error details from Square:" -ForegroundColor Yellow
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorJson.errors | ForEach-Object {
                Write-Host "  Category: $($_.category)" -ForegroundColor Red
                Write-Host "  Code: $($_.code)" -ForegroundColor Red
                Write-Host "  Detail: $($_.detail)" -ForegroundColor Red
                if ($_.field) {
                    Write-Host "  Field: $($_.field)" -ForegroundColor Red
                }
                Write-Host ""
            }
            
            Write-Host "DIAGNOSIS:" -ForegroundColor Yellow
            Write-Host "The plan variation ID '$PLAN_VARIATION_ID' is NOT valid in your Square account." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "SOLUTION:" -ForegroundColor Cyan
            Write-Host "1. Log into Square Dashboard: https://developer.squareup.com/apps" -ForegroundColor Gray
            Write-Host "2. Select your Sandbox app" -ForegroundColor Gray
            Write-Host "3. Go to Test Sandbox > Subscriptions > Plans" -ForegroundColor Gray
            Write-Host "4. Create subscription plans if they don't exist" -ForegroundColor Gray
            Write-Host "5. Copy the EXACT Plan Variation IDs from each plan" -ForegroundColor Gray
            Write-Host "6. Update your database with the correct IDs" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "ERROR: Failed to create customer" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
}







