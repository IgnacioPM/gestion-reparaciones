'use client'
import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { InfoBlock } from '@/components/ui/InfoBlock'
import { InfoRow } from '@/components/ui/InfoRow'
import Navbar from '@/components/ui/Navbar'
import SectionTitle from '@/components/ui/SectionTitle'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Tipos de datos para la página de detalle de venta
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
}

interface VentaConDetalles {
  id_venta: number
  fecha: string
  total: number
  metodo_pago: string
  cliente: {
    nombre: string
    telefono: string | null
    correo: string | null
  } | null
  items: VentaDetalleItem[]
}

function formatFechaSimple(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function VentaDetallePage({ params }: { params: Promise<{ id: string }> }) {
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

        // Fetch venta y cliente
        const { data: ventaData, error: ventaError } = await supabase
          .from('ventas')
          .select(
            `
            id_venta,
            created_at,
            total,
            metodo_pago,
            cliente:clientes (
              nombre,
              telefono,
              correo
            )
          `
          )
          .eq('id_venta', id)
          .single()

        if (ventaError) throw new Error('Venta no encontrada')
        if (!ventaData) throw new Error('Venta no encontrada')

        // Fetch items de la venta (detalle)
        const { data: itemsData, error: itemsError } = await supabase
          .from('ventas_detalle')
          .select(
            `
            cantidad,
            precio_unitario,
            subtotal,
            producto:productos (
              nombre,
              fabricante:fabricantes (
                nombre
              )
            )
          `
          )
          .eq('venta_id', id)

        if (itemsError) throw new Error('Error al cargar los productos de la venta')

        // Normalizar datos y actualizar estado
        const ventaProcesada: VentaConDetalles = {
          id_venta: ventaData.id_venta,
          fecha: ventaData.created_at,
          total: ventaData.total,
          metodo_pago: ventaData.metodo_pago,
          cliente: Array.isArray(ventaData.cliente) ? ventaData.cliente[0] : ventaData.cliente,
          items: (itemsData ?? []).map((item: any) => {
            const producto = Array.isArray(item.producto) ? item.producto[0] : item.producto
            const fabricante = producto?.fabricante
              ? Array.isArray(producto.fabricante)
                ? producto.fabricante[0]
                : producto.fabricante
              : null

            return {
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: item.subtotal,
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
      } catch (e: any) {
        setError(e.message || 'Ocurrió un error inesperado')
      } finally {
        setLoading(false)
      }
    }

    fetchVenta()
  }, [params])

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center'>
        <span className='text-gray-600 dark:text-gray-300'>Cargando detalle de la venta...</span>
      </div>
    )
  }

  if (error || !venta) {
    return (
      <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
        <Navbar />
        <div className='container mx-auto px-4 py-8 text-center'>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
            Error al Cargar la Venta
          </h2>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>{error}</p>
          <Link
            href='/ventas'
            className='mt-4 inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          >
            <ArrowLeft className='h-5 w-5 mr-2' />
            <span>Volver a ventas</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        {/* Encabezado */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
          <div className='flex w-full items-center'>
            <Link
              href='/'
              className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            >
              <ArrowLeft className='h-5 w-5 mr-2' />
              <span>Ir al inicio</span>
            </Link>
          </div>
        </div>

        {/* Detalles */}
        <div className='bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden'>
          <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Detalle de Venta</h1>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-6'>
            <InfoBlock title={<SectionTitle>Cliente</SectionTitle>}>
              <InfoRow label='Nombre' value={venta.cliente?.nombre} />
              <InfoRow label='Teléfono' value={venta.cliente?.telefono} />
              <InfoRow label='Correo' value={venta.cliente?.correo} />
            </InfoBlock>

            <InfoBlock title={<SectionTitle>Venta</SectionTitle>}>
              <InfoRow label='Fecha' value={formatFechaSimple(venta.fecha)} />
              <InfoRow label='Método de Pago' value={venta.metodo_pago} />
              <InfoRow label='Total' value={<FormattedAmount amount={venta.total} />} />
            </InfoBlock>
          </div>

          {/* Items de la Venta */}
          <div className='p-6'>
            <SectionTitle>Productos Vendidos</SectionTitle>
            <div className='mt-4 overflow-x-auto'>
              <table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
                <thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
                  <tr>
                    <th scope='col' className='px-6 py-3'>
                      Producto
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      Cantidad
                    </th>
                    <th scope='col' className='px-6 py-3 text-right'>
                      Precio Unit.
                    </th>
                    <th scope='col' className='px-6 py-3 text-right'>
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {venta.items.map((item, index) => (
                    <tr
                      key={index}
                      className='bg-white border-b dark:bg-gray-800 dark:border-gray-700'
                    >
                      <th
                        scope='row'
                        className='px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white'
                      >
                        {item.producto.fabricante.nombre} {item.producto.nombre}
                      </th>
                      <td className='px-6 py-4'>{item.cantidad}</td>
                      <td className='px-6 py-4 text-right'>
                        <FormattedAmount amount={item.precio_unitario} />
                      </td>
                      <td className='px-6 py-4 text-right'>
                        <FormattedAmount amount={item.subtotal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className='font-semibold text-gray-900 dark:text-white'>
                    <th scope='row' className='px-6 py-3 text-base'>
                      Total
                    </th>
                    <td colSpan={2}></td>
                    <td className='px-6 py-3 text-base text-right'>
                      <FormattedAmount amount={venta.total} />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Acciones */}
          <div className='p-6 flex justify-end'>
            <Link
              href={`/ventas/${venta.id_venta}/imprimir`}
              target='_blank'
              rel='noopener noreferrer'
            >
              <button className='bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors'>
                Imprimir Factura
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
