'use client'
// Abono modal removed from compra detail (no abonos on purchases)
import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { InfoBlock } from '@/components/ui/InfoBlock'
import { InfoRow } from '@/components/ui/InfoRow'
import Navbar from '@/components/ui/Navbar'
import SectionTitle from '@/components/ui/SectionTitle'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { ProveedorMovimiento } from '@/types/compra'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { use, useEffect, useState } from 'react'

interface CompraDetalleItem {
  producto: {
    nombre: string
    fabricante: {
      nombre: string
    }
  }
  cantidad: number
  costo_unitario: number
  subtotal: number
  descuento_monto: number
  descuento_porcentaje: number | null
}

interface CompraConDetallesPage {
  id_compra: string
  proveedor_id: string
  fecha: string
  total: number
  metodo_pago: string | null
  total_descuento: number
  proveedor: {
    nombre: string
    telefono: string | null
    email: string | null
  } | null
  items: CompraDetalleItem[]
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

export default function DetalleCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { profile } = useAuthStore()
  const [compra, setCompra] = useState<CompraConDetallesPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abonos, setAbonos] = useState<ProveedorMovimiento[]>([])
  const searchParams = useSearchParams()
  // abonos not supported here

  useEffect(() => {
    const fetchCompra = async () => {
      if (!id) {
        setError('ID de compra no válido')
        return
      }

      try {
        const { data: compraData, error: compraError } = await supabase
          .from('compras')
          .select(
            `
            id_compra,
            proveedor_id,
            created_at,
            total,
            metodo_pago,
            total_descuento,
            proveedor:proveedores!inner (
              nombre,
              telefono,
              email
            ),
            compras_detalle (
              cantidad,
              costo_unitario,
              subtotal,
              descuento_monto,
              descuento_porcentaje,
              producto:productos!inner (
                nombre,
                fabricante:fabricantes (
                  nombre
                )
              )
            )
          `
          )
          .eq('id_compra', id)
          .single()

        if (compraError) {
          console.error('Supabase error:', compraError)
          throw new Error(compraError.message || 'Error en la consulta')
        }
        if (!compraData) throw new Error('Compra no encontrada')

        const mappedCompra: CompraConDetallesPage = {
          id_compra: compraData.id_compra,
          proveedor_id: compraData.proveedor_id,
          fecha: compraData.created_at || new Date().toISOString(),
          total: compraData.total,
          metodo_pago: compraData.metodo_pago,
          total_descuento: compraData.total_descuento,
          proveedor: Array.isArray(compraData.proveedor)
            ? compraData.proveedor?.[0] || null
            : compraData.proveedor || null,
          items: (compraData.compras_detalle || []).map((det: any) => ({
            cantidad: det.cantidad,
            costo_unitario: det.costo_unitario,
            subtotal: det.subtotal,
            descuento_monto: det.descuento_monto,
            descuento_porcentaje: det.descuento_porcentaje,
            producto: {
              nombre: det.producto?.nombre || '',
              fabricante: {
                nombre: det.producto?.fabricante?.nombre || 'Sin fabricante',
              },
            },
          })),
        }

        setCompra(mappedCompra)

        // Fetch abonos asociados a esta compra (si los hay)
        try {
          const { data: abonoData, error: abonoError } = await supabase
            .from('proveedores_movimientos')
            .select('*')
            .eq('compra_id', id)
            .eq('tipo', 'abono')
            .order('created_at', { ascending: true })

          if (abonoError) throw abonoError
          setAbonos(abonoData || [])
        } catch (err) {
          console.error('Error fetching abonos:', err)
        }
      } catch (err: any) {
        console.error('Error fetching compra:', err)
        const errorMessage =
          err?.message || err?.error_description || JSON.stringify(err) || 'Error desconocido'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchCompra()
  }, [id])

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center'>
        <span className='text-gray-600 dark:text-gray-300'>Cargando detalle de la compra...</span>
      </div>
    )
  }

  if (error || !compra) {
    return (
      <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
        <Navbar />
        <div className='container mx-auto px-4 py-8 text-center'>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
            Error al Cargar la Compra
          </h2>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>{error}</p>
          <Link
            href='/administrar/compras'
            className='mt-4 inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          >
            <ArrowLeft className='h-5 w-5 mr-2' />
            <span>Volver a compras</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <div className='mb-4'>
          {/* Back link: if came from movimientos, go back to proveedor movimientos; else go to compras list */}
          <Link
            href={
              searchParams?.get('from') === 'movimientos' && searchParams?.get('prov')
                ? `/administrar/proveedores-credito/${searchParams.get('prov')}`
                : '/administrar/compras'
            }
            className='flex items-center gap-2 text-gray-600 dark:text-gray-400'
          >
            <ArrowLeft className='h-5 w-5' /> Volver
          </Link>
        </div>
        {/* Detalles */}
        <div className='bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden'>
          <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Detalle de Compra</h1>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-6'>
            <InfoBlock title={<SectionTitle>Proveedor</SectionTitle>}>
              <InfoRow label='Nombre' value={compra.proveedor?.nombre || 'No especificado'} />
              <InfoRow label='Teléfono' value={compra.proveedor?.telefono} />
              <InfoRow label='Correo' value={compra.proveedor?.email} />
            </InfoBlock>

            <InfoBlock title={<SectionTitle>Compra</SectionTitle>}>
              <InfoRow label='Fecha' value={formatFechaSimple(compra.fecha)} />
              <InfoRow label='Método de Pago' value={compra.metodo_pago || 'No especificado'} />
              <InfoRow
                label='Total Descuento'
                value={<FormattedAmount amount={compra.total_descuento} />}
              />
              <InfoRow label='Total' value={<FormattedAmount amount={compra.total} />} />
            </InfoBlock>
          </div>

          {/* Items */}
          <div className='p-6'>
            <SectionTitle>Productos</SectionTitle>
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
                      Costo Unit.
                    </th>
                    <th scope='col' className='px-6 py-3 text-right'>
                      Descuento
                    </th>
                    <th scope='col' className='px-6 py-3 text-right'>
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compra.items.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b dark:border-gray-700 ${
                        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <th
                        scope='row'
                        className='px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white'
                      >
                        {item.producto.fabricante.nombre} {item.producto.nombre}
                      </th>
                      <td className='px-6 py-4'>{item.cantidad}</td>
                      <td className='px-6 py-4 text-right'>
                        <FormattedAmount amount={item.costo_unitario} />
                      </td>
                      <td className='px-6 py-4 text-right'>
                        <FormattedAmount amount={item.descuento_monto} />
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
                      Subtotal
                    </th>
                    <td colSpan={3}></td>
                    <td className='px-6 py-3 text-base text-right'>
                      <FormattedAmount amount={compra.total + compra.total_descuento} />
                    </td>
                  </tr>
                  {compra.total_descuento > 0 && (
                    <tr className='font-semibold text-gray-900 dark:text-white'>
                      <th scope='row' className='px-6 py-3 text-base'>
                        Total Descuento
                      </th>
                      <td colSpan={3}></td>
                      <td className='px-6 py-3 text-base text-right'>
                        <FormattedAmount amount={compra.total_descuento} />
                      </td>
                    </tr>
                  )}

                  {abonos.length > 0 && (
                    <tr className='font-semibold text-gray-900 dark:text-white'>
                      <th scope='row' className='px-6 py-3 text-base'>
                        Abonos asociados
                      </th>
                      <td colSpan={3}></td>
                      <td className='px-6 py-3 text-base text-right'>
                        <FormattedAmount amount={abonos.reduce((s, a) => s + (a.monto || 0), 0)} />
                      </td>
                    </tr>
                  )}

                  <tr className='font-semibold text-gray-900 dark:text-white'>
                    <th scope='row' className='px-6 py-3 text-base'>
                      Total (aplicable al saldo)
                    </th>
                    <td colSpan={3}></td>
                    <td className='px-6 py-3 text-base text-right'>
                      <FormattedAmount
                        amount={compra.total - abonos.reduce((s, a) => s + (a.monto || 0), 0)}
                      />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Acciones */}
          <div className='p-6 flex justify-end items-center gap-4'>
            <Link
              href={`/administrar/compras/${compra.id_compra}/imprimir`}
              target='_blank'
              rel='noopener noreferrer'
            >
              <button className='bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors'>
                Imprimir Compra
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
