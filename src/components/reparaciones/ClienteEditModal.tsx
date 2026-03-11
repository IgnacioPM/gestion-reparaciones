'use client'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SectionTitle from '@/components/ui/SectionTitle'
import { Cliente } from '@/types/servicio'
import { useEffect, useState } from 'react'

interface ClienteEditModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: Cliente | null
  onSave: (data: { nombre: string; telefono: string; correo: string }) => void
  isSubmitting?: boolean
}

export function ClienteEditModal({
  isOpen,
  onClose,
  cliente,
  onSave,
  isSubmitting = false,
}: ClienteEditModalProps) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setNombre(cliente?.nombre ?? '')
    setTelefono(cliente?.telefono ?? '')
    setCorreo(cliente?.correo ?? '')
  }, [isOpen, cliente])

  if (!isOpen) return null

  const handleSave = () => {
    const nombreNormalizado = nombre.trim()
    if (!nombreNormalizado) {
      alert('El nombre del cliente es obligatorio.')
      return
    }

    onSave({
      nombre: nombreNormalizado,
      telefono: telefono.trim(),
      correo: correo.trim(),
    })
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative'>
        <button
          className='absolute top-2 right-2 text-gray-500 hover:text-gray-800'
          onClick={onClose}
          title='Cerrar'
          type='button'
        >
          ×
        </button>

        <SectionTitle className='mb-4'>Editar cliente</SectionTitle>

        <div className='space-y-4'>
          <Input
            label='Nombre'
            type='text'
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <Input
            label='Teléfono'
            type='text'
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <Input
            label='Correo'
            type='email'
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </div>

        <div className='flex justify-end gap-2 mt-6'>
          <Button type='button' color='secondary' onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type='button' onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
