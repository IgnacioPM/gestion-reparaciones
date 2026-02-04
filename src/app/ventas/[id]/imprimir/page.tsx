'use client'

import { VentaPrintable } from '@/components/ventas/VentaPrintable'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import '@/styles/print.css'
import { useEffect, useState } from 'react'

// Duplicating types here for clarity.
interface VentaDetalleItem {
  producto: {
    nombre: string
    fabricante: {
      nombre: string
    }
  }
  cantidad: number
  precio_unitario: number
  subtotal: number
  descuento_monto: number
  descuento_porcentaje: number | null
}

interface VentaConDetalles {
  id_venta: number
  fecha: string
  total: number
  metodo_pago: string
  total_descuento: number
  cliente: {
    nombre: string
    telefono: string | null
    correo: string | null
  } | null
  items: VentaDetalleItem[]
}

interface VentaDetalleRow {
  cantidad: number
  precio_unitario: number
  subtotal: number
  descuento_monto: number
  descuento_porcentaje: number | null
  producto: {
    nombre: string
    fabricante: {
      nombre: string
    }
  }
}

export default function VentaImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = useAuthStore()

  const [venta, setVenta] = useState<VentaConDetalles | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVenta = async () => {
      const { id } = await params
      if (!id) return

      try {
        setLoading(true)
        setError(null)
        const { data: ventaData, error: ventaError } = await supabase
          .from('ventas')
          .select(
            `
            id_venta,
            created_at,
            total,
            metodo_pago,
            total_descuento,
            cliente:clientes (
              nombre,
              telefono,
              correo
            )
          `
          )
          .eq('id_venta', id)
          .single()

        if (ventaError) {
          setError('Venta no encontrada')
          throw new Error('Venta no encontrada')
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from('ventas_detalle')
          .select(
            `
            cantidad,
            precio_unitario,
            subtotal,
            descuento_monto,
            descuento_porcentaje,
            producto:productos (
              nombre,
              fabricante:fabricantes (
                nombre
              )
            )
          `
          )
          .eq('venta_id', id)

        if (itemsError) throw new Error('Error al cargar productos')

        const ventaProcesada: VentaConDetalles = {
          id_venta: ventaData.id_venta,
          fecha: ventaData.created_at,
          total: ventaData.total,
          metodo_pago: ventaData.metodo_pago,
          total_descuento: ventaData.total_descuento,
          cliente: Array.isArray(ventaData.cliente) ? ventaData.cliente[0] : ventaData.cliente,
          items: ((itemsData as any[]) ?? []).map((item) => {
            const producto = Array.isArray(item.producto) ? item.producto[0] : item.producto
            const fabricante =
              producto && Array.isArray(producto.fabricante)
                ? producto.fabricante[0]
                : producto?.fabricante

            return {
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: item.subtotal,
              descuento_monto: item.descuento_monto,
              descuento_porcentaje: item.descuento_porcentaje,
              producto: {
                nombre: producto?.nombre ?? '',
                fabricante: {
                  nombre: fabricante?.nombre ?? '',
                },
              },
            }
          }),
        }

        setVenta(ventaProcesada)
      } catch (e) {
        console.error(e)
        if (e instanceof Error) {
          setError(e.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchVenta()
  }, [params])

  useEffect(() => {
    if (venta && !loading) {
      setTimeout(() => window.print(), 500)
    }
  }, [venta, loading])

  if (loading) return <p className='p-4'>Cargando factura...</p>
  if (error) return <p className='p-4'>Error: {error}</p>
  if (!venta) return <p className='p-4'>Venta no encontrada.</p>

  return (
    <div className='printable-area'>
      <VentaPrintable venta={venta} profile={profile} />
    </div>
  )
}
