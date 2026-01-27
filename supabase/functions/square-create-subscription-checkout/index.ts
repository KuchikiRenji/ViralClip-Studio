import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const requestSchema = z.object({
  plan_id: z.string().uuid(),
  interval: z.enum(['monthly', 'annual']),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('📥 Request received:', { method: req.method, origin: req.headers.get('origin') })
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Missing Authorization header')
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      throw new Error('Unauthorized')
    }

    console.log('✅ User authenticated:', user.id)

    const body = await req.json()
    console.log('📄 Request body:', { plan_id: body.plan_id, interval: body.interval })
    
    const { plan_id, interval } = requestSchema.parse(body)

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      console.error('❌ Plan not found:', planError)
      throw new Error('Subscription plan not found')
    }

    console.log('✅ Plan found:', {
      name: plan.name,
      price_monthly: plan.price_monthly,
      price_in_dollars: plan.price_monthly ? `$${(plan.price_monthly / 100).toFixed(2)}` : 'N/A',
      square_plan_id_monthly: plan.square_plan_id_monthly,
      square_plan_id_annual: plan.square_plan_id_annual
    })

    const squarePlanId = interval === 'annual' 
      ? plan.square_plan_id_annual 
      : plan.square_plan_id_monthly

    if (!squarePlanId) {
      console.error('❌ Missing Square plan ID for interval:', interval)
      throw new Error(`Square plan ID not configured for ${interval} billing`)
    }
    
    console.log('🔑 Using Square plan ID:', squarePlanId, 'for', interval, 'billing')

    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const SQUARE_API_URL = Deno.env.get('SQUARE_API_URL') || 'https://connect.squareupsandbox.com'
    const SQUARE_LOCATION_ID = Deno.env.get('SQUARE_LOCATION_ID')
    
    if (!SQUARE_ACCESS_TOKEN) {
      console.error('❌ SQUARE_ACCESS_TOKEN not configured')
      throw new Error('Server configuration error: Missing Square Token')
    }

    if (!SQUARE_LOCATION_ID) {
      console.error('❌ SQUARE_LOCATION_ID not configured')
      throw new Error('Server configuration error: Missing Square Location ID')
    }

    console.log('✅ Square API configured:', SQUARE_API_URL)
    console.log('✅ Using plan ID:', squarePlanId)

    const customerId = await getOrCreateSquareCustomer(supabase, user.id, SQUARE_ACCESS_TOKEN, SQUARE_API_URL)
    console.log('✅ Customer ID:', customerId)

    // Create subscription - Square will use phases from the plan variation
    const subscriptionRequest = {
      idempotency_key: crypto.randomUUID(),
      location_id: SQUARE_LOCATION_ID,
      customer_id: customerId,
      plan_variation_id: squarePlanId,
      // For RELATIVE pricing, phases are defined in the plan variation itself
      // We just need to reference it - no need to pass phases here
    }

    console.log('📤 Creating subscription with request:', JSON.stringify(subscriptionRequest, null, 2))

    const subscriptionResponse = await fetch(`${SQUARE_API_URL}/v2/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify(subscriptionRequest),
    })

    const subscriptionResult = await subscriptionResponse.json()

    if (!subscriptionResponse.ok) {
      console.error('❌ Square Subscription Error:', subscriptionResult)
      const errorDetail = subscriptionResult.errors?.[0]?.detail || subscriptionResult.errors?.[0]?.field || subscriptionResult.errors?.[0]?.code || 'Subscription creation failed'
      throw new Error(errorDetail)
    }

    const subscription = subscriptionResult.subscription
    console.log('✅ Subscription created:', subscription?.id)

    // Get invoice URL for payment
    const invoiceId = subscription?.invoice_ids?.[0]
    let checkoutUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/pricing?success=true`

    if (invoiceId) {
      // Get invoice to find payment URL
      const invoiceResponse = await fetch(`${SQUARE_API_URL}/v2/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Square-Version': '2024-01-18',
        },
      })

      const invoiceResult = await invoiceResponse.json()
      if (invoiceResponse.ok && invoiceResult.invoice?.public_url) {
        checkoutUrl = invoiceResult.invoice.public_url
        console.log('✅ Invoice URL:', checkoutUrl)
      }
    }

    // Save subscription record
    const { error: dbError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: plan_id,
        square_subscription_id: subscription?.id || null,
        square_customer_id: customerId,
        billing_interval: interval,
        status: subscription?.status === 'ACTIVE' ? 'active' : 'pending',
        current_period_start: subscription?.start_date || new Date().toISOString(),
        current_period_end: subscription?.charged_through_date || null,
        cancel_at_period_end: false,
      }, {
        onConflict: 'user_id',
      })

    if (dbError) {
      console.warn('⚠️ DB Error (non-fatal):', dbError)
    }

    // Send pricing information email to user
    try {
      const userEmail = user.email
      if (userEmail) {
        console.log('📧 Sending pricing information email to:', userEmail)
        
        const priceInDollars = plan.price_monthly ? (plan.price_monthly / 100).toFixed(2) : '0.00'
        const intervalText = interval === 'annual' ? 'year' : 'month'
        const annualPrice = interval === 'annual' && plan.price_monthly 
          ? ((plan.price_monthly * 12 * 0.5) / 100).toFixed(2) 
          : null
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pricing Information - ${plan.name}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Interest!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for your interest in our <strong>${plan.name}</strong> plan. Here are the pricing details:
              </p>
              
              <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h2 style="color: #667eea; margin-top: 0; font-size: 24px;">${plan.name}</h2>
                <div style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 15px 0;">
                  CA$${priceInDollars}
                  <span style="font-size: 18px; color: #6b7280;">/${intervalText}</span>
                </div>
                ${annualPrice ? `
                  <div style="color: #059669; font-size: 14px; margin-top: 10px;">
                    Annual billing: CA$${annualPrice}/year (Save 50%!)
                  </div>
                ` : ''}
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <h3 style="font-size: 18px; margin-bottom: 15px; color: #1f2937;">Plan Features:</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    ${plan.features?.aiVideos ? `<li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">✓ ${plan.features.aiVideos} AI Videos per month</li>` : ''}
                    ${plan.features?.exportMinutes ? `<li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">✓ ${plan.features.exportMinutes} Export Minutes per month</li>` : ''}
                    ${plan.features?.voiceMinutes ? `<li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">✓ ${plan.features.voiceMinutes} Voice Minutes per month</li>` : ''}
                    ${plan.features?.aiImages ? `<li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">✓ ${plan.features.aiImages} AI Images per month</li>` : ''}
                  </ul>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${checkoutUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Complete Your Subscription
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If you have any questions, please don't hesitate to contact us at <a href="mailto:support@zitro.ai" style="color: #667eea;">support@zitro.ai</a>
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Best regards,<br>
                The Zitro AI Team
              </p>
            </div>
          </body>
          </html>
        `
        
        // Invoke send-email function
        const emailResponse = await supabase.functions.invoke('send-email', {
          body: {
            to: userEmail,
            subject: `Pricing Information - ${plan.name} Plan`,
            html: emailHtml,
            from: 'support@zitro.ai',
            fromName: 'Zitro AI'
          }
        })
        
        if (emailResponse.error) {
          console.warn('⚠️ Failed to send pricing email:', emailResponse.error)
          // Don't fail the subscription if email fails
        } else {
          console.log('✅ Pricing information email sent successfully')
        }
      } else {
        console.warn('⚠️ User email not available, skipping email send')
      }
    } catch (emailError) {
      console.warn('⚠️ Error sending pricing email (non-fatal):', emailError)
      // Don't fail the subscription if email fails
    }

    console.log('✅ Returning checkout URL:', checkoutUrl)

    return new Response(JSON.stringify({ 
      url: checkoutUrl,
      subscription_id: subscription?.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Error in square-create-subscription-checkout:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return new Response(JSON.stringify({ error: 'Invalid request', details: error.errors }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error message:', errorMessage)
    
    // Improve error messages to avoid confusion with user registration
    // Square API errors might mention "registration" which refers to customer registration, not user registration
    if (errorMessage.toLowerCase().includes('registration') && 
        !errorMessage.toLowerCase().includes('payment') && 
        !errorMessage.toLowerCase().includes('account')) {
      errorMessage = errorMessage.replace(/registration/gi, 'payment account setup')
    }
    
    // Provide user-friendly error messages
    if (errorMessage.includes('Failed to retrieve user information')) {
      errorMessage = 'Authentication error. Please log out and log back in, then try again.'
    } else if (errorMessage.includes('Unauthorized')) {
      errorMessage = 'Session expired. Please log out and log back in, then try again.'
    } else if (errorMessage.includes('Square plan ID not configured')) {
      errorMessage = 'Subscription plan configuration error. Please contact support.'
    } else if (errorMessage.includes('Missing Square')) {
      errorMessage = 'Payment system configuration error. Please contact support.'
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

async function getOrCreateSquareCustomer(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  squareToken: string,
  squareApiUrl: string
): Promise<string> {
  // Check if customer already exists in user_subscriptions
  const { data: existingSub } = await supabase
    .from('user_subscriptions')
    .select('square_customer_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingSub?.square_customer_id) {
    console.log('Using existing Square customer:', existingSub.square_customer_id)
    return existingSub.square_customer_id
  }

  // Get user details from auth
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
  
  if (userError || !user) {
    console.error('Failed to get user:', userError)
    throw new Error('Failed to retrieve user information')
  }

  // Get display name from profile if available
  const { data: profile } = await supabase
    .from('users_profile')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle()

  console.log('Creating Square customer for:', user.email)
  
  const customerResponse = await fetch(`${squareApiUrl}/v2/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${squareToken}`,
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      given_name: profile?.display_name || user?.email?.split('@')[0] || 'Customer',
      email_address: user?.email || undefined,
    }),
  })

  const customerResult = await customerResponse.json()

  if (!customerResponse.ok) {
    console.error('Square customer creation failed:', customerResult)
    const squareError = customerResult.errors?.[0]?.detail || customerResult.errors?.[0]?.code || 'Failed to create payment account'
    // Provide clearer error message that doesn't confuse with user registration
    throw new Error(`Payment account setup failed: ${squareError}. Please try again or contact support.`)
  }

  const customerId = customerResult.customer?.id
  if (!customerId) {
    throw new Error('No customer ID returned from Square')
  }

  console.log('Square customer created:', customerId)
  
  // Save Square customer ID to user profile for future use
  const { error: updateError } = await supabase
    .from('users_profile')
    .update({ square_customer_id: customerId })
    .eq('id', userId)
  
  if (updateError) {
    console.warn('Failed to save Square customer ID to profile:', updateError)
    // Don't throw - the subscription can still proceed
  }
  
  return customerId
}




