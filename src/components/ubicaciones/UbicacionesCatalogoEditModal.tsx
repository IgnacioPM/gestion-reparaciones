'use client'

import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Input from '@/components/ui/Input'
import SectionTitle from '@/components/ui/SectionTitle'
import { ubicacionesCatalogoSchema } from '@/schemas/ubicaciones_catalogo'
import { UbicacionesCatalogo } from '@/types/ubicaciones_catalogo'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { useForm } from 'react-hook-form'

interface FormData {
  nombre: string
  activo?: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: FormData) => void
  isSubmitting?: boolean
  initialData?: Partial<UbicacionesCatalogo> | null
  error?: string | null
}

export default function UbicacionesCatalogoEditModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  initialData,
  error,
}: Props) {
  const [isClient, setIsClient] = useState(false)
  const isEdit = Boolean(initialData && initialData.id_catalogo)

  useEffect(() => setIsClient(true), [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(ubicacionesCatalogoSchema),
    defaultValues: { nombre: initialData?.nombre || '', activo: initialData?.activo ?? true },
  })

  useEffect(() => {
    if (isOpen) {
      reset({ nombre: initialData?.nombre || '', activo: initialData?.activo ?? true })
    }
  }, [isOpen, initialData, reset])

  if (!isOpen || !isClient) return null

  return ReactDOM.createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative'>
        <button
          className='absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl'
          onClick={onClose}
          title='Cerrar'
        >
          &times;
        </button>
        <SectionTitle className='mb-4'>
          {isEdit ? 'Editar Catálogo' : 'Nuevo Catálogo'}
        </SectionTitle>

        <form onSubmit={handleSubmit(onSave)} className='space-y-4'>
          <Input label='Nombre' {...register('nombre')} error={errors.nombre?.message} />

          {error && <FormError message={error} />}

          <div className='flex justify-end gap-2 mt-4'>
            <Button type='button' color='secondary' onClick={onClose} className='w-auto'>
              Cancelar
            </Button>
            <Button type='submit' disabled={isSubmitting} className='w-auto'>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
