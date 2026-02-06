'use client'

import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Input from '@/components/ui/Input'
import SectionTitle from '@/components/ui/SectionTitle'
import Textarea from '@/components/ui/Textarea'
import { ProveedorFormData, proveedorSchema } from '@/schemas/proveedor'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { useForm } from 'react-hook-form'

interface ProveedorAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProveedorFormData & { credito_inicial?: number | null }) => void
  isSubmitting?: boolean
  error?: string | null
}

export default function ProveedorAddModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  error,
}: ProveedorAddModalProps) {
  const [isClient, setIsClient] = useState(false)

  type FormValues = ProveedorFormData & { credito_inicial?: number | null }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      credito_inicial: 0,
      activo: true,
    },
  })

  useEffect(() => setIsClient(true), [])

  /** 🔹 RESET TOTAL AL ABRIR */
  useEffect(() => {
    if (!isOpen) return

    reset({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      credito_inicial: 0,
      activo: true,
    })
  }, [isOpen, reset])

  if (!isOpen || !isClient) return null

  const handleCreate = (data: FormValues) => {
    const normalizedData: ProveedorFormData = {
      ...data,
      telefono: data.telefono || null,
      email: data.email || null,
      direccion: data.direccion || null,
    }

    // pass credito_inicial separately if present in form values
    const payload: any = { ...normalizedData }
    if (data.credito_inicial != null) payload.credito_inicial = Number(data.credito_inicial) || 0

    onSave(payload)
  }

  return ReactDOM.createPortal(
    <>
      {/* BACKDROP */}
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        {/* MODAL */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col relative'>
          {/* HEADER */}
          <div className='flex items-center justify-between p-6 border-b dark:border-gray-700'>
            <SectionTitle>Nuevo Proveedor</SectionTitle>
            <button
              className='text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl'
              onClick={onClose}
              title='Cerrar'
            >
              &times;
            </button>
          </div>

          {/* BODY SCROLL */}
          <div className='flex-1 overflow-y-auto p-6'>
            <form onSubmit={handleSubmit(handleCreate)} className='space-y-4'>
              <Input label='Nombre' {...register('nombre')} error={errors.nombre?.message} />

              <Input label='Teléfono' {...register('telefono')} error={errors.telefono?.message} />

              <Input label='Email' {...register('email')} error={errors.email?.message} />

              <Textarea
                label='Dirección'
                {...register('direccion')}
                error={errors.direccion?.message}
              />

              <Input
                label='Saldo inicial (crédito)'
                type='number'
                {...register('credito_inicial')}
                error={errors?.credito_inicial as any}
              />

              <div className='flex items-center gap-2'>
                <input type='checkbox' {...register('activo')} />
                <label className='text-sm'>Proveedor activo</label>
              </div>

              {error && <FormError message={error} />}

              <div className='flex justify-end gap-2 pt-4'>
                <Button type='button' color='secondary' onClick={onClose}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
