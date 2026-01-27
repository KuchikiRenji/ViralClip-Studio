import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) throw new Error('Unauthorized')

    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const SQUARE_LOCATION_ID = Deno.env.get('SQUARE_LOCATION_ID')
    const SQUARE_API_URL = Deno.env.get('SQUARE_API_URL') || 'https://connect.squareupsandbox.com'

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      user_id: user.id,
      user_email: user.email,
      environment_variables: {
        has_access_token: !!SQUARE_ACCESS_TOKEN,
        access_token_length: SQUARE_ACCESS_TOKEN?.length || 0,
        access_token_prefix: SQUARE_ACCESS_TOKEN?.substring(0, 10) || 'MISSING',
        has_location_id: !!SQUARE_LOCATION_ID,
        location_id: SQUARE_LOCATION_ID || 'MISSING',
        api_url: SQUARE_API_URL,
      },
      tests: {}
    }

    // Test 1: List locations
    try {
      const locationsResponse = await fetch(`${SQUARE_API_URL}/v2/locations`, {
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Square-Version': '2024-01-18',
        },
      })
      const locationsResult = await locationsResponse.json()
      
      diagnostics.tests.list_locations = {
        status: locationsResponse.status,
        success: locationsResponse.ok,
        data: locationsResult,
      }
    } catch (error) {
      diagnostics.tests.list_locations = {
        success: false,
        error: error.message,
      }
    }

    // Test 2: List subscription plans
    try {
      const plansResponse = await fetch(`${SQUARE_API_URL}/v2/catalog/list?types=SUBSCRIPTION_PLAN`, {
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Square-Version': '2024-01-18',
        },
      })
      const plansResult = await plansResponse.json()
      
      diagnostics.tests.list_subscription_plans = {
        status: plansResponse.status,
        success: plansResponse.ok,
        data: plansResult,
      }
    } catch (error) {
      diagnostics.tests.list_subscription_plans = {
        success: false,
        error: error.message,
      }
    }

    // Test 3: Get subscription plans from database
    try {
      const { data: dbPlans, error: dbError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)

      diagnostics.tests.database_plans = {
        success: !dbError,
        error: dbError?.message,
        plans: dbPlans?.map(p => ({
          id: p.id,
          name: p.name,
          square_plan_id_monthly: p.square_plan_id_monthly,
          square_plan_id_annual: p.square_plan_id_annual,
        })),
      }
    } catch (error) {
      diagnostics.tests.database_plans = {
        success: false,
        error: error.message,
      }
    }

    // Test 4: Try to get/create customer
    try {
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('square_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingSub?.square_customer_id) {
        diagnostics.tests.square_customer = {
          exists: true,
          customer_id: existingSub.square_customer_id,
        }
      } else {
        // Try to create customer
        const customerRequest = {
          idempotency_key: crypto.randomUUID(),
          given_name: user.email?.split('@')[0] || 'Customer',
          email_address: user.email || undefined,
        }

        const customerResponse = await fetch(`${SQUARE_API_URL}/v2/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
            'Square-Version': '2024-01-18',
          },
          body: JSON.stringify(customerRequest),
        })

        const customerResult = await customerResponse.json()

        diagnostics.tests.square_customer = {
          exists: false,
          create_attempted: true,
          create_success: customerResponse.ok,
          create_status: customerResponse.status,
          create_result: customerResult,
        }
      }
    } catch (error) {
      diagnostics.tests.square_customer = {
        success: false,
        error: error.message,
      }
    }

    // Test 5: Check current edge function deployment
    diagnostics.function_info = {
      function_name: 'debug-square-subscription',
      deno_version: Deno.version.deno,
      v8_version: Deno.version.v8,
    }

    return new Response(JSON.stringify(diagnostics, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})







