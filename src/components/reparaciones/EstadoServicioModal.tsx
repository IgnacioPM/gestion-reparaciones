'use client'

import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import SectionTitle from '@/components/ui/SectionTitle'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FormError from '@/components/ui/FormError'

interface EstadoServicioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (estado: string, costoFinal?: number) => void
  isSubmitting?: boolean
  currentEstado: string | null
  numeroServicio: string | null
  error?: string | null
  costoEstimado?: number | null
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
  error,
  costoEstimado
}: EstadoServicioModalProps) {
  const [isClient, setIsClient] = useState(false)
  const [estado, setEstado] = useState(currentEstado || 'Recibido')
  const [costoFinal, setCostoFinal] = useState<string>('')
  const [costoFinalError, setCostoFinalError] = useState<string | null>(null)
  const isEntregado = currentEstado === 'Entregado'

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setEstado(currentEstado || 'Recibido')
      setCostoFinal('')
      setCostoFinalError(null)
    }
  }, [isOpen, currentEstado])

  useEffect(() => {
    if (estado === 'Entregado' && costoEstimado) {
      setCostoFinal(String(costoEstimado))
    }
  }, [estado, costoEstimado])

  if (!isOpen || !isClient) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Solo permitir números y punto decimal
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setCostoFinal(value)
      setCostoFinalError(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Si el estado es Entregado, validar que costoFinal esté completo
    if (estado === 'Entregado') {
      if (!costoFinal.trim()) {
        setCostoFinalError('El costo final es requerido')
        return
      }
      const costo = parseFloat(costoFinal)
      if (isNaN(costo) || costo < 0) {
        setCostoFinalError('Ingrese un monto válido')
        return
      }
      onSave(estado, costo)
    } else {
      onSave(estado)
    }
  }

  const isGuardarDisabled = estado === 'Entregado' && !costoFinal.trim()

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
              onChange={(e) => {
                const newEstado = e.target.value
                setEstado(newEstado)
                if (newEstado !== 'Entregado') {
                  setCostoFinal('')
                }
                setCostoFinalError(null)
              }}
              disabled={isSubmitting}
            >
              {estados.map((est) => (
                <option key={est.value} value={est.value}>
                  {est.label}
                </option>
              ))}
            </Select>

            {estado === 'Entregado' && (
              <div className='bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-100 px-4 py-3 rounded'>
                <p className='text-sm'>
                  El servicio está listo para entregar. Ingrese el costo final del servicio.
                </p>
              </div>
            )}

            {costoEstimado && estado === 'Entregado' && (
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                <p>Costo estimado: <span className='font-semibold'>₡{costoEstimado.toFixed(2)}</span></p>
              </div>
            )}

            {estado === 'Entregado' && (
              <Input
                label='Costo Final (₡)'
                type='text'
                placeholder='0.00'
                value={costoFinal}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoFocus
                inputMode='decimal'
                error={costoFinalError || undefined}
              />
            )}

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
              <Button type='submit' color='primary' disabled={isSubmitting || isGuardarDisabled}>
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
