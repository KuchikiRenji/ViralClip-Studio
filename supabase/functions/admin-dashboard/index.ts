import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    let section = 'overview'
    let userId = null
    let days = 30

    if (req.method === 'POST') {
        try {
            const body = await req.json()
            section = body.section || section
            userId = body.user_id || userId
            days = body.days ? parseInt(String(body.days)) : days
        } catch {
        }
    } else {
        const url = new URL(req.url)
        section = url.searchParams.get('section') || section
        userId = url.searchParams.get('user_id')
        days = parseInt(url.searchParams.get('days') || '30')
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let response: Record<string, unknown> = {}

    const { data: costRates } = await supabase.from('cost_rates').select('*')
    const ratesMap = costRates?.reduce((acc, rate) => {
        acc[rate.job_type] = rate.unit_cost
        return acc
    }, {} as Record<string, number>) || {}

    if (section === 'overview' || section === 'all') {
      const { count: totalUsers } = await supabase.from('users_profile').select('*', { count: 'exact', head: true })
      const { count: totalPurchases } = await supabase.from('purchases').select('*', { count: 'exact', head: true })
      
      const { data: revenueData } = await supabase.from('purchases').select('amount_cents').eq('status', 'COMPLETED')
      const totalRevenueCents = revenueData?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0
      
      const { data: creditsData } = await supabase.from('user_credits').select('balance, lifetime_spent')
      const totalCreditsActive = creditsData?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0
      const totalCreditsUsed = creditsData?.reduce((sum, c) => sum + (c.lifetime_spent || 0), 0) || 0
      
      const { count: pageViews } = await supabase.from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_name', 'page_view')
        .gte('created_at', startDate.toISOString())

      response.overview = {
        totalUsers,
        totalPayments: totalPurchases,
        totalRevenueCents,
        totalRevenueCAD: (totalRevenueCents / 100).toFixed(2),
        totalCreditsActive,
        totalCreditsUsed,
        pageViews,
        period: `Last ${days} days`
      }
    }

    if (section === 'costs' || section === 'all') {
      const { data: jobs } = await supabase
        .from('processing_jobs')
        .select('type, status, credits_charged, created_at')
        .gte('created_at', startDate.toISOString())
      
      const costsByType = jobs?.reduce((acc, j) => {
        acc[j.type] = acc[j.type] || { count: 0, credits: 0 }
        acc[j.type].count++
        acc[j.type].credits += j.credits_charged || 0
        return acc
      }, {} as Record<string, { count: number; credits: number }>)

      const estimatedCostsUSD = Object.entries(costsByType || {}).reduce((acc, [type, data]) => {
        const rate = ratesMap[type] || 0
        acc[type] = {
          ...data,
          estimatedCostUSD: (data.count * rate).toFixed(2)
        }
        return acc
      }, {} as Record<string, unknown>)
      
      response.costs = {
        byJobType: estimatedCostsUSD,
        totalJobs: jobs?.length || 0,
        period: `Last ${days} days`,
        note: 'Costs calculated from cost_rates table'
      }
    }

    return new Response(JSON.stringify(response), {
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

