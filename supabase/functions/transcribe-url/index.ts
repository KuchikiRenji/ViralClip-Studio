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
  url: z.string().url(),
  language: z.string().optional(),
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: 'Server configuration error: OPENAI_API_KEY not set' }, 500, corsHeaders)
    }

    const parsed = requestSchema.parse(await req.json())
    const { url, language } = parsed

    const mediaUrl = await resolveMediaUrl(url)
    if (!mediaUrl) {
      return jsonResponse({ error: 'Could not resolve media URL. Ensure the link is a valid video/audio URL.' }, 400, corsHeaders)
    }

    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!mediaResponse.ok) {
      return jsonResponse({ error: `Failed to download media: ${mediaResponse.status}` }, 400, corsHeaders)
    }

    const contentLength = mediaResponse.headers.get('content-length')
    const sizeInMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0

    if (sizeInMB > 25) {
      return jsonResponse({ 
        error: `File too large (${sizeInMB.toFixed(1)}MB). OpenAI Whisper limit is 25MB. Please use a shorter video or download and compress locally.` 
      }, 400, corsHeaders)
    }

    const blob = await mediaResponse.blob()
    const contentType = mediaResponse.headers.get('content-type') || 'audio/mpeg'
    const extension = getExtension(contentType, url)

    const formData = new FormData()
    formData.append('file', new File([blob], `audio.${extension}`, { type: contentType }))
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    if (language) {
      formData.append('language', language)
    }

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    })

    const transcription = await whisperResponse.json()

    if (!whisperResponse.ok) {
      return jsonResponse({ 
        error: transcription.error?.message || 'Transcription failed' 
      }, whisperResponse.status, corsHeaders)
    }

    return jsonResponse(transcription, 200, corsHeaders)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: 'Invalid request: provide a valid URL' }, 400, corsHeaders)
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'Request failed' }, 400, corsHeaders)
  }
})

async function resolveMediaUrl(url: string): Promise<string | null> {
  if (isDirectMediaUrl(url)) {
    return url
  }
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return await resolveYouTubeUrl(url)
  }
  
  if (url.includes('tiktok.com')) {
    return await resolveTikTokUrl(url)
  }
  
  if (url.includes('instagram.com')) {
    return await resolveInstagramUrl(url)
  }

  return url
}

function isDirectMediaUrl(url: string): boolean {
  const mediaExtensions = ['.mp3', '.mp4', '.wav', '.m4a', '.webm', '.ogg', '.flac', '.aac']
  const lowerUrl = url.toLowerCase()
  return mediaExtensions.some(ext => lowerUrl.includes(ext))
}

async function resolveYouTubeUrl(url: string): Promise<string | null> {
  const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN')
  if (!APIFY_TOKEN) return null

  try {
    const videoId = extractYouTubeId(url)
    if (!videoId) return null

    const runResponse = await fetch(
      'https://api.apify.com/v2/acts/bernardo~youtube-audio-downloader/runs?waitForFinish=120',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIFY_TOKEN}`
        },
        body: JSON.stringify({
          videoUrls: [`https://www.youtube.com/watch?v=${videoId}`],
          format: 'mp3',
          quality: '128'
        })
      }
    )

    if (!runResponse.ok) return null
    const runData = await runResponse.json()
    const datasetId = runData.data?.defaultDatasetId
    if (!datasetId) return null

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      {
        headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
      }
    )

    if (!datasetResponse.ok) return null
    const items = await datasetResponse.json()
    return items[0]?.audioUrl || null

  } catch {
    return null
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/,
    /youtube\.com\/embed\/([^&\s?]+)/,
    /youtube\.com\/v\/([^&\s?]+)/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

async function resolveTikTokUrl(url: string): Promise<string | null> {
  const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN')
  if (!APIFY_TOKEN) return null

  try {
    const runResponse = await fetch(
      'https://api.apify.com/v2/acts/clockworks~tiktok-scraper/runs?waitForFinish=120',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIFY_TOKEN}`
        },
        body: JSON.stringify({
          postURLs: [url],
          resultsPerPage: 1
        })
      }
    )

    if (!runResponse.ok) return null
    const runData = await runResponse.json()
    const datasetId = runData.data?.defaultDatasetId
    if (!datasetId) return null

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      {
        headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
      }
    )

    if (!datasetResponse.ok) return null
    const items = await datasetResponse.json()
    return items[0]?.videoUrl || items[0]?.musicPlayUrl || null

  } catch {
    return null
  }
}

async function resolveInstagramUrl(url: string): Promise<string | null> {
  const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN')
  if (!APIFY_TOKEN) return null

  try {
    const runResponse = await fetch(
      'https://api.apify.com/v2/acts/apify~instagram-reel-scraper/runs?waitForFinish=120',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIFY_TOKEN}`
        },
        body: JSON.stringify({
          directUrls: [url],
          resultsLimit: 1
        })
      }
    )

    if (!runResponse.ok) return null
    const runData = await runResponse.json()
    const datasetId = runData.data?.defaultDatasetId
    if (!datasetId) return null

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      {
        headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
      }
    )

    if (!datasetResponse.ok) return null
    const items = await datasetResponse.json()
    return items[0]?.videoUrl || null

  } catch {
    return null
  }
}

function getExtension(contentType: string, url: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
    'audio/aac': 'aac',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  }

  if (mimeToExt[contentType]) {
    return mimeToExt[contentType]
  }

  const urlMatch = url.match(/\.(\w{2,4})(?:\?|$)/)
  if (urlMatch) {
    return urlMatch[1]
  }

  return 'mp3'
}

