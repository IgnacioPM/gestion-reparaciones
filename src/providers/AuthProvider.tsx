"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth"
import { supabase } from "@/lib/supabaseClient"

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useAuthStore()

    useEffect(() => {
        // Set loading true at the start
        setLoading(true)

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user ?? null)
            } catch (error) {
                console.error('Error initializing auth:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        // Escuchar cambios en la autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)
                if (event === 'SIGNED_OUT') {
                    window.location.href = '/login'
                }
            }
        )

        initializeAuth()

        return () => {
            subscription.unsubscribe()
        }
    }, [setUser, setLoading])

    return <>{children}</>
}
