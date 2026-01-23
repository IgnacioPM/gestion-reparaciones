'use client'

import Select from '@/components/ui/Select'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth' // 👈 SOLO ESTO NUEVO
import type { ObservacionRapida } from '@/types/observacion_rapida'
import type { TipoDispositivo } from '@/types/tipo_dispositivo'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import ObservacionRapidaAddModal from './ObservacionRapidaAddModal'
import ObservacionRapidaEditModal from './ObservacionRapidaEditModal'

interface ObservacionRapidaConTipo extends ObservacionRapida {
  tipos_dispositivo: {
    nombre: string
  } | null
}

interface Props {
  tiposDispositivo?: TipoDispositivo[]
}

export default function ObservacionesRapidasTable({ tiposDispositivo = [] }: Props) {
  const { profile } = useAuthStore() // 👈 SOLO ESTO NUEVO
  const [observaciones, setObservaciones] = useState<ObservacionRapidaConTipo[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setAddModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [selectedObservacion, setSelectedObservacion] = useState<ObservacionRapidaConTipo | null>(
    null
  )
  const [tipoFilter, setTipoFilter] = useState('')

  useEffect(() => {
    fetchObservaciones()
  }, [tipoFilter, profile?.empresa_id]) // 👈 dependencia correcta

  const fetchObservaciones = async () => {
    if (!profile?.empresa_id) {
      setObservaciones([])
      setLoading(false)
      return
    }

    setLoading(true)
    const query = supabase
      .from('observaciones_rapidas')
      .select(
        `
        *,
        tipos_dispositivo ( nombre )
      `
      )
      .eq('empresa_id', profile.empresa_id) // 👈 FILTRO CLAVE
      .order('created_at', { ascending: false })

    if (tipoFilter) {
      query.eq('id_tipo', tipoFilter)
    }

    const { data, error } = await query

    if (error) {
      toast.error('Error al cargar las observaciones: ' + error.message)
    } else {
      setObservaciones((data || []) as ObservacionRapidaConTipo[])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta observación?')) return

    const { error } = await supabase
      .from('observaciones_rapidas')
      .delete()
      .eq('id_observacion', id)
      .eq('empresa_id', profile?.empresa_id) // 👈 BLINDAJE

    if (error) {
      toast.error('Error al eliminar la observación')
    } else {
      toast.success('Observación eliminada')
      fetchObservaciones()
    }
  }

  const handleEdit = (obs: ObservacionRapidaConTipo) => {
    setSelectedObservacion(obs)
    setEditModalOpen(true)
  }

  if (loading) {
    return <div className='p-4'>Cargando...</div>
  }

  return (
    <div className='w-full'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold'>Observaciones rápidas</h3>
        <button
          onClick={() => setAddModalOpen(true)}
          className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md'
        >
          <Plus className='w-5 h-5' />
          <span>Agregar</span>
        </button>
      </div>

      <div className='mb-4 max-w-sm'>
        <Select
          label='Filtrar por tipo de dispositivo'
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
        >
          <option value=''>Todos</option>
          {tiposDispositivo.map((tipo) => (
            <option key={tipo.id_tipo} value={tipo.id_tipo}>
              {tipo.nombre}
            </option>
          ))}
        </Select>
      </div>

      <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Texto</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>
                Tipo de dispositivo
              </th>
              <th className='px-6 py-3'></th>
            </tr>
          </thead>

          <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
            {observaciones.length === 0 ? (
              <tr>
                <td colSpan={3} className='text-center p-4 text-gray-500'>
                  No hay observaciones.
                </td>
              </tr>
            ) : (
              observaciones.map((obs) => (
                <tr key={obs.id_observacion}>
                  <td className='px-6 py-4 text-sm'>{obs.texto}</td>
                  <td className='px-6 py-4 text-sm text-gray-500'>
                    {obs.tipos_dispositivo?.nombre ?? 'Todos'}
                  </td>
                  <td className='px-6 py-4 text-right space-x-2'>
                    <button
                      onClick={() => handleEdit(obs)}
                      className='text-blue-600 hover:text-blue-900'
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(obs.id_observacion)}
                      className='text-red-600 hover:text-red-900'
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <ObservacionRapidaAddModal
          onClose={() => setAddModalOpen(false)}
          onAdded={() => {
            fetchObservaciones()
            setAddModalOpen(false)
          }}
        />
      )}

      {isEditModalOpen && selectedObservacion && (
        <ObservacionRapidaEditModal
          observacion={selectedObservacion}
          onClose={() => setEditModalOpen(false)}
          onUpdated={() => {
            fetchObservaciones()
            setEditModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
