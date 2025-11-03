'use client' // Necesario para usar el store

import Navbar from "@/components/ui/Navbar"
import ServiciosTable from "@/components/reparaciones/ServiciosTable"

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <ServiciosTable />
                </div>
            </main>
        </div>
    )
}
