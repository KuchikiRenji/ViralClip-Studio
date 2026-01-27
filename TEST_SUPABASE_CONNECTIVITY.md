# Test Supabase Connectivity

## Quick Tests

### Test 1: Browser Console Test (Easiest)

**Open browser console (F12)** and paste this:

```javascript
// Test 1: Check if Supabase URL is reachable
async function testSupabaseConnectivity() {
  const supabaseUrl = 'https://edmmbwiifjmruhzvlgnh.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbW1id2lpZmptcnVoenZsZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDA2MTcsImV4cCI6MjA3OTc3NjYxN30.IDoFwQ-6MVQIJkgMC06Jip2P89pUFPjBQVzz3aQGS4E';
  
  console.log('🔍 Testing Supabase connectivity...');
  
  // Test 1: Basic connectivity
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseKey
      }
    });
    console.log('✅ Test 1 - Basic connectivity:', response.status, response.statusText);
  } catch (err) {
    console.error('❌ Test 1 - Basic connectivity failed:', err.message);
  }
  
  // Test 2: Auth endpoint
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey
      }
    });
    const data = await response.text();
    console.log('✅ Test 2 - Auth endpoint:', response.status, data);
  } catch (err) {
    console.error('❌ Test 2 - Auth endpoint failed:', err.message);
  }
  
  // Test 3: REST API endpoint
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/subscription_plans?select=count&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('✅ Test 3 - REST API:', response.status, data);
  } catch (err) {
    console.error('❌ Test 3 - REST API failed:', err.message);
  }
  
  // Test 4: Try login endpoint (without credentials)
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    const data = await response.json();
    console.log('✅ Test 4 - Auth login endpoint reachable:', response.status);
    console.log('   Response:', data);
  } catch (err) {
    console.error('❌ Test 4 - Auth login endpoint failed:', err.message);
  }
}

testSupabaseConnectivity();
```

**What to look for:**
- ✅ **Status 200/401/400** = Supabase is reachable (401/400 are expected for wrong credentials)
- ❌ **Status 0 / Failed to fetch** = Network/CORS issue
- ❌ **Timeout** = Network/firewall blocking

---

### Test 2: Network Tab Check

1. **Open DevTools** (F12)
2. Go to **Network** tab
3. **Clear** the network log
4. Try to **login** (or reload the page)
5. Look for requests to `*.supabase.co`

**What to check:**

| Request | Status | Meaning |
|---------|--------|---------|
| `auth/v1/token` | **200** | ✅ Login successful |
| `auth/v1/token` | **401** | ✅ Supabase reachable, wrong credentials |
| `auth/v1/token` | **400** | ✅ Supabase reachable, bad request |
| `auth/v1/token` | **0 / Failed** | ❌ Network/CORS issue |
| `auth/v1/token` | **Pending** | ❌ Request hanging (timeout) |
| No request | - | ❌ Request not being made |

**If you see CORS errors:**
- Check Supabase Dashboard → Settings → API → CORS settings
- Make sure your domain is allowed

---

### Test 3: PowerShell Test (Windows)

**Open PowerShell** and run:

```powershell
# Test 1: Basic connectivity
$supabaseUrl = "https://edmmbwiifjmruhzvlgnh.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbW1id2lpZmptcnVoenZsZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDA2MTcsImV4cCI6MjA3OTc3NjYxN30.IDoFwQ-6MVQIJkgMC06Jip2P89pUFPjBQVzz3aQGS4E"

Write-Host "Testing Supabase connectivity..." -ForegroundColor Cyan

# Test REST API
try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Method HEAD -Headers @{
        "apikey" = $supabaseKey
    } -ErrorAction Stop
    Write-Host "✅ REST API reachable: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ REST API failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Auth endpoint
try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/auth/v1/health" -Method GET -Headers @{
        "apikey" = $supabaseKey
    } -ErrorAction Stop
    Write-Host "✅ Auth endpoint reachable: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Auth endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

### Test 4: Check Supabase Dashboard

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Check:
   - ✅ **Project URL** matches your code
   - ✅ **anon/public key** matches your code
   - ✅ **Project status** is "Active"

---

### Test 5: Check Environment Variables

**In your code**, check if variables are set:

**Browser Console:**
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
```

**Or check your `.env` file:**
```env
VITE_SUPABASE_URL=https://edmmbwiifjmruhzvlgnh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Common Issues and Fixes

### Issue 1: CORS Error

**Symptom**: `Access to fetch at '...' has been blocked by CORS policy`

**Fix**:
1. Supabase Dashboard → Settings → API
2. Under **"CORS"**, add your domain:
   - `http://localhost:3000` (for local dev)
   - `https://zitro.ai` (for production)
3. Save

### Issue 2: Network Error / Failed to Fetch

**Symptom**: `Failed to fetch` or `NetworkError`

**Possible causes**:
- Internet connection issue
- Firewall blocking Supabase
- VPN blocking requests
- Browser extension blocking

**Fix**:
- Check internet connection
- Try different network
- Disable VPN
- Try incognito mode (disables extensions)

### Issue 3: Timeout

**Symptom**: Request hangs, never completes

**Possible causes**:
- Network latency
- Firewall blocking
- Supabase server issue

**Fix**:
- Check Supabase status: https://status.supabase.com
- Check network connectivity
- Check firewall settings

### Issue 4: 403 Forbidden

**Symptom**: `403 (Forbidden)` on requests

**Possible causes**:
- RLS policies blocking
- Invalid API key
- Wrong project URL

**Fix**:
- Check API key is correct
- Check RLS policies
- Verify project URL

---

## Quick Diagnostic Script

**Save this as `test-supabase.html`** and open in browser:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Supabase Connectivity Test</title>
</head>
<body>
    <h1>Supabase Connectivity Test</h1>
    <div id="results"></div>
    <script>
        const supabaseUrl = 'https://edmmbwiifjmruhzvlgnh.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbW1id2lpZmptcnVoenZsZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDA2MTcsImV4cCI6MjA3OTc3NjYxN30.IDoFwQ-6MVQIJkgMC06Jip2P89pUFPjBQVzz3aQGS4E';
        
        async function runTests() {
            const results = document.getElementById('results');
            results.innerHTML = '<p>Running tests...</p>';
            
            const tests = [
                { name: 'REST API', url: `${supabaseUrl}/rest/v1/`, method: 'HEAD' },
                { name: 'Auth Health', url: `${supabaseUrl}/auth/v1/health`, method: 'GET' },
                { name: 'Subscription Plans', url: `${supabaseUrl}/rest/v1/subscription_plans?select=count&limit=1`, method: 'GET' }
            ];
            
            for (const test of tests) {
                try {
                    const response = await fetch(test.url, {
                        method: test.method,
                        headers: { 'apikey': supabaseKey }
                    });
                    results.innerHTML += `<p style="color: green;">✅ ${test.name}: ${response.status} ${response.statusText}</p>`;
                } catch (err) {
                    results.innerHTML += `<p style="color: red;">❌ ${test.name}: ${err.message}</p>`;
                }
            }
        }
        
        runTests();
    </script>
</body>
</html>
```

---

## Expected Results

**If Supabase is reachable:**
- ✅ All tests return status codes (200, 401, 400, etc.)
- ✅ No "Failed to fetch" errors
- ✅ Network tab shows requests completing

**If Supabase is NOT reachable:**
- ❌ "Failed to fetch" errors
- ❌ Status 0 or no response
- ❌ Network tab shows failed/pending requests

---

## Next Steps

1. **Run Test 1** (Browser Console) - Easiest and fastest
2. **Check Network Tab** - See actual requests
3. **If errors found**, check the "Common Issues" section above
4. **Share results** for further help






