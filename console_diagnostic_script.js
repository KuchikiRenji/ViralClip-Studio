// ============================================
// DIAGNOSTIC SCRIPT FOR PRICING PAGE
// ============================================
// Copy and paste this ENTIRE script into the browser console
// on https://zitro.ai/pricing
// ============================================

(async function diagnosePricingIssue() {
  console.log('🔍 Starting diagnostic...');
  console.log('==========================================');
  
  // Step 1: Check Environment Variables
  console.log('\n1️⃣ Checking Environment Variables:');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('   VITE_SUPABASE_URL:', supabaseUrl || '❌ NOT SET');
  console.log('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ SET' : '❌ NOT SET');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('   ⚠️ Environment variables missing! This is likely the issue.');
    console.log('   Fix: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment platform.');
    return;
  }
  
  // Step 2: Test Network Connectivity
  console.log('\n2️⃣ Testing Network Connectivity:');
  try {
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseKey
      }
    });
    console.log('   ✅ Can reach Supabase:', testResponse.status);
  } catch (err) {
    console.error('   ❌ Cannot reach Supabase:', err.message);
    console.error('   This could be:');
    console.error('   - Network/firewall blocking');
    console.error('   - CORS issue');
    console.error('   - Supabase down');
    return;
  }
  
  // Step 3: Test Direct API Call
  console.log('\n3️⃣ Testing Direct API Call:');
  try {
    const apiUrl = `${supabaseUrl}/rest/v1/subscription_plans?is_active=eq.true&select=*&order=price_monthly.asc`;
    console.log('   Request URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Response status:', response.status);
    console.log('   Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ Error response:', errorText);
      
      if (response.status === 401 || response.status === 403) {
        console.error('   ⚠️ Authentication/Authorization issue - likely RLS policy blocking');
        console.log('   Fix: Run fix_subscription_plans_rls.sql in Supabase SQL Editor');
      } else if (response.status === 0) {
        console.error('   ⚠️ CORS issue - request blocked');
        console.log('   Fix: Add https://zitro.ai to Supabase CORS settings');
      }
      return;
    }
    
    const data = await response.json();
    console.log('   ✅ Success! Received', data.length, 'plans');
    console.log('   Plans:', data.map(p => ({ name: p.name, price: p.price_monthly })));
    
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      console.error('   ⚠️ Network error - request blocked or failed');
      console.log('   Possible causes:');
      console.log('   - CORS blocking');
      console.log('   - Firewall blocking');
      console.log('   - Browser extension blocking');
    }
    return;
  }
  
  // Step 4: Test Supabase Client
  console.log('\n4️⃣ Testing Supabase Client:');
  try {
    // Try to import and use the Supabase client
    const supabaseModule = await import('/src/lib/supabase.ts');
    console.log('   ✅ Supabase module loaded');
    console.log('   Configured:', supabaseModule.SUPABASE_CONFIGURED);
    console.log('   Client URL:', supabaseModule.supabase?.supabaseUrl);
    
    const { data, error } = await supabaseModule.supabase
      .from('subscription_plans')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('   ❌ Supabase client error:', error);
    } else {
      console.log('   ✅ Supabase client works!');
    }
  } catch (err) {
    console.error('   ❌ Cannot load Supabase client:', err.message);
    console.log('   This might be a build/import issue');
  }
  
  console.log('\n==========================================');
  console.log('✅ Diagnostic complete!');
  console.log('Share the results above for further help.');
})();






