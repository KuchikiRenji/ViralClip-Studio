#!/bin/bash

# Test Square API Configuration
# Replace these with your actual values

SQUARE_ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"
SQUARE_API_URL="https://connect.squareupsandbox.com"  # or https://connect.squareup.com for production

echo "Testing Square API Configuration..."
echo "API URL: $SQUARE_API_URL"
echo ""

# Test 1: List Locations
echo "=== Test 1: List Your Locations ==="
curl -s "$SQUARE_API_URL/v2/locations" \
  -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
  -H "Square-Version: 2024-01-18" | jq '.'
echo ""
echo ""

# Test 2: List Subscription Plans
echo "=== Test 2: List Your Subscription Plans ==="
curl -s "$SQUARE_API_URL/v2/catalog/list?types=SUBSCRIPTION_PLAN" \
  -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
  -H "Square-Version: 2024-01-18" | jq '.'
echo ""
echo ""

echo "✅ If you see locations and plans above, your Square credentials work!"
echo "❌ If you see errors, check your Access Token and API URL"







