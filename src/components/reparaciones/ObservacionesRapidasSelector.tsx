'use client'

import { supabase } from '@/lib/supabaseClient'
import { ObservacionRapida } from '@/types/observacion_rapida'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Button from '../ui/Button'

interface Props {
  onObservacionClick: (text: string) => void
  tipoDispositivoId?: string
}

export default function ObservacionesRapidasSelector({
  onObservacionClick,
  tipoDispositivoId,
}: Props) {
  const [observaciones, setObservaciones] = useState<ObservacionRapida[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchObservaciones()
  }, [tipoDispositivoId])

  const fetchObservaciones = async () => {
    setLoading(true)
    let query = supabase.from('observaciones_rapidas').select('*')

    if (tipoDispositivoId) {
      // Fetch observations for the specific device type and also those that are for all types (null)
      query = query.or(`id_tipo.eq.${tipoDispositivoId},id_tipo.is.null`)
    } else {
      // Fetch observations that are for all types
      query = query.is('id_tipo', null)
    }

    const { data, error } = await query.order('texto', { ascending: true })

    if (error) {
      toast.error('Error al cargar las observaciones rápidas: ' + error.message)
    } else {
      setObservaciones(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return <div className='p-2 text-sm'>Cargando observaciones...</div>
  }

  if (observaciones.length === 0) {
    return null
  }

  return (
    <div className='flex flex-wrap gap-2 mb-2'>
      {observaciones.map((obs) => (
        <Button
          key={obs.id_observacion}
          type='button'
          onClick={() => onObservacionClick(obs.texto)}
          className='bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs px-2 py-1'
        >
          {obs.texto}
        </Button>
      ))}
    </div>
  )
}
