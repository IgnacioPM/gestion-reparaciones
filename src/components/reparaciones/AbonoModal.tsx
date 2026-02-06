'use client'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabaseClient'
import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface AbonoModalProps {
  isOpen: boolean
  onClose: () => void
  proveedorId: string
  empresaId: string
  compraId?: string
  onAbonoCreated: () => void
}

export default function AbonoModal({
  isOpen,
  onClose,
  proveedorId,
  empresaId,
  compraId,
  onAbonoCreated,
}: AbonoModalProps) {
  const [monto, setMonto] = useState<number>(0)
  const [metodo_pago, setMetodo_pago] = useState<string>('efectivo')
  const [descripcion, setDescripcion] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!monto || monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        empresa_id: empresaId,
        proveedor_id: proveedorId,
        tipo: 'abono',
        monto,
        metodo_pago,
        descripcion: descripcion || `Pago de ${monto.toLocaleString('es-CR')}`,
      }

      if (compraId) payload.compra_id = compraId

      const { error } = await supabase.from('proveedores_movimientos').insert(payload)

      if (error) throw error

      toast.success('Abono registrado correctamente')
      setMonto(0)
      setMetodo_pago('efectivo')
      setDescripcion('')
      onAbonoCreated()
      onClose()
    } catch (err: any) {
      console.error('Error creating abono:', err)
      toast.error(err.message || 'Error al registrar el abono')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-lg font-semibold dark:text-white'>Registrar Abono</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='space-y-4'>
          <Input
            label='Monto'
            type='number'
            step='0.01'
            min='0'
            value={monto}
            onChange={(e) => setMonto(Number(e.target.value))}
            placeholder='0.00'
          />

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Método de Pago
            </label>
            <select
              value={metodo_pago}
              onChange={(e) => setMetodo_pago(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='efectivo'>Efectivo</option>
              <option value='tarjeta'>Tarjeta</option>
              <option value='sinpe'>SINPE</option>
            </select>
          </div>

          <Input
            label='Descripción (opcional)'
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder='Detalles del abono...'
          />

          <div className='flex gap-3 pt-4'>
            <Button onClick={onClose} color='secondary' className='flex-1' disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className='flex-1' disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Registrar Abono'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
