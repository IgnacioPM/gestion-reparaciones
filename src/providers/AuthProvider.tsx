"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth"
import { supabase } from "@/lib/supabaseClient"

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useAuthStore()

    useEffect(() => {
        setLoading(true);

        const deviceId = window.navigator.userAgent + window.navigator.platform;
        const savedDeviceId = localStorage.getItem("deviceId");

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);

                // Si no hay sesión, limpiar deviceId y redirigir a login (sin signOut para evitar bucle)
                if (!session?.user) {
                    localStorage.removeItem("deviceId");
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    return;
                }

                // Si hay sesión y el deviceId guardado es diferente, cerrar sesión
                if (session?.user && savedDeviceId && savedDeviceId !== deviceId) {
                    await supabase.auth.signOut();
                    localStorage.removeItem("deviceId");
                    window.location.href = '/login';
                    return;
                }

                // Si no hay deviceId guardado y hay sesión, guardar el actual
                if (session?.user && !savedDeviceId) {
                    localStorage.setItem("deviceId", deviceId);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        // Escuchar cambios en la autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null);
                if (event === 'SIGNED_OUT') {
                    localStorage.removeItem("deviceId");
                    window.location.href = '/login';
                }
                // Si se inicia sesión en este dispositivo, guardar deviceId
                if (event === 'SIGNED_IN' && session?.user) {
                    localStorage.setItem("deviceId", deviceId);
                }
            }
        );

        initializeAuth();

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser, setLoading]);

    return <>{children}</>
}
