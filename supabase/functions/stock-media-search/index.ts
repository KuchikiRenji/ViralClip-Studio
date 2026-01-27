import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createServiceSupabaseClient, getBearerToken, hasActiveSubscription, paywallPayload, requireAuthenticatedUser } from '../_shared/auth.ts'
import { jsonResponse } from '../_shared/http.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY') || ''
const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY') || ''

const action = 'OPEN_PRICING'
const requestSchema = z.object({
  query: z.string().max(100).optional(),
  type: z.enum(['image', 'video']).optional(),
  orientation: z.enum(['all', 'landscape', 'portrait', 'square']).optional(),
  page: z.number().int().min(1).max(100).optional(),
  per_page: z.number().int().min(1).max(80).optional(),
})

function generateCacheKey(
  provider: string,
  query: string,
  orientation: string | null,
  page: number,
  perPage: number
): string {
  const parts = [provider, query, orientation || 'all', String(page), String(perPage)]
  return parts.join('|')
}

async function getCachedResult(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  cacheKey: string
): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('stock_media_cache')
    .select('payload')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null
  return data.payload
}

async function setCachedResult(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  cacheKey: string,
  provider: string,
  query: string,
  orientation: string | null,
  page: number,
  perPage: number,
  payload: unknown,
  ttlHours = 12
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + ttlHours)

  await supabase.from('stock_media_cache').upsert({
    cache_key: cacheKey,
    provider,
    query,
    orientation,
    page,
    per_page: perPage,
    payload,
    expires_at: expiresAt.toISOString(),
  })
}

async function searchPexelsVideos(
  query: string,
  orientation: string | null,
  page: number,
  perPage: number
): Promise<unknown[]> {
  if (!PEXELS_API_KEY) {
    throw new Error('PEXELS_API_KEY not configured')
  }

  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: String(Math.min(perPage, 80)),
  })

  if (orientation && orientation !== 'all') {
    params.append('orientation', orientation)
  }

  const response = await fetch(`https://api.pexels.com/videos/search?${params}`, {
    headers: {
      'Authorization': PEXELS_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`)
  }

  const data = await response.json()
  return (data.videos || []).map((video: {
    id: number
    width: number
    height: number
    duration: number
    image: string
    video_files: Array<{
      quality: string
      file_type: string
      link: string
      width: number
      height: number
    }>
    video_pictures: Array<{ picture: string }>
  }) => {
    const hdVideo = video.video_files.find(f => f.quality === 'hd' && f.file_type === 'video/mp4')
    const videoLink = hdVideo?.link || video.video_files[0]?.link || ''
    const thumbnail = video.video_pictures[0]?.picture || video.image

    return {
      id: `pexels-${video.id}`,
      type: 'video',
      title: `Video ${video.id}`,
      thumbnail,
      src: videoLink,
      duration: video.duration,
      author: 'Pexels',
      source: 'pexels',
      category: 'nature',
      tags: [],
      orientation: video.width > video.height ? 'landscape' : video.height > video.width ? 'portrait' : 'square',
    }
  })
}

async function searchUnsplashPhotos(
  query: string,
  orientation: string | null,
  page: number,
  perPage: number
): Promise<unknown[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY not configured')
  }

  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: String(Math.min(perPage, 30)),
  })

  if (orientation && orientation !== 'all') {
    params.append('orientation', orientation)
  }

  const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`)
  }

  const data = await response.json()
  return (data.results || []).map((photo: {
    id: string
    width: number
    height: number
    urls: {
      thumb: string
      regular: string
      full: string
    }
    user: {
      name: string
    }
    description: string | null
    tags: Array<{ title: string }>
  }) => ({
    id: `unsplash-${photo.id}`,
    type: 'image',
    title: photo.description || `Photo by ${photo.user.name}`,
    thumbnail: photo.urls.thumb,
    src: photo.urls.regular,
    author: photo.user.name,
    source: 'unsplash',
    category: 'nature',
    tags: photo.tags.map(t => t.title),
    orientation: photo.width > photo.height ? 'landscape' : photo.height > photo.width ? 'portrait' : 'square',
  }))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createServiceSupabaseClient()

  try {
    const token = getBearerToken(req.headers.get('Authorization'))
    if (!token) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const user = await requireAuthenticatedUser(supabase, token)
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const active = await hasActiveSubscription(supabase, user.id)
    if (!active) return jsonResponse(paywallPayload('Active subscription required', action), 402, corsHeaders)

    const parsed = requestSchema.parse(await req.json())
    const query = parsed.query ?? 'abstract'
    const type = parsed.type ?? 'image'
    const orientation = parsed.orientation ?? 'all'
    const pageNum = parsed.page ?? 1
    const rawPerPage = parsed.per_page ?? 15
    const perPageNum = Math.max(1, Math.min(type === 'video' ? 80 : 30, rawPerPage))

    const cacheKey = generateCacheKey(type === 'video' ? 'pexels' : 'unsplash', query, orientation, pageNum, perPageNum)

    const cached = await getCachedResult(supabase, cacheKey)
    if (cached) {
      return jsonResponse(cached, 200, corsHeaders)
    }

    let results: unknown[]
    if (type === 'video') {
      results = await searchPexelsVideos(query, orientation, pageNum, perPageNum)
    } else {
      results = await searchUnsplashPhotos(query, orientation, pageNum, perPageNum)
    }

    const response = {
      results,
      page: pageNum,
      per_page: perPageNum,
      total: results.length,
    }

    await setCachedResult(
      supabase,
      cacheKey,
      type === 'video' ? 'pexels' : 'unsplash',
      query,
      orientation,
      pageNum,
      perPageNum,
      response
    )

    return jsonResponse(response, 200, corsHeaders)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: 'Invalid request' }, 400, corsHeaders)
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'Request failed' }, 400, corsHeaders)
  }
})



