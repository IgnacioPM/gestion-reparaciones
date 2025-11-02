'use client'

import SectionTitle from '@/components/ui/SectionTitle'
import Navbar from '@/components/ui/Navbar'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function WhatsappMessagesPage() {
  const router = useRouter()

  return (
    <>
      <Navbar />
      <main className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <SectionTitle>Administrar Mensajes de WhatsApp</SectionTitle>
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
            Esta sección está en desarrollo. Próximamente podrás configurar y
            personalizar los mensajes automáticos de WhatsApp que se envían a tus
            clientes.
          </p>
        </div>
      </main>
    </>
  )
}
