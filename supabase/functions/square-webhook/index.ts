import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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
    const signature = req.headers.get('x-square-hmac-sha256')
    const body = await req.text()
    
    const SQUARE_SIGNATURE_KEY = Deno.env.get('SQUARE_SIGNATURE_KEY')
    if (SQUARE_SIGNATURE_KEY && signature) {
      const expectedSignature = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(SQUARE_SIGNATURE_KEY + body)
      )
      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      if (signature !== expectedHex) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }
    }
    
    const event = JSON.parse(body)
    
    if (event.type === 'payment.updated') {
      const payment = event.data.object.payment
      
      if (payment.status === 'COMPLETED') {
        const paymentId = payment.id
        
        const { data: existing } = await supabase
            .from('purchases')
            .select('id, status')
            .eq('square_payment_id', paymentId)
            .single()

        if (existing) {
            if (existing.status !== 'COMPLETED') {
                await supabase.from('purchases').update({ status: 'COMPLETED' }).eq('id', existing.id)
            }
            return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders })
        }
        
        console.warn('Received webhook for unknown payment:', paymentId)
      }
    }

    if (event.type === 'subscription.created' || event.type === 'subscription.updated') {
      const subscription = event.data.object.subscription
      
      if (!subscription?.id) {
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders })
      }

      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('id, plan_id')
        .eq('square_subscription_id', subscription.id)
        .single()

      if (existingSub) {
        const statusMap: Record<string, string> = {
          'ACTIVE': 'active',
          'CANCELED': 'canceled',
          'PAST_DUE': 'past_due',
          'PAUSED': 'paused',
          'DEACTIVATED': 'canceled',
        }

        await supabase
          .from('user_subscriptions')
          .update({
            status: statusMap[subscription.status] || 'incomplete',
            current_period_start: subscription.start_date || null,
            current_period_end: subscription.charged_through_date || null,
            cancel_at_period_end: subscription.canceled_date ? true : false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSub.id)
      } else {
        console.warn('Received webhook for unknown subscription:', subscription.id)
      }
    }

    if (event.type === 'subscription.deleted') {
      const subscription = event.data.object.subscription
      
      if (subscription?.id) {
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('square_subscription_id', subscription.id)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
