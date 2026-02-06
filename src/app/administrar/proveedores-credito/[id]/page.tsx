'use client'

import AbonoModal from '@/components/reparaciones/AbonoModal'
import Button from '@/components/ui/Button'
import Navbar from '@/components/ui/Navbar'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { ProveedorMovimiento } from '@/types/compra'
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

interface MovimientoConDetalles extends ProveedorMovimiento {
  proveedor?: {
    nombre: string
  }
}

export default function MovimientosProveedorPage() {
  const params = useParams()
  const proveedorId = params.id as string
  const { profile } = useAuthStore()
  const [proveedor, setProveedor] = useState<any>(null)
  const [movimientos, setMovimientos] = useState<MovimientoConDetalles[]>([])
  const [loading, setLoading] = useState(true)
  const [creditoSaldo, setCreditoSaldo] = useState<number>(0)
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false)

  const fetchMovimientos = async () => {
    if (!profile?.empresa_id) return

    try {
      const { data: movData, error: movError } = await supabase
        .from('proveedores_movimientos')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('proveedor_id', proveedorId)
        .order('created_at', { ascending: false })

      if (movError) throw movError
      setMovimientos(movData || [])
      // Refresh credito saldo after movimientos load
      try {
        await fetchCredito()
      } catch (err) {
        console.error('Error refreshing credito after movimientos:', err)
      }
    } catch (err) {
      console.error('Error fetching movimientos:', err)
      const msg = (err as any)?.message || JSON.stringify(err)
      toast.error(msg || 'Error al cargar movimientos')
    }
  }

  const fetchCredito = async () => {
    if (!profile?.empresa_id) return

    try {
      const { data: creditoData, error: creditoError } = await supabase
        .from('proveedores_credito')
        .select('saldo_actual, credito_inicial')
        .eq('proveedor_id', proveedorId)
        .eq('empresa_id', profile.empresa_id)
        .maybeSingle()

      if (creditoError) {
        console.error('Error fetching proveedor credit:', creditoError)
        setCreditoSaldo(0)
      } else if (creditoData) {
        setCreditoSaldo(creditoData.saldo_actual ?? 0)
      } else {
        setCreditoSaldo(0)
      }
    } catch (err) {
      console.error('Error fetching proveedor credit (catch):', err)
      setCreditoSaldo(0)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.empresa_id) return

      try {
        // Fetch proveedor (use maybeSingle to avoid throwing when not found)
        const { data: provData, error: provError } = await supabase
          .from('proveedores')
          .select('id_proveedor, nombre, email, telefono')
          .eq('id_proveedor', proveedorId)
          .eq('empresa_id', profile.empresa_id)
          .maybeSingle()

        if (provError) {
          const hasInfo =
            typeof provError === 'object' && provError !== null && Object.keys(provError).length > 0

          if (hasInfo) {
            console.error('Error fetching proveedor (response):', provError, { provData })
            const errMsg =
              (provError as any)?.message || (provError as any)?.code || JSON.stringify(provError)
            toast.error(errMsg || 'Error al cargar proveedor')
            return
          }
        }

        if (!provData) {
          console.warn('Proveedor no encontrado:', proveedorId)
          toast.error('Proveedor no encontrado')
          return
        }

        setProveedor(provData)

        // Fetch movimientos
        await fetchMovimientos()
      } catch (err) {
        console.error('Error fetching data:', err)
        toast.error('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile?.empresa_id, proveedorId])

  const router = useRouter()

  const totalCargos = movimientos
    .filter((m) => m.tipo === 'cargo')
    .reduce((sum, m) => sum + (m.monto || 0), 0)

  const totalAbonos = movimientos
    .filter((m) => m.tipo === 'abono')
    .reduce((sum, m) => sum + (m.monto || 0), 0)

  // Pagination for movimientos (client-side)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const paginatedMovimientos = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage
    return movimientos.slice(from, from + itemsPerPage)
  }, [movimientos, currentPage])

  const totalPages = Math.max(1, Math.ceil(movimientos.length / itemsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold dark:text-white'>
            Movimientos de {proveedor?.nombre || 'Proveedor'}
          </h1>
          <div className='flex gap-2'>
            <Button onClick={() => setIsAbonoModalOpen(true)} className='flex items-center gap-2'>
              <Plus className='h-5 w-5' /> Registrar Abono
            </Button>
            <Link href='/administrar/proveedores-credito'>
              <button className='flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'>
                <ArrowLeft className='h-5 w-5' /> Volver
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <p className='text-gray-600 dark:text-gray-400'>Cargando movimientos...</p>
        ) : (
          <>
            {/* Info Block */}
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
              <h2 className='text-lg font-semibold dark:text-white mb-4'>
                Información del Proveedor
              </h2>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Nombre</p>
                  <p className='text-lg font-semibold dark:text-white'>{proveedor?.nombre}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Correo</p>
                  <p className='text-lg dark:text-white'>{proveedor?.email || 'No especificado'}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Teléfono</p>
                  <p className='text-lg dark:text-white'>
                    {proveedor?.telefono || 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className='grid grid-cols-3 gap-4 mb-6'>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>Total Cargos</p>
                <p className='text-2xl font-bold text-red-600'>
                  ₡{totalCargos.toLocaleString('es-CR')}
                </p>
              </div>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>Total Abonos</p>
                <p className='text-2xl font-bold text-green-600'>
                  ₡{totalAbonos.toLocaleString('es-CR')}
                </p>
              </div>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>Saldo Actual</p>
                <p
                  className={`text-2xl font-bold ${creditoSaldo > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  ₡{Number(creditoSaldo).toLocaleString('es-CR')}
                </p>
              </div>
            </div>

            {/* Tabla de Movimientos */}
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow'>
              {movimientos.length === 0 ? (
                <p className='px-6 py-4 text-gray-600 dark:text-gray-400'>
                  No hay movimientos registrados
                </p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='text-xs font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700'>
                        <th className='px-6 py-3 text-left'>Fecha</th>
                        <th className='px-6 py-3 text-left'>Tipo</th>
                        <th className='px-6 py-3 text-right'>Monto</th>
                        <th className='px-6 py-3 text-left'>Método Pago</th>
                        <th className='px-6 py-3 text-left'>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMovimientos.map((mov) => (
                        <tr
                          key={mov.id_movimiento}
                          tabIndex={mov.tipo === 'cargo' && mov.compra_id ? 0 : undefined}
                          onClick={() => {
                            if (mov.tipo === 'cargo' && mov.compra_id) {
                              router.push(
                                `/administrar/compras/${mov.compra_id}?from=movimientos&prov=${proveedorId}`
                              )
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              (e.key === 'Enter' || e.key === ' ') &&
                              mov.tipo === 'cargo' &&
                              mov.compra_id
                            ) {
                              e.preventDefault()
                              router.push(
                                `/administrar/compras/${mov.compra_id}?from=movimientos&prov=${proveedorId}`
                              )
                            }
                          }}
                          className={`border-b dark:border-gray-700 ${mov.tipo === 'cargo' && mov.compra_id ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' : ''}`}
                        >
                          <td className='px-6 py-4 dark:text-gray-300'>
                            {new Date(mov.created_at || '').toLocaleDateString('es-CR')}
                          </td>
                          <td className='px-6 py-4'>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                mov.tipo === 'cargo'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}
                            >
                              {mov.tipo === 'cargo' ? 'Cargo (Compra)' : 'Abono (Pago)'}
                            </span>
                          </td>
                          <td className='px-6 py-4 text-right font-semibold dark:text-white'>
                            ₡{(mov.monto || 0).toLocaleString('es-CR')}
                          </td>
                          <td className='px-6 py-4 dark:text-gray-300'>{mov.metodo_pago || '-'}</td>
                          <td className='px-6 py-4 dark:text-gray-300'>{mov.descripcion || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className='flex items-center justify-end gap-3 mt-3 px-4'>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className='rounded-md p-2 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-700'
                title='Página anterior'
              >
                <ChevronLeft />
              </button>

              <span className='text-sm'>
                {currentPage} / {totalPages}
              </span>

              <button
                title='Página siguiente'
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className='rounded-md p-2 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-700'
              >
                <ChevronRight />
              </button>
            </div>
          </>
        )}
      </main>

      <AbonoModal
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        proveedorId={proveedorId}
        empresaId={profile?.empresa_id || ''}
        onAbonoCreated={fetchMovimientos}
      />
    </div>
  )
}
