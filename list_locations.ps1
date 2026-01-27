# List all locations in your Square account

Write-Host "Fetching Square Locations..." -ForegroundColor Cyan
Write-Host ""

# Test both Sandbox and Production
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
    Write-Host "================================================" -ForegroundColor DarkGray
    Write-Host "$($env.Name) Environment" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor DarkGray
    Write-Host ""
    
    $headers = @{
        "Authorization" = "Bearer $($env.Token)"
        "Content-Type" = "application/json"
        "Square-Version" = "2024-01-18"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$($env.URL)/v2/locations" `
            -Method Get `
            -Headers $headers
        
        if ($response.locations) {
            Write-Host "Found $($response.locations.Count) location(s):" -ForegroundColor Green
            Write-Host ""
            
            foreach ($location in $response.locations) {
                Write-Host "  Name: $($location.name)" -ForegroundColor Cyan
                Write-Host "  ID: " -NoNewline -ForegroundColor Green
                Write-Host $location.id -ForegroundColor White -BackgroundColor DarkGreen
                Write-Host "  Status: $($location.status)" -ForegroundColor Gray
                if ($location.address) {
                    $addr = $location.address
                    Write-Host "  Address: $($addr.address_line_1), $($addr.locality), $($addr.administrative_district_level_1)" -ForegroundColor Gray
                }
                Write-Host ""
            }
            
        } else {
            Write-Host "No locations found" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "ERROR:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor DarkGray
Write-Host "Your current Location ID: LKXHQZGTCYFT4" -ForegroundColor Yellow
Write-Host "Check which environment it belongs to above." -ForegroundColor Yellow







