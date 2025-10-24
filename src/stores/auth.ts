import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient' // Asegúrate que la ruta a tu cliente supabase sea correcta
import { Session } from '@supabase/supabase-js'

// 1. Definimos los tipos basados en tu esquema
// Deberías generar estos tipos con la CLI de Supabase para que sean exactos
export type Profile = {
  id_usuario: string
  nombre: string
  email: string
  rol: string
  empresa_id: string
  empresa: {
    id: string
    nombre: string
    logo_url: string | null
    direccion: string | null
    telefono: string | null
    slogan: string | null
    pie_pagina: string | null
  } | null
}

type AuthState = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,
  error: null, // <-- inicializamos en null

  login: async (email, password) => {
    set({ loading: true, error: null }) // <-- reseteamos error al iniciar
    try {
      // 1. Autenticar al usuario
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (!authData.user) throw new Error('No se encontró el usuario')

      // 2. Obtener el perfil y la empresa desde tu tabla 'usuarios'
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select(`*, empresa:empresas(*)`)
        .eq('auth_uid', authData.user.id)
        .maybeSingle()

      if (profileError) throw profileError
      if (!profileData)
        throw new Error(
          'No se encontró el perfil del usuario' + authData.user.id
        )

      // 3. Actualizar el estado global con toda la información
      set({
        session: authData.session,
        profile: profileData,
        loading: false,
        error: null,
      })
    } catch (err: unknown) {
      // Inicializamos mensaje por defecto
      let errorMessage = 'Ocurrió un error desconocido'

      if (err instanceof Error) {
        // Si es instancia de Error, usamos su message
        errorMessage = err.message
      } else if (err && typeof err === 'object') {
        // Intentamos mapear propiedades comunes de errores de Supabase
        const e = err as {
          message?: string
          details?: string
          error?: string
          description?: string
        }
        errorMessage =
          e.message ||
          e.details ||
          (e.error && e.description
            ? `${e.error}: ${e.description}`
            : undefined) ||
          errorMessage
      }

      // Logueamos en consola
      console.error('Error en login:', errorMessage)
      // Guardamos en el estado para que la UI lo pueda mostrar
      set({ loading: false, error: errorMessage })
      // Lanzamos error para que el caller lo pueda manejar si quiere
      throw new Error(errorMessage)
    }
  },

  logout: async () => {
    set({ loading: true, error: null })
    await supabase.auth.signOut()
    set({ session: null, profile: null, loading: false })
  },

  checkSession: async () => {
    const { data: authData } = await supabase.auth.getSession()
    if (authData.session) {
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select(`*, empresa:empresas(*)`)
        .eq('auth_uid', authData.session.user.id)
        .maybeSingle()

      if (profileError) {
        console.error("Error fetching profile in checkSession:", profileError.message)
      } else if (profileData) {
        set({ session: authData.session, profile: profileData })
      }
    }
    set({ loading: false })
  },
}))
