'use client'

import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { ServicioConNombres } from '@/types/servicio' // Ajusta la ruta si es necesario

interface ReportesTableProps {
  servicios: ServicioConNombres[]
  loading: boolean
}

export default function ReportesTable({ servicios, loading }: ReportesTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Recibido':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'En revisión':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'En reparacion':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'Listo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'Entregado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'Anulado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow mt-6'>
      <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
        <thead className='bg-gray-50 dark:bg-gray-700'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Dispositivo
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Problema
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Estado
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Fecha
            </th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Costo Est.
            </th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Costo Final
            </th>
          </tr>
        </thead>
        <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
          {loading ? (
            Array(5)
              .fill(0)
              .map((_, index) => (
                <tr key={index} className='animate-pulse'>
                  {Array(6)
                    .fill(0)
                    .map((_, cellIndex) => (
                      <td key={cellIndex} className='px-6 py-4 whitespace-nowrap'>
                        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'></div>
                      </td>
                    ))}
                </tr>
              ))
          ) : servicios.length === 0 ? (
            <tr>
              <td colSpan={6} className='px-6 py-10 text-center text-gray-500 dark:text-gray-400'>
                No hay servicios que coincidan con los filtros aplicados.
              </td>
            </tr>
          ) : (
            servicios.map((servicio, index) => (
              <tr key={index} className='hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900 dark:text-white'>
                    {servicio.equipo?.tipos_dispositivo?.nombre || 'N/A'}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    {servicio.equipo?.marcas?.nombre || 'N/A'}
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <div className='text-sm text-gray-900 dark:text-white line-clamp-2'>
                    {servicio.descripcion_falla || 'N/A'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(
                      servicio.estado || 'Recibido'
                    )}`}
                  >
                    {servicio.estado || 'Recibido'}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                  {formatDate(servicio.fecha_ingreso)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right'>
                  <FormattedAmount amount={servicio.costo_estimado} />
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right'>
                  <FormattedAmount amount={servicio.costo_final} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
