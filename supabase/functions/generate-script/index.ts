import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createServiceSupabaseClient, getBearerToken, hasActiveSubscription, paywallPayload, requireAuthenticatedUser } from '../_shared/auth.ts'
import { jsonResponse } from '../_shared/http.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const action = 'OPEN_PRICING'

interface ScriptRequest {
  prompt: string
  type: 'story' | 'reddit' | 'educational' | 'promotional' | 'custom' | 'chat-story'
  tone?: 'casual' | 'professional' | 'humorous' | 'dramatic' | 'inspirational'
  duration_seconds?: number
  language?: string
  include_hooks?: boolean
  include_cta?: boolean
}

const requestSchema: z.ZodType<ScriptRequest> = z.object({
  prompt: z.string().min(1).max(8000),
  type: z.enum(['story', 'reddit', 'educational', 'promotional', 'custom', 'chat-story']),
  tone: z.enum(['casual', 'professional', 'humorous', 'dramatic', 'inspirational']).optional(),
  duration_seconds: z.number().int().min(5).max(900).optional(),
  language: z.string().max(64).optional(),
  include_hooks: z.boolean().optional(),
  include_cta: z.boolean().optional(),
})

const buildSystemPrompt = (request: ScriptRequest): string => {
  const wordsPerSecond = 2.5
  const targetWords = Math.round((request.duration_seconds || 60) * wordsPerSecond)
  
  const toneGuides: Record<string, string> = {
    casual: 'conversational, friendly, relatable',
    professional: 'authoritative, clear, trustworthy',
    humorous: 'witty, light-hearted, entertaining',
    dramatic: 'intense, emotional, suspenseful',
    inspirational: 'uplifting, motivational, empowering',
  }
  
  const toneStyle = toneGuides[request.tone || 'casual']
  
  if (request.type === 'chat-story') {
    return `You are an expert chat story writer. Create a realistic text message conversation between two people.
    
    Rules:
    1. Target length: approximately ${targetWords} words.
    2. Format: Write each message on a new line.
    3. Start each line with "LEFT: " or "RIGHT: " to indicate the sender.
    4. LEFT = The person being messaged, RIGHT = The main character sending messages.
    5. Style: ${toneStyle}.
    6. Language: ${request.language || 'English'}.
    
    Return ONLY a JSON object with this structure:
    {
      "title": "Story title",
      "script": "LEFT: Hi\\nRIGHT: Hello...",
      "sections": [],
      "estimated_total_duration": ${request.duration_seconds || 60},
      "word_count": 0
    }`
  }
  
  return `You are an expert viral content scriptwriter. Create a ${request.type} script that is ${toneStyle}.
  
  Target length: approximately ${targetWords} words (${request.duration_seconds || 60} seconds when spoken).
  
  Structure requirements:
  ${request.include_hooks ? '- Start with a compelling hook that grabs attention in the first 3 seconds' : ''}
  - Use short, punchy sentences
  - Include natural pauses for emphasis
  - Write for spoken delivery, not reading
  ${request.include_cta ? '- End with a clear call-to-action' : ''}
  
  ${request.language && request.language !== 'en' ? `Write the script in ${request.language}.` : ''}
  
  Return ONLY a JSON object with this exact structure:
  {
    "title": "Brief catchy title",
    "script": "The full script text as one continuous piece",
    "sections": [
      {"type": "hook", "content": "Opening hook text", "estimated_duration": 5},
      {"type": "body", "content": "Main content", "estimated_duration": 40},
      {"type": "outro", "content": "Closing text", "estimated_duration": 10}
    ],
    "estimated_total_duration": 55,
    "word_count": 137
  }`
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: 'Server configuration error' }, 500, corsHeaders)
    }

    const request = requestSchema.parse(await req.json())

    const systemPrompt = buildSystemPrompt(request)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.prompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const completion = await response.json()
    const content = completion.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    const scriptData = JSON.parse(content)
    
    return jsonResponse({
      job_id: `script-${Date.now()}`,
      status: 'completed',
      title: scriptData.title || 'Untitled Script',
      script: scriptData.script || '',
      sections: scriptData.sections || [],
      estimated_total_duration: scriptData.estimated_total_duration || request.duration_seconds || 60,
      word_count: scriptData.word_count || scriptData.script?.split(' ').length || 0,
      credits_used: 1,
    }, 200, corsHeaders)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: 'Invalid request', status: 'failed' }, 400, corsHeaders)
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'Request failed', status: 'failed' }, 400, corsHeaders)
  }
})

