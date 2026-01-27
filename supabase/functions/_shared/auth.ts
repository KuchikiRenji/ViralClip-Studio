import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type PaywallErrorPayload = {
  error: {
    code: 'PAYWALL_REQUIRED'
    message: string
    action: string
  }
}

export const createServiceSupabaseClient = () =>
  createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

export const getBearerToken = (authHeader: string | null): string | null => {
  if (!authHeader) return null
  const prefix = 'Bearer '
  if (!authHeader.startsWith(prefix)) return null
  const token = authHeader.slice(prefix.length).trim()
  return token ? token : null
}

export const requireAuthenticatedUser = async (
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  token: string
) => {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return error || !user ? null : user
}

export const isAdmin = async (
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  userId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from('users_profile')
    .select('is_admin')
    .eq('id', userId)
    .single()
  return data?.is_admin === true
}

export const hasActiveSubscription = async (
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  userId: string
): Promise<boolean> => {
  const adminCheck = await isAdmin(supabase, userId)
  if (adminCheck) return true

  const { data } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  return Boolean(data?.id)
}

export const paywallPayload = (message: string, action: string): PaywallErrorPayload => ({
  error: { code: 'PAYWALL_REQUIRED', message, action }
})





