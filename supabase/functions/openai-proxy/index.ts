import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createServiceSupabaseClient, getBearerToken, hasActiveSubscription, paywallPayload, requireAuthenticatedUser } from '../_shared/auth.ts'
import { jsonResponse } from '../_shared/http.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-path',
}

const action = 'OPEN_PRICING'
const allowedPaths = new Set(['/audio/transcriptions', '/audio/speech', '/images/generations', '/chat/completions'])

const jsonRequestSchema = z.object({
  path: z.string(),
  method: z.string().optional(),
  body: z.unknown().optional(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📥 OpenAI proxy received request:', {
      method: req.method,
      url: req.url,
      hasAuth: !!req.headers.get('Authorization')
    })

    const supabase = createServiceSupabaseClient()
    const token = getBearerToken(req.headers.get('Authorization'))
    if (!token) {
      console.error('❌ No authorization token provided')
      return jsonResponse({ error: 'Unauthorized - No token provided' }, 401, corsHeaders)
    }

    const user = await requireAuthenticatedUser(supabase, token)
    if (!user) {
      console.error('❌ Invalid or expired token')
      return jsonResponse({ error: 'Unauthorized - Invalid token' }, 401, corsHeaders)
    }

    console.log('✅ User authenticated:', user.id)

    const active = await hasActiveSubscription(supabase, user.id)
    if (!active) {
      console.log('⚠️ User does not have active subscription')
      return jsonResponse(paywallPayload('Active subscription required', action), 402, corsHeaders)
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured')
      return jsonResponse({ error: 'Server configuration error - OPENAI_API_KEY not set' }, 500, corsHeaders)
    }

    console.log('✅ OpenAI API key found')

    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const path = req.headers.get('x-openai-path') || '/audio/transcriptions'
      if (!allowedPaths.has(path)) return jsonResponse({ error: 'Invalid OpenAI path' }, 400, corsHeaders)
      
      const response = await fetch(`https://api.openai.com/v1${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: formData
      })
      
      const data = await response.json()
      return jsonResponse(data, response.status, corsHeaders)
    }

    // Parse request body with better error handling
    let requestBody
    try {
      const text = await req.text()
      if (!text || text.trim() === '') {
        console.error('❌ Empty request body')
        return jsonResponse({ 
          error: 'Request body is required',
          details: 'The request body is empty'
        }, 400, corsHeaders)
      }
      requestBody = JSON.parse(text)
      console.log('✅ Parsed request body:', {
        path: (requestBody as any)?.path,
        method: (requestBody as any)?.method,
        hasBody: !!(requestBody as any)?.body
      })
    } catch (e) {
      console.error('❌ Failed to parse request body:', e)
      return jsonResponse({ 
        error: 'Invalid JSON in request body',
        details: e instanceof Error ? e.message : String(e)
      }, 400, corsHeaders)
    }

    // Validate request schema
    let parsed
    try {
      parsed = jsonRequestSchema.parse(requestBody)
    } catch (e) {
      if (e instanceof z.ZodError) {
        console.error('❌ Request validation errors:', e.errors)
        return jsonResponse({ 
          error: 'Request validation failed',
          message: e.errors[0]?.message || 'Invalid request format',
          details: e.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }, 400, corsHeaders)
      }
      throw e
    }

    const path = parsed.path
    if (!allowedPaths.has(path)) {
      console.error('❌ Invalid path:', path)
      return jsonResponse({ 
        error: `Invalid OpenAI path: ${path}. Allowed paths: ${Array.from(allowedPaths).join(', ')}` 
      }, 400, corsHeaders)
    }
    
    const method = parsed.method || 'POST'
    const body = parsed.body ?? null

    console.log('🚀 Sending request to OpenAI API:', {
      url: `https://api.openai.com/v1${path}`,
      method,
      hasBody: !!body
    })

    const response = await fetch(`https://api.openai.com/v1${path}`, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const respContentType = response.headers.get('content-type')
    
    if (!response.ok) {
      console.error('❌ OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        path
      })
    } else {
      console.log('✅ OpenAI API success:', {
        status: response.status,
        path
      })
    }

    if (respContentType && (respContentType.includes('audio') || respContentType.includes('application/octet-stream'))) {
        const blob = await response.blob()
        return new Response(blob, {
            headers: { ...corsHeaders, 'Content-Type': respContentType },
            status: response.status,
        })
    } else {
        const data = await response.json()
        
        // If OpenAI API returned an error, include it in the response
        if (!response.ok) {
          const errorMessage = data?.error?.message || data?.message || data?.error || `OpenAI API error (${response.status})`
          return jsonResponse({ 
            error: errorMessage, 
            details: data 
          }, response.status, corsHeaders)
        }
        
        return jsonResponse(data, response.status, corsHeaders)
    }
  } catch (error) {
    console.error('❌ Unexpected error in openai-proxy:', error)
    
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return jsonResponse({ 
        error: 'Invalid JSON in request body',
        details: error.message
      }, 400, corsHeaders)
    }
    
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation errors:', error.errors)
      return jsonResponse({ 
        error: 'Request validation failed',
        message: error.errors[0]?.message || 'Invalid request format',
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
