'use client'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SectionTitle from '@/components/ui/SectionTitle'
import { supabase } from '@/lib/supabaseClient'
import { FabricanteFormData, fabricanteSchema } from '@/schemas/fabricante'
import { useAuthStore } from '@/stores/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import ReactDOM from 'react-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (fabricante: any) => void
}

export default function FabricanteAddModal({ isOpen, onClose, onSave }: Props) {
  const { profile } = useAuthStore()
  const [isSubmitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FabricanteFormData>({
    resolver: zodResolver(fabricanteSchema),
  })

  if (!isOpen) return null

  const submit = async (data: FabricanteFormData) => {
    if (!profile?.empresa_id) {
      toast.error('No hay empresa asociada al usuario')
      return
    }

    setSubmitting(true)

    const { data: nuevoFabricante, error } = await supabase
      .from('fabricantes')
      .insert({
        ...data,
        empresa_id: profile.empresa_id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        toast.error('Ya existe una marca con ese nombre')
      } else {
        toast.error('Error al crear la marca: ' + error.message)
      }
    } else {
      toast.success('Marca creada correctamente')
      onSave(nuevoFabricante)
      reset()
      onClose()
    }

    setSubmitting(false)
  }

  return ReactDOM.createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm'>
        <SectionTitle>Nueva Marca</SectionTitle>

        <form onSubmit={handleSubmit(submit)} className='space-y-4 mt-4'>
          <Input label='Nombre' {...register('nombre')} error={errors.nombre?.message} />

          <div className='flex justify-end gap-2'>
            <Button type='button' color='secondary' onClick={onClose}>
              Cancelar
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
