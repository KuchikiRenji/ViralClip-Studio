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
  url: z.string().min(1).max(2048),
})

const isAllowedRedditUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    const host = parsed.hostname.toLowerCase()
    return host === 'reddit.com' || host.endsWith('.reddit.com') || host === 'redd.it'
  } catch {
    return false
  }
}

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

    const parsed = requestSchema.parse(await req.json())
    const url = parsed.url
    if (!isAllowedRedditUrl(url)) return jsonResponse({ error: 'Invalid Reddit URL' }, 400, corsHeaders)

    const cleanUrl = url.replace(/\/$/, '') + '.json'
    
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Reddit API failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    const post = data[0]?.data?.children?.[0]?.data
    if (!post) throw new Error('Could not find post data')

    const result = {
      title: post.title,
      content: post.selftext || post.title,
      author: post.author,
      subreddit: post.subreddit,
      ups: post.ups,
      num_comments: post.num_comments
    }

    return jsonResponse(result, 200, corsHeaders)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: 'Invalid request' }, 400, corsHeaders)
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'Request failed' }, 400, corsHeaders)
  }
})

