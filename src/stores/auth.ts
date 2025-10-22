import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient' // Asegúrate que la ruta a tu cliente supabase sea correcta
import { Session, User } from '@supabase/supabase-js'

// 1. Definimos los tipos basados en tu esquema
// Deberías generar estos tipos con la CLI de Supabase para que sean exactos
type UsuarioProfile = {
  id_usuario: string
  nombre: string
  email: string
  rol: string
  empresa_id: string
  empresa: {
    id: string
    nombre: string
    // ...otros campos de empresa
  } | null
}

type AuthState = {
  session: Session | null
  profile: UsuarioProfile | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error en login:', error.message)
      } else {
        console.error('Error en login desconocido:', error)
      }
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
        .single()

      if (profileData) {
        set({ session: authData.session, profile: profileData })
      }
    }
    set({ loading: false })
  },
}))
