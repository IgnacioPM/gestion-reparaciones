import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'

type UsuarioProfile = {
  id_usuario: string
  nombre: string
  email: string
  rol: string
  empresa_id: string
  empresa: {
    id: string
    nombre: string
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

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (!authData.user) throw new Error('No se encontró el usuario')

      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select(`*, empresa:empresas(*)`)
        .eq('auth_uid', authData.user.id)
        .maybeSingle()

      if (profileError) throw profileError
      if (!profileData)
        throw new Error(
          'No se encontró el perfil del usuario ' + authData.user.id
        )

      set({
        session: authData.session,
        profile: profileData,
        loading: false,
        error: null,
      })
    } catch (error: unknown) {
      let message = 'Error desconocido en login'
      if (error instanceof Error) message = error.message
      console.error('Error en login:', message)
      set({ loading: false, error: message })
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
      const { data: profileData } = await supabase
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
