'use client'

import Navbar from '@/components/ui/Navbar'
import { ArrowLeft } from 'lucide-react'
import SectionTitle from '@/components/ui/SectionTitle'
import { useRouter } from 'next/navigation'
import ObservacionesRapidasTable from '@/components/reparaciones/ObservacionesRapidasTable'

export default function ObservacionesRapidasPage () {
  const router = useRouter()

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <SectionTitle>Administrar Observaciones Rápidas</SectionTitle>
          <button
            onClick={() => router.push('/administrar')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Regresar
          </button>
        </div>
        <ObservacionesRapidasTable />
      </main>
    </>
  )
}
