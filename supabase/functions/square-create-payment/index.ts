import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { jsonResponse } from '../_shared/http.ts'
import { getBearerToken } from '../_shared/auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const requestSchema = z.object({
  pack_id: z.string().min(1),
  nonce: z.string().min(1),
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
    const authHeader = req.headers.get('Authorization')
    const token = getBearerToken(authHeader)
    if (!token) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)
    }

    const parsedBody = requestSchema.parse(await req.json())
    const pack_id = parsedBody.pack_id
    const nonce = parsedBody.nonce

    const { data: pack, error: packError } = await supabase
      .from('credit_packs')
      .select('*')
      .eq('id', pack_id)
      .single()

    if (packError || !pack) throw new Error('Credit pack not found')

    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const SQUARE_API_URL = Deno.env.get('SQUARE_API_URL') || 'https://connect.squareupsandbox.com/v2/payments'
    
    if (!SQUARE_ACCESS_TOKEN) throw new Error('Server configuration error: Missing Square Token')

    const paymentResponse = await fetch(SQUARE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        source_id: nonce,
        amount_money: {
          amount: pack.price_cad_cents,
          currency: 'CAD'
        },
        idempotency_key: crypto.randomUUID(),
        note: `Purchase: ${pack.name} (${pack.credits} credits)`
      })
    })

    const paymentResult = await paymentResponse.json()

    if (!paymentResponse.ok) {
      throw new Error(paymentResult.errors?.[0]?.detail || 'Payment failed')
    }

    const payment = paymentResult.payment

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        amount_cents: pack.price_cad_cents,
        currency: 'CAD',
        square_payment_id: payment.id,
        status: payment.status,
        metadata: payment,
      })
      .select()
      .single()

    if (purchaseError || !purchase) {
      return jsonResponse({ error: 'Failed to record purchase' }, 500, corsHeaders)
    }

    await supabase.from('purchase_items').insert({
        purchase_id: purchase.id,
        item_type: 'credit_pack',
        item_ref_id: pack.id,
        amount_cents: pack.price_cad_cents
    })

    if (payment.status === 'COMPLETED') {
        const { error: creditError } = await supabase.rpc('add_credits', {
            p_user_id: user.id,
            p_amount: pack.credits,
            p_reason: `Purchase: ${pack.name}`,
            p_type: 'credit'
        })
        
        if (creditError) {
             const { data: current } = await supabase.from('user_credits').select('balance').eq('user_id', user.id).single()
             const newBalance = (current?.balance || 0) + pack.credits
             
             await supabase.from('user_credits').upsert({
                 user_id: user.id,
                 balance: newBalance,
                 updated_at: new Date().toISOString()
             })

             await supabase.from('credit_transactions').insert({
                 user_id: user.id,
                 amount: pack.credits,
                 type: 'credit',
                 description: `Purchase: ${pack.name}`,
                 balance_after: newBalance
             })
        }
    }

    if (payment.status === 'COMPLETED') {
        let emailEventId: string | null = null
        try {
            const userEmail = user.email ?? ''
            if (!userEmail) {
                await supabase
                    .from('email_events')
                    .insert({
                        user_id: user.id,
                        purchase_id: purchase.id,
                        to_email: '',
                        subject: 'Zitro AI - Purchase Confirmation & Digital Products',
                        template_name: 'purchase_confirmation',
                        status: 'failed',
                        error_message: 'Missing user email',
                    })
                return jsonResponse({ success: true, purchase_id: purchase.id }, 200, corsHeaders)
            }

            const { data: purchaseItems } = await supabase
                .from('purchase_items')
                .select('item_type, item_ref_id')
                .eq('purchase_id', purchase.id)

            const digitalProductIds = purchaseItems?.filter(item => item.item_type === 'digital_product').map(item => item.item_ref_id) || []

            const { data: digitalProducts } = digitalProductIds.length > 0
                ? await supabase
                    .from('digital_products')
                    .select('id, name, download_url')
                    .in('id', digitalProductIds)
                : { data: [] }

            const hasDigitalProducts = Boolean(digitalProducts && digitalProducts.length > 0)

            const { data: emailEvent } = await supabase
                .from('email_events')
                .insert({
                    user_id: user.id,
                    purchase_id: purchase.id,
                    to_email: userEmail,
                    subject: 'Zitro AI - Purchase Confirmation & Digital Products',
                    template_name: 'purchase_confirmation',
                    status: 'pending',
                })
                .select('id')
                .single()

            emailEventId = emailEvent?.id ?? null
            if (!emailEventId) {
                return jsonResponse({ success: true, purchase_id: purchase.id }, 200, corsHeaders)
            }

            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: white; padding: 40px; border-radius: 20px; border: 1px solid #333;">
                    <h1 style="color: #3b82f6; margin-bottom: 20px;">Thank you for your purchase!</h1>
                    <p style="font-size: 16px; line-height: 1.5;">We've successfully processed your payment and updated your account.</p>
                    
                    <div style="background: #111; padding: 20px; border-radius: 12px; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #888; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Order Summary</h3>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>${pack.name}</span>
                            <span style="color: #3b82f6;">${pack.credits} Credits</span>
                        </div>
                        ${hasDigitalProducts ? digitalProducts.map(product => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>${product.name}</span>
                                <span style="color: #3b82f6;">Included</span>
                            </div>
                        `).join('') : ''}
                        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #222; padding-top: 10px; margin-top: 10px;">
                            <span>Total</span>
                            <span>$${(pack.price_cad_cents / 100).toFixed(2)} CAD</span>
                        </div>
                    </div>

                    ${hasDigitalProducts ? `
                    <div style="background: #1e1b4b; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #4338ca;">
                        <h3 style="margin-top: 0; color: #a5b4fc; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Your Digital Products</h3>
                        <p style="font-size: 14px;">Your digital assets are ready for download:</p>
                        ${digitalProducts.map(product => `
                            <div style="margin: 10px 0;">
                                <a href="${product.download_url}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Download ${product.name}</a>
                            </div>
                        `).join('')}
                        <a href="https://zitro.ai/dashboard/library" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">Access Library</a>
                    </div>
                    ` : ''}

                    <p style="color: #666; font-size: 14px;">Transaction ID: <span style="font-family: monospace;">${payment.id}</span></p>
                    
                    <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0;">
                    
                    <div style="text-align: center;">
                        <p style="color: #888; font-size: 12px;">Need help? Contact us at <a href="mailto:support@zitro.ai" style="color: #3b82f6;">support@zitro.ai</a></p>
                        <p style="color: #444; font-size: 10px;">&copy; 2025 Zitro AI. All rights reserved.</p>
                    </div>
                </div>
            `

            const emailInvoke = await supabase.functions.invoke('send-email', {
                body: {
                    to: userEmail,
                    subject: 'Zitro AI - Purchase Confirmation & Digital Products',
                    html: emailHtml,
                }
            })

            const sent = !emailInvoke.error && emailInvoke.data?.sent === true

            await supabase
                .from('email_events')
                .update({
                    status: sent ? 'sent' : 'failed',
                    error_message: sent ? null : emailInvoke.error ? JSON.stringify(emailInvoke.error) : 'Email send failed',
                    sent_at: sent ? new Date().toISOString() : null,
                })
                .eq('id', emailEventId)

        } catch (emailError) {
            if (emailEventId) {
                await supabase
                    .from('email_events')
                    .update({
                        status: 'failed',
                        error_message: emailError instanceof Error ? emailError.message : String(emailError),
                    })
                    .eq('id', emailEventId)
            }
        }
    }

    return jsonResponse({ success: true, purchase_id: purchase.id }, 200, corsHeaders)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: 'Invalid request' }, 400, corsHeaders)
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'Request failed' }, 400, corsHeaders)
  }
})

