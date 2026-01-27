import { createClient } from '@supabase/supabase-js'

const readArg = (name) => {
  const key = `--${name}`
  const index = process.argv.indexOf(key)
  if (index === -1) return null
  const value = process.argv[index + 1]
  return value && !value.startsWith('--') ? value : null
}

const requireArg = (name) => {
  const value = readArg(name)
  if (!value) throw new Error(`Missing --${name}`)
  return value
}

const supabaseUrl = readArg('supabase-url') ?? process.env.SUPABASE_URL ?? null
const supabaseAnonKey = readArg('supabase-anon-key')
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null

if (!supabaseUrl) throw new Error('Missing --supabase-url or SUPABASE_URL')
if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const userJwt = requireArg('user-jwt')
const packId = requireArg('pack-id')
const nonce = requireArg('nonce')

const paymentResponse = await fetch(`${supabaseUrl}/functions/v1/square-create-payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userJwt}`,
    ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
  },
  body: JSON.stringify({ pack_id: packId, nonce }),
})

const paymentPayload = await paymentResponse.json().catch(() => ({}))
if (!paymentResponse.ok) {
  throw new Error(typeof paymentPayload?.error === 'string' ? paymentPayload.error : `square-create-payment failed (${paymentResponse.status})`)
}

if (!paymentPayload?.purchase_id) {
  throw new Error('square-create-payment response missing purchase_id')
}

const admin = createClient(supabaseUrl, serviceRoleKey)
const { data: events, error } = await admin
  .from('email_events')
  .select('id, purchase_id, status, error_message, sent_at, created_at')
  .eq('purchase_id', paymentPayload.purchase_id)
  .order('created_at', { ascending: false })
  .limit(5)

if (error) throw new Error(error.message)
if (!events || events.length === 0) throw new Error('No email_events rows found for purchase_id')

const latest = events[0]
process.stdout.write(JSON.stringify({ purchase_id: paymentPayload.purchase_id, latest_email_event: latest }, null, 2))


