'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import SectionTitle from '@/components/ui/SectionTitle'
import { ArrowLeft } from 'lucide-react'
import ProductosTable from '@/components/productos/ProductosTable'

export default function ProductosAdminPage() {
  const router = useRouter()

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <SectionTitle>Administrar Productos</SectionTitle>
          <button
            onClick={() => router.push('/administrar')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Regresar
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <ProductosTable />
        </div>
      </main>
    </>
  )
}
