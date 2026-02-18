'use client'

import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import SectionTitle from '@/components/ui/SectionTitle'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface MetodoPagoEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (metodo: string) => void
  isSubmitting?: boolean
  currentMetodo: string | null
  error?: string | null
}

export default function MetodoPagoEditModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  currentMetodo,
  error
}: MetodoPagoEditModalProps) {
  const [isClient, setIsClient] = useState(false)
  const [metodo, setMetodo] = useState(currentMetodo || 'efectivo')

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setMetodo(currentMetodo || 'efectivo')
    }
  }, [isOpen, currentMetodo])

  if (!isOpen || !isClient) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(metodo)
  }

  return ReactDOM.createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative'>
        <button
          className='absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl'
          onClick={onClose}
          title='Cerrar'
          disabled={isSubmitting}
        >
          &times;
        </button>
        <SectionTitle className='mb-4'>Editar Método de Pago</SectionTitle>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <Select
            label='Método de Pago'
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            disabled={isSubmitting}
          >
            <option value='efectivo'>Efectivo</option>
            <option value='tarjeta'>Tarjeta</option>
            <option value='sinpe'>SINPE</option>
          </Select>

          {error && (
            <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
              {error}
            </div>
          )}

          <div className='flex justify-end gap-2 mt-6'>
            <Button
              type='button'
              color='secondary'
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type='submit' color='primary' disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
