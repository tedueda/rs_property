import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isDemoMode = !supabaseUrl || !supabaseAnonKey

export const supabase: SupabaseClient = isDemoMode
  ? (null as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
        // Disable navigator.locks to prevent deadlocks in certain environments
        // Provide a no-op lock function that immediately executes the callback
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => {
          return await fn()
        },
      },
    })
