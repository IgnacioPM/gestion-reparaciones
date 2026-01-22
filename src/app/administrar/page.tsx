'use client'

import Link from 'next/link'
import { Building, Users, MessageSquare, BarChart2, ArrowLeft, Cpu } from 'lucide-react'
import SectionTitle from '@/components/ui/SectionTitle'
import Navbar from '@/components/ui/Navbar'
import { useRouter } from 'next/navigation'

const adminActions = [
  {
    title: 'Datos de la empresa',
    description: 'Edita la información de tu empresa.',
    href: '/administrar/empresa',
    icon: <Building className="w-8 h-8 text-blue-500" />,
  },
  {
    title: 'Personal de la empresa',
    description: 'Gestiona los usuarios y sus roles.',
    href: '/administrar/personal',
    icon: <Users className="w-8 h-8 text-green-500" />,
  },
  {
    title: 'Administrar mensajes de Whatsapp',
    description: 'Configura y personaliza los mensajes automáticos.',
    href: '/administrar/mensajes-whatsapp',
    icon: <MessageSquare className="w-8 h-8 text-teal-500" />,
  },
  {
    title: 'Reportes y Estadísticas',
    description: 'Visualiza el rendimiento y las métricas de tu negocio.',
    href: '/administrar/reportes',
    icon: <BarChart2 className="w-8 h-8 text-purple-500" />,
  },
  {
    title: 'Dispositivos y Marcas',
    description: 'Gestiona los tipos de dispositivos y las marcas de equipos.',
    href: '/administrar/dispositivos',
    icon: <Cpu className="w-8 h-8 text-orange-500" />,
  },
]

export default function AdminPage() {
  const router = useRouter()

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <SectionTitle>Panel de Administración</SectionTitle>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Regresar al inicio
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map((action) => (
            <Link href={action.href} key={action.title}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                <div className="p-3 mb-4 rounded-full bg-gray-100 dark:bg-gray-700">
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
