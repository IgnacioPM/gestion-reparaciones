"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { ThemeProvider } from "next-themes"
import { useState } from "react"
import { AuthProvider } from "./AuthProvider"

export default function Providers({
    children,
}: {
    children: React.ReactNode
}) {
    const [supabase] = useState(() => createClientComponentClient())

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={true}
            storageKey="control-clientes-theme"
        >
            <SessionContextProvider supabaseClient={supabase}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </SessionContextProvider>
        </ThemeProvider>
    )
}
