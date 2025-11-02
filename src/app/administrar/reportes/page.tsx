'use client'

import SectionTitle from '@/components/ui/SectionTitle'
import Navbar from '@/components/ui/Navbar'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function ReportsPage() {
  const router = useRouter()

  return (
    <>
      <Navbar />
      <main className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <SectionTitle>Reportes y Estadísticas</SectionTitle>
          <button
            onClick={() => router.push('/administrar')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Regresar al panel
          </button>
        </div>
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-gray-600 dark:text-gray-300">
            Esta sección está en desarrollo. Próximamente podrás visualizar
            reportes y estadísticas sobre el rendimiento de tu negocio.
          </p>
        </div>
      </main>
    </>
  )
}
