'use client'

import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { MensajeWhatsapp } from '@/types/mensaje_whatsapp'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import MensajeWhatsappEditModal from './MensajeWhatsappEditModal'

export default function MensajesWhatsappTable() {
  const { profile } = useAuthStore()
  const [mensajes, setMensajes] = useState<MensajeWhatsapp[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMensaje, setSelectedMensaje] = useState<MensajeWhatsapp | null>(null)

  const fetchMensajes = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = profile?.empresa_id
      if (!empresaId) {
        setMensajes([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('mensajes_whatsapp')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('tipo', { ascending: true })

      if (error) throw error

      if (data) {
        setMensajes(data)
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  const handleViewMensaje = (mensaje: MensajeWhatsapp) => {
    setSelectedMensaje(mensaje)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedMensaje(null)
  }

  const handleSaveMensaje = async (data: Partial<MensajeWhatsapp>) => {
    setIsSubmitting(true)
    try {
      if (!selectedMensaje) return

      const { error } = await supabase
        .from('mensajes_whatsapp')
        .update(data)
        .eq('id', selectedMensaje.id)

      if (error) throw error
      toast.success('Mensaje actualizado correctamente')
      fetchMensajes()
      handleCloseModal()
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Ocurrió un error')
      } else {
        toast.error('Ocurrió un error desconocido')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (profile) {
      fetchMensajes()
    }
  }, [profile, fetchMensajes])

  return (
    <div className='w-full'>
      <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
              >
                Tipo
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
              >
                Asunto
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
              >
                Plantilla
              </th>
            </tr>
          </thead>
          <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, index) => (
                  <tr key={index} className='animate-pulse'>
                    <td className='px-6 py-4'>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'></div>
                    </td>
                  </tr>
                ))
            ) : mensajes.length === 0 ? (
              <tr>
                <td colSpan={3} className='px-6 py-10 text-center text-gray-500 dark:text-gray-400'>
                  No hay mensajes configurados
                </td>
              </tr>
            ) : (
              mensajes.map((mensaje) => (
                <tr
                  key={mensaje.id}
                  className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                  onClick={() => handleViewMensaje(mensaje)}
                >
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                    {mensaje.tipo}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {mensaje.asunto}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                    {mensaje.plantilla}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedMensaje && (
        <MensajeWhatsappEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mensaje={selectedMensaje}
          onSave={handleSaveMensaje}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
