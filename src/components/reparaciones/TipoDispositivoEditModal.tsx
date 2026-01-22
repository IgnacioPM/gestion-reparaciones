'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tipoDispositivoSchema } from '@/schemas/tipo_dispositivo'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import SectionTitle from '@/components/ui/SectionTitle'
import FormError from '@/components/ui/FormError'
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { TipoDispositivo } from '@/types/tipo_dispositivo'

export interface TipoDispositivoFormData {
    nombre: string
    predeterminado?: boolean
}

interface TipoDispositivoEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: TipoDispositivoFormData) => void
  isSubmitting?: boolean
  error?: string | null
  initialData?: Partial<TipoDispositivo> | null
}

export default function TipoDispositivoEditModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  error,
  initialData
}: TipoDispositivoEditModalProps) {
  const [isClient, setIsClient] = useState(false)
  const isEditMode = initialData && initialData.id_tipo

  useEffect(() => {
    setIsClient(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<TipoDispositivoFormData>({
    resolver: zodResolver(tipoDispositivoSchema),
    defaultValues: {
        nombre: initialData?.nombre || '',
        predeterminado: initialData?.predeterminado || false
    }
  })

  useEffect(() => {
    if (isOpen) {
      reset({ nombre: initialData?.nombre || '' });
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
          {isEditMode ? 'Editar Tipo de Dispositivo' : 'Nuevo Tipo de Dispositivo'}
        </SectionTitle>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Input
            label="Nombre"
            type="text"
            {...register('nombre')}
            error={errors.nombre?.message}
          />
          <div className="flex items-center gap-2">
            <input
              id="predeterminado"
              type="checkbox"
              {...register('predeterminado')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
            />
            <label htmlFor="predeterminado" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Predeterminado
            </label>
          </div>

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
