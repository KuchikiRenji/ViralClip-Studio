import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createServiceSupabaseClient, getBearerToken, hasActiveSubscription, paywallPayload, requireAuthenticatedUser } from '../_shared/auth.ts'
import { jsonResponse } from '../_shared/http.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const action = 'OPEN_PRICING'
const requestSchema = z.object({
  path: z.string(),
  method: z.string().optional(),
  body: z.unknown().optional(),
})

const isAllowedPath = (path: string) => path === '/text_to_video' || path.startsWith('/tasks/')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📥 Edge function received request:', {
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
      console.log('📦 Raw request body:', text.substring(0, 500)) // Log first 500 chars
      requestBody = JSON.parse(text)
      console.log('✅ Parsed request body:', JSON.stringify(requestBody, null, 2))
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
      parsed = requestSchema.parse(requestBody)
      console.log('✅ Request validated:', {
        path: parsed.path,
        method: parsed.method,
        hasBody: !!parsed.body,
        bodyKeys: parsed.body ? Object.keys(parsed.body as Record<string, unknown>) : []
      })
    } catch (e) {
      if (e instanceof z.ZodError) {
        console.error('❌ Zod validation errors:', e.errors)
        return jsonResponse({ 
          error: 'Request validation failed',
          message: e.errors[0]?.message || 'Invalid request format',
          details: e.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.path.length > 0 ? (requestBody as Record<string, unknown>)[err.path[0]] : undefined
          }))
        }, 400, corsHeaders)
      }
      throw e
    }

    const path = parsed.path
    if (!isAllowedPath(path)) {
      console.error('❌ Invalid path:', path)
      return jsonResponse({ error: `Invalid Runway path: ${path}. Allowed paths: /text_to_video, /tasks/*` }, 400, corsHeaders)
    }
    
    const method = parsed.method || 'POST'
    const body = parsed.body
    const RUNWAY_API_KEY = Deno.env.get('RUNWAY_API_KEY')

    if (!RUNWAY_API_KEY) {
      console.error('❌ RUNWAY_API_KEY not configured')
      return jsonResponse({ error: 'Server configuration error - RUNWAY_API_KEY not set' }, 500, corsHeaders)
    }

    console.log('🚀 Sending request to Runway API:', {
      url: `https://api.dev.runwayml.com/v1${path}`,
      method,
      body: body,
      bodyStringified: body ? JSON.stringify(body) : 'null',
      bodyKeys: body ? Object.keys(body as Record<string, unknown>) : []
    })

    const response = await fetch(`https://api.dev.runwayml.com/v1${path}`, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json()
    
    // If Runway API returns an error, include it in the response
    if (!response.ok) {
      console.error('❌ Runway API error:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        issues: data?.issues,
        requestBody: body
      })
      
      // Extract detailed error message
      let errorMessage = data?.error?.message || data?.message || data?.error || `Runway API error (${response.status})`
      
      // If there are validation issues, include them
      if (data?.issues && Array.isArray(data.issues) && data.issues.length > 0) {
        const issuesText = data.issues.map((issue: any) => {
          if (typeof issue === 'string') return issue
          if (issue.path) return `${issue.path.join('.')}: ${issue.message || issue}`
          return JSON.stringify(issue)
        }).join('; ')
        errorMessage = `${errorMessage}. Issues: ${issuesText}`
      }
      
      return jsonResponse({ 
        error: errorMessage, 
        details: data,
        issues: data?.issues 
      }, response.status, corsHeaders)
    }
    
    console.log('✅ Runway API success:', {
      status: response.status,
      hasId: !!data?.id
    })
    
    return jsonResponse(data, response.status, corsHeaders)
  } catch (error) {
    console.error('❌ Unexpected error in runway-proxy:', error)
    
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

