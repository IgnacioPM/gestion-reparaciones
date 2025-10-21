'use client'

import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabaseClient'
import { useEffect } from 'react'

/**
 * Este componente se encarga de:
 * 1. Verificar si existe una sesión de usuario cuando la app carga.
 * 2. Mantener el estado de autenticación sincronizado si el usuario
 *    inicia o cierra sesión en otra pestaña.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkSession, loading } = useAuthStore()

  useEffect(() => {
    // Al montar el componente, verificamos la sesión del usuario.
    // Esta función obtiene la sesión Y el perfil de la base de datos.
    checkSession()

    // Creamos un listener para los cambios en el estado de autenticación.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Cuando el estado cambia, volvemos a llamar a checkSession
      // para recargar los datos del perfil o limpiar el estado.
      checkSession()
    })

    // Al desmontar el componente, nos desuscribimos del listener.
    return () => {
      subscription.unsubscribe()
    }
  }, [checkSession])

  // Mientras se verifica la sesión por primera vez, mostramos un loader.
  // Esto previene que se muestren páginas protegidas brevemente.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {/* Aquí puedes agregar tu componente Spinner o Logo */}
        <p>Cargando...</p>
      </div>
    )
  }

  return <>{children}</>
}