import { useEffect } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore()

  useEffect(() => {
    if (isDemoMode) {
      setUser({
        id: 'demo-user',
        email: 'demo@example.com',
        full_name: 'デモユーザー',
        role: 'admin',
        company_id: '1',
        created_at: '',
        updated_at: '',
      } as User)
      setLoading(false)
      return
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
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
        // Not authenticated
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
