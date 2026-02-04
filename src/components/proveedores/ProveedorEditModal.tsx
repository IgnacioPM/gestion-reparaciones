'use client'

import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Input from '@/components/ui/Input'
import SectionTitle from '@/components/ui/SectionTitle'
import Textarea from '@/components/ui/Textarea'
import { ProveedorFormData, proveedorSchema } from '@/schemas/proveedor'
import type { Proveedor } from '@/types/proveedor'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { useForm } from 'react-hook-form'

interface ProveedorEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProveedorFormData) => void
  isSubmitting?: boolean
  error?: string | null
  initialData: Proveedor
}

export default function ProveedorEditModal ({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  error,
  initialData
}: ProveedorEditModalProps) {
  const [isClient, setIsClient] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema)
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: initialData.nombre,
        telefono: initialData.telefono,
        email: initialData.email,
        direccion: initialData.direccion,
        activo: initialData.activo
      })
    }
  }, [isOpen, initialData, reset])

  if (!isOpen || !isClient) return null

  const handleUpdate = (data: ProveedorFormData) => {
    const normalizedData: ProveedorFormData = {
      ...data,
      telefono: data.telefono || null,
      email: data.email || null,
      direccion: data.direccion || null
    }
    onSave(normalizedData)
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col relative">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <SectionTitle>Editar Proveedor</SectionTitle>
          <button
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl"
            onClick={onClose}
            title="Cerrar"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
            <Input label="Nombre" {...register('nombre')} error={errors.nombre?.message} />
            <Input label="Teléfono" {...register('telefono')} error={errors.telefono?.message} />
            <Input label="Email" {...register('email')} error={errors.email?.message} />
            <Textarea label="Dirección" {...register('direccion')} error={errors.direccion?.message} />

            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('activo')} defaultChecked={initialData.activo ?? true} />
              <label className="text-sm">Activo</label>
            </div>

            {error && <FormError message={error} />}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" color="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}
