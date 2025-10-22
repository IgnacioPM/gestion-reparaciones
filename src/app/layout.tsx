import { Metadata } from "next"
import Providers from "@/providers"
import "@/styles/globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
    title: "Control Clientes",
    description: "Aplicación de control de clientes",
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
                <Providers>
                    {children}
                    {/* Componente de notificaciones Sonner */}
                    <Toaster
                        richColors
                        position="top-right"
                        closeButton
                        theme="system" // Usa el tema del sistema (oscuro o claro)
                    />
                </Providers>
            </body>
        </html>
    )
}
