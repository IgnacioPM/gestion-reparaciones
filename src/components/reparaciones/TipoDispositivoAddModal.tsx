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

interface TipoDispositivoFormData {
    nombre: string
}

interface TipoDispositivoAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: TipoDispositivoFormData) => void
  isSubmitting?: boolean
  error?: string | null
}

export default function TipoDispositivoAddModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  error
}: TipoDispositivoAddModalProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<TipoDispositivoFormData>({
    resolver: zodResolver(tipoDispositivoSchema)
  })

  useEffect(() => {
    if (isOpen) {
      reset({ nombre: '' });
    }
  }, [isOpen, reset]);

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
          Nuevo Tipo de Dispositivo
        </SectionTitle>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Input
            label="Nombre"
            type="text"
            {...register('nombre')}
            error={errors.nombre?.message}
          />

          {error && <FormError message={error} />}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" color="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
