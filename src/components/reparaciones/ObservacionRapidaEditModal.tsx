import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { z } from 'zod'
import { ObservacionRapidaSchema } from '@/schemas/observacion_rapida'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import { useAuthStore } from '@/stores/auth'
import type { ObservacionRapida } from '@/types/observacion_rapida'
import type { TipoDispositivo } from '@/types/tipo_dispositivo'

const EditObservacionSchema = ObservacionRapidaSchema.pick({ texto: true, id_tipo: true })
type EditObservacionForm = z.infer<typeof EditObservacionSchema>

interface Props {
  observacion: ObservacionRapida
  onClose: () => void
  onUpdated: () => void
}

export default function ObservacionRapidaEditModal ({ observacion, onClose, onUpdated }: Props) {
  const { profile } = useAuthStore()
  const [tipos, setTipos] = useState<TipoDispositivo[]>([])
  const [isSubmitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditObservacionForm>({
    resolver: zodResolver(EditObservacionSchema)
  })

  useEffect(() => {
    const fetchTiposAndSetForm = async () => {
      if (!profile?.empresa_id) return

      const { data, error } = await supabase
        .from('tipos_dispositivo')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('nombre', { ascending: true })

      if (error) {
        toast.error('Error al cargar los tipos de dispositivo: ' + error.message)
      } else {
        setTipos(data || [])
        reset({
          texto: observacion.texto,
          id_tipo: observacion.id_tipo
        })
      }
    }
    void fetchTiposAndSetForm()
  }, [observacion, reset, profile?.empresa_id])

  const onSubmit = async (formData: EditObservacionForm) => {
    setSubmitting(true)
    const { error } = await supabase
      .from('observaciones_rapidas')
      .update(formData)
      .eq('id_observacion', observacion.id_observacion)

    if (error) {
        if (error.code === '23505') {
            toast.error('Ya existe una observación rápida con el mismo texto para el tipo de dispositivo seleccionado.')
        } else {
            toast.error('Error al actualizar la observación: ' + error.message)
        }
    } else {
      toast.success('Observación actualizada correctamente')
      onUpdated()
      onClose()
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Editar Observación Rápida</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select
            label="Tipo de Dispositivo"
            {...register('id_tipo')}
            error={errors.id_tipo?.message}
          >
            <option value="">Seleccione un tipo</option>
            {tipos.map(t => (
              <option key={t.id_tipo} value={t.id_tipo}>
                {t.nombre}
              </option>
            ))}
          </Select>
          <Textarea
            label="Texto de la observación"
            {...register('texto')}
            error={errors.texto?.message}
            placeholder="Ej: El equipo no enciende"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" onClick={onClose} color="secondary">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
