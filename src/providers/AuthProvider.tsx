'use client'

import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabaseClient'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkSession, loading } = useAuthStore()
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
      // Si cierra sesión en otra pestaña
      if ((event === 'SIGNED_OUT' || !session) && pathname !== '/login') {
        router.push('/login')
      }
      // Refresca datos del perfil si hay sesión
      checkSession()
    })

    return () => subscription.unsubscribe()
  }, [checkSession, router, pathname])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return <>{children}</>
}
