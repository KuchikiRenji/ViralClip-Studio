# Supabase Connectivity Test Script
# Run this in PowerShell to test Supabase connectivity

$supabaseUrl = "https://edmmbwiifjmruhzvlgnh.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbW1id2lpZmptcnVoenZsZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDA2MTcsImV4cCI6MjA3OTc3NjYxN30.IDoFwQ-6MVQIJkgMC06Jip2P89pUFPjBQVzz3aQGS4E"

Write-Host "`n🔍 Testing Supabase Connectivity..." -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Test 1: REST API Basic Connectivity
Write-Host "`n[1/4] Testing REST API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Method HEAD -Headers @{
        "apikey" = $supabaseKey
    } -ErrorAction Stop -TimeoutSec 10
    Write-Host "   ✅ REST API reachable: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ REST API failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

# Test 2: Auth Health Endpoint
Write-Host "`n[2/4] Testing Auth Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/auth/v1/health" -Method GET -Headers @{
        "apikey" = $supabaseKey
    } -ErrorAction Stop -TimeoutSec 10
    Write-Host "   ✅ Auth endpoint reachable: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Auth endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

# Test 3: Subscription Plans Query
Write-Host "`n[3/4] Testing Subscription Plans Query..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/subscription_plans?select=count&limit=1" -Method GET -Headers @{
        "apikey" = $supabaseKey
        "Content-Type" = "application/json"
    } -ErrorAction Stop -TimeoutSec 10
    Write-Host "   ✅ Subscription Plans query successful: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   Data: $($data | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Subscription Plans query failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        try {
            $errorBody = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorBody)
            $errorContent = $reader.ReadToEnd()
            Write-Host "   Error details: $errorContent" -ForegroundColor Yellow
        } catch {
            # Ignore error reading response
        }
    }
}

# Test 4: Auth Token Endpoint (without credentials - should return 400)
Write-Host "`n[4/4] Testing Auth Token Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$supabaseUrl/auth/v1/token?grant_type=password" -Method POST -Headers @{
        "apikey" = $supabaseKey
        "Content-Type" = "application/json"
    } -Body $body -ErrorAction Stop -TimeoutSec 10
    Write-Host "   ✅ Auth token endpoint reachable: $($response.StatusCode)" -ForegroundColor Green
} catch {
    # 400/401 are expected for wrong credentials
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400 -or $statusCode -eq 401) {
            Write-Host "   ✅ Auth token endpoint reachable: $statusCode (expected for wrong credentials)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Auth token endpoint failed: $statusCode" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Auth token endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + ("=" * 50) -ForegroundColor Gray
Write-Host "✅ Tests completed!" -ForegroundColor Cyan
Write-Host "`nIf all tests show ✅, Supabase is reachable." -ForegroundColor Green
Write-Host "If any test shows ❌, check the error message above." -ForegroundColor Yellow






