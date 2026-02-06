'use client'

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { supabase } from '@/lib/supabaseClient'

import { mapVentaList } from '@/mappers/ventaList.mapper'
import { VentaListItem } from '@/types/venta_list_item'
import { VentaListRow } from '@/types/venta_list_row'

export default function VentasTable() {
  const router = useRouter()

  const [allVentas, setAllVentas] = useState<VentaListItem[]>([])
  const [loading, setLoading] = useState(true)

  // ---------------------- FILTROS ----------------------
  const [searchQuery, setSearchQuery] = useState('')
  const [metodoPago, setMetodoPago] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [montoMin, setMontoMin] = useState('')
  const [montoMax, setMontoMax] = useState('')

  // ---------------------- PAGINACIÓN ----------------------
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // ---------------------- FETCH ----------------------
  useEffect(() => {
    const fetchVentas = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('ventas')
        .select(
          `
          id_venta,
          total,
          metodo_pago,
          created_at,
          cliente:clientes!ventas_cliente_id_fkey!inner (
            nombre,
            telefono
          ),
          detalle:ventas_detalle (
            cantidad,
            producto:producto_id (
              nombre
            )
          )
        `
        )
        .order('created_at', { ascending: false })
        .returns<VentaListRow[]>()

      if (!error && data) {
        setAllVentas(data.map(mapVentaList))
      } else if (error) {
        console.error('Error cargando ventas:', error)
      }

      setLoading(false)
    }

    fetchVentas()
  }, [])

  // ---------------------- FILTRADO ----------------------
  const filteredVentas = useMemo(() => {
    return allVentas.filter((venta) => {
      const search = searchQuery.toLowerCase()

      const matchesSearch =
        searchQuery.trim() === '' ||
        venta.cliente?.nombre?.toLowerCase().includes(search) ||
        venta.cliente?.telefono?.toLowerCase().includes(search) ||
        venta.productos_preview.toLowerCase().includes(search) ||
        venta.metodo_pago?.toLowerCase().includes(search)

      const matchesMetodo = metodoPago === 'todos' || venta.metodo_pago === metodoPago

      const fechaVenta = venta.created_at ? new Date(venta.created_at) : null
      const matchesFecha =
        (!fechaDesde || (fechaVenta && fechaVenta >= new Date(fechaDesde + 'T00:00:00'))) &&
        (!fechaHasta || (fechaVenta && fechaVenta <= new Date(fechaHasta + 'T23:59:59')))

      const matchesMontoMin = !montoMin || venta.total >= Number(montoMin)
      const matchesMontoMax = !montoMax || venta.total <= Number(montoMax)

      return matchesSearch && matchesMetodo && matchesFecha && matchesMontoMin && matchesMontoMax
    })
  }, [allVentas, searchQuery, metodoPago, fechaDesde, fechaHasta, montoMin, montoMax])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, metodoPago, fechaDesde, fechaHasta, montoMin, montoMax])

  // ---------------------- PAGINADO ----------------------
  const paginatedVentas = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage
    return filteredVentas.slice(from, from + itemsPerPage)
  }, [filteredVentas, currentPage])

  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage)

  const totalVentas = useMemo(
    () => filteredVentas.reduce((acc, v) => acc + v.total, 0),
    [filteredVentas]
  )

  // ---------------------- UTIL ----------------------
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))

  const clearFilters = () => {
    setSearchQuery('')
    setMetodoPago('todos')
    setFechaDesde('')
    setFechaHasta('')
    setMontoMin('')
    setMontoMax('')
  }

  // Quick date filters: day | week | month
  const setDateFilter = (filterType: 'day' | 'week' | 'month') => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let fromDate: Date, toDate: Date
    if (filterType === 'day') {
      fromDate = today
      toDate = today
    } else if (filterType === 'week') {
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
      fromDate = new Date(today.setDate(diff))
      toDate = new Date(new Date(fromDate).setDate(fromDate.getDate() + 6))
    } else {
      // month
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    }

    setFechaDesde(fromDate.toISOString().split('T')[0])
    setFechaHasta(toDate.toISOString().split('T')[0])
  }

  const handleNewVenta = () => router.push('/ventas/nueva')
  const handleViewVenta = (id: string) => router.push(`/ventas/${id}`)
  const handleGoProductos = () => router.push('/administrar/productos')

  // ---------------------- RENDER ----------------------
  return (
    <div className='w-full py-4 space-y-4'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-end sm:justify-between items-start sm:items-center mb-4 gap-4'>
        <h1 className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>Ventas</h1>

        <div className='flex items-center gap-3'>
          <button
            onClick={handleGoProductos}
            className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition'
          >
            Administrar productos
          </button>

          <button
            onClick={handleNewVenta}
            className='inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition'
          >
            <Plus className='w-4 h-4' />
            Nueva venta
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6'>
        {/* Search (full width on small) */}
        <div className='lg:col-span-2'>
          <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1'>
            Buscar
          </label>
          <input
            type='text'
            placeholder='Cliente, teléfono, producto, método...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
          />
        </div>

        {/* Metodo pago
        <div>
          <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1'>
            Método de pago
          </label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
          >
            <option value='todos'>Todos</option>
            <option value='efectivo'>Efectivo</option>
            <option value='sinpe'>Sinpe</option>
            <option value='tarjeta'>Tarjeta</option>
          </select>
        </div> */}

        {/* Fecha desde */}
        <div>
          <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1'>
            Fecha desde
          </label>
          <input
            type='date'
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
          />
        </div>

        {/* Fecha hasta + quick filters */}
        <div>
          <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1'>
            Fecha hasta
          </label>
          <div className='flex items-center gap-2'>
            <input
              type='date'
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className='flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
            />
            <div className='flex gap-1'>
              <button
                onClick={() => setDateFilter('day')}
                className='min-w-[56px] rounded-md px-3 py-2 text-sm font-medium border border-gray-200 bg-white transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                title='Hoy'
              >
                Día
              </button>

              <button
                onClick={() => setDateFilter('week')}
                className='min-w-[72px] rounded-md px-3 py-2 text-sm font-medium border border-gray-200 bg-white transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                title='Semana'
              >
                Semana
              </button>

              <button
                onClick={() => setDateFilter('month')}
                className='min-w-[64px] rounded-md px-3 py-2 text-sm font-medium border border-gray-200 bg-white transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                title='Mes'
              >
                Mes
              </button>
            </div>
          </div>
        </div>

        {/* Monto min */}

        {/* <div>
          <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1'>
            Monto mínimo
          </label>
          <input
            type='number'
            placeholder='₡'
            value={montoMin}
            onChange={(e) => setMontoMin(e.target.value)}
            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
          />
        </div> */}

        {/* Monto max */}
        {/* <div>
          <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1'>
            Monto máximo
          </label>
          <input
            type='number'
            placeholder='₡'
            value={montoMax}
            onChange={(e) => setMontoMax(e.target.value)}
            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
          />
        </div> */}
      </div>

      {/* Totales + acciones */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='rounded-lg bg-gray-100 p-4 dark:bg-gray-800 flex-1'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>Total ventas filtradas</p>
          <div className='mt-1 flex items-center justify-between'>
            <p className='text-2xl font-semibold'>
              <FormattedAmount amount={totalVentas} />
            </p>
            <button onClick={clearFilters} className='text-sm underline'>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Cliente
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Productos
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Método
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Fecha
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Total
              </th>
            </tr>
          </thead>

          <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
            {loading ? (
              Array(itemsPerPage)
                .fill(0)
                .map((_, index) => (
                  <tr key={index} className='animate-pulse'>
                    {Array(5)
                      .fill(0)
                      .map((_, cellIndex) => (
                        <td key={cellIndex} className='px-6 py-4 whitespace-nowrap'>
                          <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'></div>
                        </td>
                      ))}
                  </tr>
                ))
            ) : paginatedVentas.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-6 py-10 text-center text-gray-500 dark:text-gray-400'>
                  Sin resultados
                </td>
              </tr>
            ) : (
              paginatedVentas.map((venta) => (
                <tr
                  key={venta.id_venta}
                  onClick={() => handleViewVenta(venta.id_venta)}
                  className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                >
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='font-medium text-gray-900 dark:text-white'>
                      {venta.cliente?.nombre || 'Consumidor final'}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      {venta.cliente?.telefono || ''}
                    </div>
                  </td>
                  <td className='px-6 py-4'>{venta.productos_preview}</td>
                  <td className='px-6 py-4'>{venta.metodo_pago || '—'}</td>
                  <td className='px-6 py-4'>{venta.created_at && formatDate(venta.created_at)}</td>
                  <td className='px-6 py-4 text-right font-semibold text-gray-900 dark:text-white'>
                    <FormattedAmount amount={venta.total} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className='flex justify-end items-center gap-2 mt-4'>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className='p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50'
          >
            <ChevronLeft />
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className='p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50'
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  )
}
