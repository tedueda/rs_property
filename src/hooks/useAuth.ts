import { useEffect } from 'react'
import type { User as AuthUser } from '@supabase/supabase-js'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'

const AUTH_TIMEOUT_MS = 10_000

function fallbackUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    email: authUser.email || '',
    full_name: authUser.email || '',
    role: 'staff',
    company_id: '',
    created_at: '',
    updated_at: '',
  }
}

async function fetchUser(authUser: AuthUser): Promise<User> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()
  return data ? data as User : fallbackUser(authUser)
}

async function withTimeout<T>(operation: PromiseLike<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Authentication timed out')), milliseconds)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function useAuthInitializer() {
  const { setUser, setLoading } = useAuthStore()

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

    let active = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 5000)
        const user = session?.user ? await fetchUser(session.user) : null
        if (active) setUser(user)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    void checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION') return
      if (!session?.user) {
        setUser(null)
        return
      }

      const authUser = session.user
      if (useAuthStore.getState().user?.id !== authUser.id) setUser(fallbackUser(authUser))
      setTimeout(() => {
        void fetchUser(authUser).then((user) => {
          if (active && useAuthStore.getState().user?.id === authUser.id) setUser(user)
        })
      }, 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore()

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) return { error: null }
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_TIMEOUT_MS,
      )
      return { error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Authentication failed') }
    }
  }

  const signOut = async () => {
    try {
      if (!isDemoMode) await withTimeout(supabase.auth.signOut(), AUTH_TIMEOUT_MS)
    } finally {
      logout()
    }
  }

  return { user, isAuthenticated, isLoading, signIn, signOut }
}
