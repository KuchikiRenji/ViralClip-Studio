import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const SQUARE_LOCATION_ID = Deno.env.get('SQUARE_LOCATION_ID')
    const SQUARE_API_URL = Deno.env.get('SQUARE_API_URL')
    const SITE_URL = Deno.env.get('SITE_URL')

    const config = {
      hasAccessToken: !!SQUARE_ACCESS_TOKEN,
      tokenPrefix: SQUARE_ACCESS_TOKEN ? SQUARE_ACCESS_TOKEN.substring(0, 10) + '...' : 'NOT_SET',
      tokenLength: SQUARE_ACCESS_TOKEN ? SQUARE_ACCESS_TOKEN.length : 0,
      hasLocationId: !!SQUARE_LOCATION_ID,
      locationId: SQUARE_LOCATION_ID || 'NOT_SET',
      apiUrl: SQUARE_API_URL || 'NOT_SET',
      siteUrl: SITE_URL || 'NOT_SET',
    }

    console.log('Configuration check:', config)

    return new Response(JSON.stringify(config, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})







