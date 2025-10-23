'use client'

import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabaseClient'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkSession, loading, profile } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const verifySession = async () => {
      try {
        await checkSession()
      } catch (error: unknown) {
        let message
        if (error instanceof Error) {
          message = error.message
        } else if (error && typeof error === 'object' && 'message' in error) {
          message = String((error as { message: unknown }).message)
        }

        if (message?.includes('Invalid Refresh Token')) {
          await supabase.auth.signOut()
          if (pathname !== '/login') {
            router.push('/login')
          }
        }
      }
    }

    verifySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_OUT' || !session) && pathname !== '/login') {
        useAuthStore.setState({ session: null, profile: null })
        router.push('/login')
      } else {
        checkSession()
      }
    })

    return () => subscription.unsubscribe()
  }, [checkSession, router, pathname])

  useEffect(() => {
    if (loading) return // Espera a que la sesión se verifique

    const isAuthPage = pathname === '/login'

    // Si no hay perfil y no estamos en la página de login, redirige a login
    if (!profile && !isAuthPage) {
      router.push('/login')
    }

    // Si hay perfil y estamos en la página de login, redirige al inicio
    if (profile && isAuthPage) {
      router.push('/')
    }
  }, [loading, profile, pathname, router])

  // Muestra el loader solo si la sesión se está verificando y no hay perfil
  // O si estamos en una página protegida sin perfil
  if (loading || (!profile && pathname !== '/login')) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return <>{children}</>
}
