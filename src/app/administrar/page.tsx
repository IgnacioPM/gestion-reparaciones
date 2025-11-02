import Link from 'next/link'
import { Building, Users, MessageSquare, BarChart2 } from 'lucide-react'
import SectionTitle from '@/components/ui/SectionTitle'

const adminActions = [
  {
    title: 'Datos de la empresa',
    description: 'Edita la información de tu empresa.',
    href: '/empresa',
    icon: <Building className="w-8 h-8 text-blue-500" />,
  },
  {
    title: 'Personal de la empresa',
    description: 'Gestiona los usuarios y sus roles.',
    href: '/empleados',
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
]

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle>Panel de Administración</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
    </div>
  )
}
