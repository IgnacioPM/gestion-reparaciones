'use client' // Necesario para usar el store

import Navbar from "@/components/ui/Navbar"
import ServiciosTable from "@/components/servicios/ServiciosTable"
import { useAuthStore } from "@/stores/auth" // Importar el store

// Componente para mostrar datos de depuración
function DebugInfo() {
    const { profile } = useAuthStore()

    if (!profile) {
        return (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg my-4">
                <p className="font-bold">No hay sesión activa</p>
                <p>Inicia sesión para ver la información de depuración.</p>
            </div>
        )
    }

    // Creamos un objeto con la información que queremos mostrar
    const debugData = {
        user: {
            nombre: profile.nombre,
            email: profile.email,
            rol: profile.rol,
        },
        empresa: {
            id: profile.empresa_id,
            nombre: profile.empresa?.nombre,
        },
        raw_profile: profile, // Muestra el objeto de perfil completo
    }

    return (
        <div className="bg-gray-800 dark:bg-gray-950 text-white p-4 rounded-lg my-4 text-xs shadow-lg">
            <h2 className="text-lg font-bold mb-2 text-green-400">Información de Sesión (Debug)</h2>
            <pre>{JSON.stringify(debugData, null, 2)}</pre>
        </div>
    )
}


export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <DebugInfo /> {/* Componente de depuración agregado aquí */}
                    <ServiciosTable />
                </div>
            </main>
        </div>
    )
}
