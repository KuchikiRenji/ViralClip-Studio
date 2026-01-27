# Get details of the created plan to find the variation ID

Write-Host "Fetching plan details..." -ForegroundColor Cyan
Write-Host ""

$SQUARE_ACCESS_TOKEN = "EAAAl0YVc3ns8OvXZKHsRlE1yo35pYZnzvavsRC6JOxQ0nvKjwi49cKOY5sdkOWX"
$SQUARE_API_URL = "https://connect.squareupsandbox.com"
$PLAN_ID = "AGV7W3KDGE4RQ6EMCCU2KDGB"

$headers = @{
    "Authorization" = "Bearer $SQUARE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
    "Square-Version" = "2024-01-18"
}

try {
    $response = Invoke-RestMethod -Uri "$SQUARE_API_URL/v2/catalog/object/$PLAN_ID?include_related_objects=true" `
        -Method Get `
        -Headers $headers
    
    Write-Host "Plan details:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 15) -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}







