import { useEffect } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore()

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false)
      return
    }

    const checkSession = async () => {
      try {
        // Add timeout to prevent infinite loading if Supabase is unreachable
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session check timed out')), 5000)
        )
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (data) setUser(data as User)
          else setUser({ id: session.user.id, email: session.user.email || '', full_name: session.user.email || '', role: 'staff', company_id: '', created_at: '', updated_at: '' })
        }
      } catch {
        // Not authenticated or timed out
      } finally {
        setLoading(false)
      }
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single()
        if (data) setUser(data as User)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setLoading])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    logout()
  }

  return { user, isAuthenticated, isLoading, signIn, signOut }
}
