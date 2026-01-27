import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { jsonResponse } from '../_shared/http.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const requestSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(250000),
  from: z.string().email().optional(),
  fromName: z.string().optional(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📥 send-email function received request:', {
      method: req.method,
      url: req.url,
      hasAuth: !!req.headers.get('Authorization')
    })

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured')
      return jsonResponse({ error: 'Server configuration error' }, 500, corsHeaders)
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const apiKeyHeader = req.headers.get('apikey') ?? ''
    const isServiceRoleCaller = authHeader === `Bearer ${serviceRoleKey}` || apiKeyHeader === serviceRoleKey
    if (!isServiceRoleCaller) {
      console.error('❌ Unauthorized request - invalid service role key')
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)
    }

    // Parse and validate request body
    let requestBody
    try {
      const text = await req.text()
      if (!text || text.trim() === '') {
        return jsonResponse({ 
          error: 'Request body is required',
          details: 'The request body is empty'
        }, 400, corsHeaders)
      }
      requestBody = JSON.parse(text)
    } catch (e) {
      console.error('❌ Failed to parse request body:', e)
      return jsonResponse({ 
        error: 'Invalid JSON in request body',
        details: e instanceof Error ? e.message : String(e)
      }, 400, corsHeaders)
    }

    const parsed = requestSchema.parse(requestBody)
    const toEmails = Array.isArray(parsed.to) ? parsed.to : [parsed.to]
    const subject = parsed.subject
    const html = parsed.html
    const fromEmail = parsed.from || 'support@zitro.ai'
    const fromName = parsed.fromName || 'Zitro AI Support'
    
    console.log('✅ Request validated:', {
      to: toEmails,
      from: fromEmail,
      subject: subject.substring(0, 50) + '...',
      htmlLength: html.length
    })
    
    // SMTP.com configuration from environment or use defaults from config.toml
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'send.smtp.com'
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const SMTP_USER = Deno.env.get('SMTP_USER') || 'support@zitro.ai'
    const SMTP_PASS = Deno.env.get('SMTP_PASS') || Deno.env.get('SMTP_PASSWORD') || 'CHi@MZcyTmL2JRa'
    
    if (!SMTP_PASS) {
      console.error('❌ SMTP_PASS is not set in Supabase Edge Function secrets')
      return jsonResponse({ 
        error: 'SMTP_PASS not configured',
        message: 'Please set SMTP_PASS in Supabase Dashboard -> Settings -> Edge Functions -> Secrets',
        sent: false
      }, 500, corsHeaders)
    }

    console.log('📤 Sending email via SMTP.com:', {
      to: toEmails,
      from: fromEmail,
      subject: subject,
      host: SMTP_HOST,
      port: SMTP_PORT
    })

    // Use SMTP protocol directly with SMTP.com
    try {
      // Import SMTP client library for Deno
      const { SmtpClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts')
      
      const client = new SmtpClient()
      
      await client.connect({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        username: SMTP_USER,
        password: SMTP_PASS,
        // Port 465 uses SSL (implicit TLS), port 587 uses STARTTLS
        tls: SMTP_PORT === 465 ? false : true,
        tlsOptions: {
          rejectUnauthorized: false // SMTP.com uses valid certificates
        }
      })

      // Send email to each recipient
      const messageIds = []
      for (const email of toEmails) {
        const result = await client.send({
          from: `${fromName} <${fromEmail}>`,
          to: email,
          subject: subject,
          content: html,
          html: html
        })
        messageIds.push(result.messageId || `smtp-${Date.now()}-${email}`)
      }

      await client.close()

      console.log('✅ Email sent successfully via SMTP.com:', {
        to: toEmails,
        messageIds: messageIds
      })

      return jsonResponse({ 
        sent: true, 
        id: messageIds[0] || `smtp-${Date.now()}`,
        to: toEmails,
        from: fromEmail
      }, 200, corsHeaders)
    } catch (smtpError) {
      const errorMessage = smtpError instanceof Error ? smtpError.message : String(smtpError)
      console.error('❌ SMTP.com error:', {
        error: errorMessage,
        details: smtpError,
        host: SMTP_HOST,
        port: SMTP_PORT,
        user: SMTP_USER
      })
      
      return jsonResponse({ 
        error: `SMTP.com error: ${errorMessage}`,
        message: 'Failed to send email via SMTP.com. Please check SMTP credentials and configuration.',
        details: smtpError instanceof Error ? smtpError.stack : String(smtpError),
        sent: false 
      }, 502, corsHeaders)
    }
  } catch (error) {
    console.error('❌ Unexpected error in send-email:', error)
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation errors:', error.errors)
      return jsonResponse({ 
        error: 'Invalid request',
        message: error.errors[0]?.message || 'Request validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
      }, 400, corsHeaders)
    }
    
    return jsonResponse({ 
      error: error instanceof Error ? error.message : 'Request failed',
      details: error instanceof Error ? error.stack : String(error)
    }, 400, corsHeaders)
  }
})
