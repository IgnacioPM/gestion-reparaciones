'use client'

import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import SectionTitle from '@/components/ui/SectionTitle'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface EstadoServicioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (estado: string) => void
  isSubmitting?: boolean
  currentEstado: string | null
  numeroServicio: string | null
  error?: string | null
}

const estados = [
  { value: 'Recibido', label: 'Recibido' },
  { value: 'En revisión', label: 'En revisión' },
  { value: 'En reparacion', label: 'En reparación' },
  { value: 'Listo', label: 'Listo' },
  { value: 'Entregado', label: 'Entregado' },
  { value: 'Anulado', label: 'Anulado' },
]

export default function EstadoServicioModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  currentEstado,
  numeroServicio,
  error
}: EstadoServicioModalProps) {
  const [isClient, setIsClient] = useState(false)
  const [estado, setEstado] = useState(currentEstado || 'Recibido')
  const isEntregado = currentEstado === 'Entregado'

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setEstado(currentEstado || 'Recibido')
    }
  }, [isOpen, currentEstado])

  if (!isOpen || !isClient) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(estado)
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
        <SectionTitle className='mb-4'>
          Cambiar Estado {numeroServicio ? `- ${numeroServicio}` : ''}
        </SectionTitle>

        {isEntregado ? (
          <div className='space-y-4'>
            <div className='bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded'>
              <p className='font-semibold'>No se puede modificar el estado</p>
              <p className='text-sm mt-1'>
                Los servicios con estado "Entregado" no pueden cambiar de estado.
              </p>
            </div>
            <div className='flex justify-end'>
              <Button
                type='button'
                color='secondary'
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <Select
              label='Estado del Servicio'
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              disabled={isSubmitting}
            >
              {estados.map((est) => (
                <option key={est.value} value={est.value}>
                  {est.label}
                </option>
              ))}
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
        )}
      </div>
    </div>,
    document.body
  )
}
