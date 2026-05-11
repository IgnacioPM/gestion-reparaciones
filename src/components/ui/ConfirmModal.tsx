'use client'

import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import SectionTitle from '@/components/ui/SectionTitle'
import Button from '@/components/ui/Button'

interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmModal({
  isOpen,
  title = 'Confirmar',
  description = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isSubmitting = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isOpen || !isClient) return null

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

        <SectionTitle className='mb-2'>{title}</SectionTitle>
        {description && <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>{description}</p>}

        <div className='flex justify-end gap-2 mt-4'>
          <Button type='button' color='secondary' onClick={onClose} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button type='button' color='danger' onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
