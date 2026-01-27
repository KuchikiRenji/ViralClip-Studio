import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createServiceSupabaseClient, getBearerToken, hasActiveSubscription, paywallPayload, requireAuthenticatedUser } from '../_shared/auth.ts'
import { jsonResponse } from '../_shared/http.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-elevenlabs-path',
}

const action = 'OPEN_PRICING'
const requestSchema = z.object({
  path: z.string(),
  method: z.string().optional(),
  body: z.unknown().optional(),
  contentType: z.string().optional(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createServiceSupabaseClient()
    const token = getBearerToken(req.headers.get('Authorization'))
    if (!token) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const user = await requireAuthenticatedUser(supabase, token)
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const active = await hasActiveSubscription(supabase, user.id)
    if (!active) return jsonResponse(paywallPayload('Active subscription required', action), 402, corsHeaders)

    const contentType = req.headers.get('content-type') || ''
    
    // Handle FormData for voice cloning (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const path = req.headers.get('x-elevenlabs-path') || '/voices/add'
      
      // Only allow voice cloning endpoints
      if (!path.startsWith('/voices/')) {
        return jsonResponse({ error: 'Invalid ElevenLabs path for FormData' }, 400, corsHeaders)
      }
      
      const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
      if (!ELEVENLABS_API_KEY) {
        return jsonResponse({ error: 'Server configuration error - ELEVENLABS_API_KEY not set' }, 500, corsHeaders)
      }

      const response = await fetch(`https://api.elevenlabs.io/v1${path}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
          // Don't set Content-Type - browser sets it with boundary for FormData
        },
        body: formData
      })

      const data = await response.json()
      return jsonResponse(data, response.status, corsHeaders)
    }

    // Handle JSON requests (TTS and other endpoints)
    const parsed = requestSchema.parse(await req.json())
    const path = parsed.path
    
    // Allow both TTS and voice management endpoints
    if (!path.startsWith('/text-to-speech/') && !path.startsWith('/voices/')) {
      return jsonResponse({ error: 'Invalid ElevenLabs path. Allowed: /text-to-speech/* or /voices/*' }, 400, corsHeaders)
    }
    
    const method = parsed.method || 'POST'
    const body = parsed.body
    const parsedContentType = parsed.contentType
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')

    if (!ELEVENLABS_API_KEY) {
      return jsonResponse({ error: 'Server configuration error - ELEVENLABS_API_KEY not set' }, 500, corsHeaders)
    }

    const headers: Record<string, string> = {
      'xi-api-key': ELEVENLABS_API_KEY
    }
    
    if (parsedContentType) {
        headers['Content-Type'] = parsedContentType
    } else {
        headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`https://api.elevenlabs.io/v1${path}`, {
      method: method || 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    // Handle binary response (audio) or JSON
    const contentTypeRes = response.headers.get('content-type')
    if (contentTypeRes && contentTypeRes.includes('application/json')) {
        const data = await response.json()
        return jsonResponse(data, response.status, corsHeaders)
    } else {
        const blob = await response.blob()
        return new Response(blob, {
            headers: { ...corsHeaders, 'Content-Type': contentTypeRes || 'audio/mpeg' },
            status: response.status,
        })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: 'Invalid request' }, 400, corsHeaders)
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'Request failed' }, 400, corsHeaders)
  }
})

