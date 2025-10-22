// src/stores/auth.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'

// --- TIPOS ---
export type UsuarioProfile = {
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

// --- STORE ---
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      // 1️⃣ Autenticar usuario
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (!authData.user) throw new Error('No se encontró el usuario')

      // 2️⃣ Obtener perfil y empresa
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select(`*, empresa:empresas(*)`)
        .eq('auth_uid', authData.user.id)
        .maybeSingle()

      if (profileError) throw profileError
      if (!profileData) throw new Error('No se encontró el perfil del usuario')

      // 3️⃣ Guardar en estado global
      set({
        session: authData.session,
        profile: profileData,
        loading: false,
        error: null,
      })
    } catch (err: unknown) {
      // ✅ Manejo seguro del error sin usar 'any'
      let errorMessage = 'Ocurrió un error desconocido'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err && typeof err === 'object') {
        // intentar mapear propiedades comunes de Supabase
        const e = err as { message?: string; details?: string; error?: string; description?: string }
        errorMessage =
          e.message ||
          e.details ||
          (e.error && e.description ? `${e.error}: ${e.description}` : undefined) ||
          errorMessage
      }

      console.error('Error en login:', errorMessage)
      set({ loading: false, error: errorMessage })
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
      const { data: profileData } = await supabase
        .from('usuarios')
        .select(`*, empresa:empresas(*)`)
        .eq('auth_uid', authData.session.user.id)
        .maybeSingle()

      if (profileData) {
        set({ session: authData.session, profile: profileData })
      }
    }
    set({ loading: false })
  },
}))
