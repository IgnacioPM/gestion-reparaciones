'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { marcaSchema } from '@/schemas/marca'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import SectionTitle from '@/components/ui/SectionTitle'
import Select from '@/components/ui/Select'
import { TipoDispositivo } from '@/types/tipo_dispositivo'
import FormError from '@/components/ui/FormError'
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Marca } from '@/types/marca'

interface MarcaFormData {
  nombre: string
  id_tipo: string
}

interface MarcaEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: MarcaFormData) => void
  isSubmitting?: boolean
  tiposDispositivo: TipoDispositivo[]
  initialData?: Partial<Marca> | null
  error?: string | null
}

export default function MarcaEditModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  tiposDispositivo,
  initialData,
  error
}: MarcaEditModalProps) {
  const [isClient, setIsClient] = useState(false)
  const isEditMode = initialData && initialData.id_marca

  useEffect(() => {
    setIsClient(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<MarcaFormData>({
    resolver: zodResolver(marcaSchema),
    defaultValues: {
        nombre: initialData?.nombre || '',
        id_tipo: initialData?.id_tipo || ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: initialData?.nombre || '',
        id_tipo: initialData?.id_tipo || '' 
      });
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen || !isClient) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl"
          onClick={onClose}
          title="Cerrar"
        >
          &times;
        </button>
        <SectionTitle className="mb-4">
          {isEditMode ? 'Editar Marca' : 'Nueva Marca'}
        </SectionTitle>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Select
            label="Tipo de Dispositivo"
            {...register('id_tipo')}
            error={errors.id_tipo?.message}
          >
            <option value="">Seleccione un tipo</option>
            {tiposDispositivo.map(tipo => (
              <option key={tipo.id_tipo} value={tipo.id_tipo}>
                {tipo.nombre}
              </option>
            ))}
          </Select>
          <Input
            label="Nombre"
            type="text"
            {...register('nombre')}
            error={errors.nombre?.message}
          />

          {error && <FormError message={error} />}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" color="secondary" onClick={onClose} className="w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-auto">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
