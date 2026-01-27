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

const isAllowedPath = (path: string) => path.startsWith('/acts/') || path.startsWith('/actor-runs/')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN')
    if (!APIFY_TOKEN) {
      return jsonResponse({ error: 'Server configuration error' }, 500, corsHeaders)
    }

    const supabase = createServiceSupabaseClient()
    const token = getBearerToken(req.headers.get('Authorization'))
    if (!token) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const user = await requireAuthenticatedUser(supabase, token)
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const active = await hasActiveSubscription(supabase, user.id)
    if (!active) return jsonResponse(paywallPayload('Active subscription required', action), 402, corsHeaders)

    const parsed = requestSchema.parse(await req.json())
    const path = parsed.path
    if (!isAllowedPath(path)) return jsonResponse({ error: 'Invalid Apify path' }, 400, corsHeaders)
    const method = parsed.method || 'GET'
    const body = parsed.body
    
    const response = await fetch(`https://api.apify.com/v2${path}`, {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json()
    return jsonResponse(data, response.status, corsHeaders)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: 'Invalid request' }, 400, corsHeaders)
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'Request failed' }, 400, corsHeaders)
  }
})
