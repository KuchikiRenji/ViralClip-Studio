# Test creating a subscription with PRODUCTION credentials
# WARNING: This will create a real customer in your production account
# But won't charge anything without payment

Write-Host "Testing PRODUCTION Square Subscription Creation..." -ForegroundColor Yellow
Write-Host "WARNING: This uses your PRODUCTION account" -ForegroundColor Red
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl8j5QHd50eHUkODMkCyjYCITdm-qQMNuX5W-UxlzlbZrfMpd0LNC9qNtJss8"
$SQUARE_LOCATION_ID = "LKXHQZGTCYFT4"
$SQUARE_API_URL = "https://connect.squareup.com"

# Test with Premium Monthly plan ID
$PLAN_VARIATION_ID = "VQLQHCP22XT5TNIVVRA7VMGF"

Write-Host "Config:" -ForegroundColor Yellow
Write-Host "  API URL: $SQUARE_API_URL (PRODUCTION)" -ForegroundColor Red
Write-Host "  Location ID: $SQUARE_LOCATION_ID" -ForegroundColor Gray
Write-Host "  Plan Variation ID: $PLAN_VARIATION_ID" -ForegroundColor Gray
Write-Host ""

# Step 1: Create a test customer first
Write-Host "Step 1: Creating test customer..." -ForegroundColor Cyan

$customerBody = @{
    idempotency_key = [guid]::NewGuid().ToString()
    given_name = "Test"
    family_name = "Customer"
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

        Write-Host "SUCCESS: Subscription created in PRODUCTION!" -ForegroundColor Green
        Write-Host "Subscription ID: $($subscriptionResponse.subscription.id)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your plan IDs are CORRECT for PRODUCTION!" -ForegroundColor Green
        Write-Host ""
        Write-Host "ACTION REQUIRED:" -ForegroundColor Yellow
        Write-Host "Update your Supabase environment variables to use PRODUCTION:" -ForegroundColor Yellow
        Write-Host '  SQUARE_API_URL = https://connect.squareup.com' -ForegroundColor Cyan
        Write-Host "  SQUARE_ACCESS_TOKEN = EAAAl8j5QHd50eHUkODMkCyjYCITdm-qQMNuX5W-UxlzlbZrfMpd0LNC9qNtJss8" -ForegroundColor Cyan
        
    } catch {
        Write-Host "ERROR: Failed to create subscription in PRODUCTION" -ForegroundColor Red
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
            
            Write-Host "The plan IDs don't exist in PRODUCTION either." -ForegroundColor Yellow
            Write-Host "You need to create subscription plans in your Square account first." -ForegroundColor Yellow
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







