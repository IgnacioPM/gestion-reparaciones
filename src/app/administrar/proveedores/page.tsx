'use client'

import ProveedoresTable from '@/components/proveedores/ProveedoresTable'
import Navbar from '@/components/ui/Navbar'
import SectionTitle from '@/components/ui/SectionTitle'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Proveedores() {
  const router = useRouter()

  return (
    <>
      <Navbar />

      <main className='container mx-auto px-4 py-8'>
        {/* HEADER */}
        <div className='flex justify-between items-center mb-6'>
          <SectionTitle>Administración de Proveedores</SectionTitle>

          <button
            onClick={() => router.push('/administrar')}
            className='flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
            Regresar
          </button>
        </div>

        {/* CONTENIDO */}
        <div>
          <ProveedoresTable />
        </div>
      </main>
    </>
  )
}
