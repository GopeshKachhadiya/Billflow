import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY  // service_role key — admin only

if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY is missing. Please configure your .env file.')
}

const client = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: true, persistSession: true }
})
client.isSandbox = false

export const supabase = client
