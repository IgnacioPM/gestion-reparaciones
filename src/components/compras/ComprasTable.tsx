'use client'

import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

interface CompraListItem {
  id_compra: string
  created_at: string
  total: number
  metodo_pago: string | null
  proveedor: {
    nombre: string
  } | null
}

interface Props {
  compras: CompraListItem[]
  loading: boolean
}

export default function ComprasTable({ compras, loading }: Props) {
  const router = useRouter()
  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)

  // ---------------------- FILTROS ----------------------
  const [searchQuery, setSearchQuery] = useState('')
  const [metodoPago, setMetodoPago] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const filteredCompras = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return compras.filter((compra) => {
      const provName = (compra.proveedor && (compra.proveedor as any).nombre) || ''
      const matchesSearch =
        q === '' || provName.toLowerCase().includes(q) || compra.id_compra.toLowerCase().includes(q)

      const matchesMetodo = metodoPago === 'todos' || compra.metodo_pago === metodoPago

      const fechaCompra = compra.created_at ? new Date(compra.created_at) : null
      const matchesFecha =
        (!fechaDesde || (fechaCompra && fechaCompra >= new Date(fechaDesde + 'T00:00:00'))) &&
        (!fechaHasta || (fechaCompra && fechaCompra <= new Date(fechaHasta + 'T23:59:59')))

      return matchesSearch && matchesMetodo && matchesFecha
    })
  }, [compras, searchQuery, metodoPago, fechaDesde, fechaHasta])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, metodoPago, fechaDesde, fechaHasta])

  const paginatedCompras = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage
    return filteredCompras.slice(from, from + itemsPerPage)
  }, [filteredCompras, currentPage, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredCompras.length / itemsPerPage))

  const totalCompras = useMemo(
    () => filteredCompras.reduce((acc, c) => acc + c.total, 0),
    [filteredCompras]
  )

  // temporary debug removed

  const handleView = (id: string) => router.push(`/administrar/compras/${id}`)
  const handleNewCompra = () => router.push('/administrar/compras/nueva')

  const clearFilters = () => {
    setSearchQuery('')
    setMetodoPago('todos')
    setFechaDesde('')
    setFechaHasta('')
  }

  const setDateFilter = (filterType: 'day' | 'week' | 'month') => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let fromDate: Date, toDate: Date
    if (filterType === 'day') {
      fromDate = today
      toDate = today
    } else if (filterType === 'week') {
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      fromDate = new Date(today.setDate(diff))
      toDate = new Date(new Date(fromDate).setDate(fromDate.getDate() + 6))
    } else {
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    }

    setFechaDesde(fromDate.toISOString().split('T')[0])
    setFechaHasta(toDate.toISOString().split('T')[0])
  }

  return (
    <div className='w-full py-4 space-y-4'>
      <div className='flex flex-col sm:flex-row justify-end sm:justify-between items-start sm:items-center mb-4 gap-4'>
        <h1 className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>Compras</h1>

        <div className='flex items-center gap-3'>
          <button
            onClick={handleNewCompra}
            className='inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition'
          >
            <Plus className='w-4 h-4' />
            Nueva compra
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6'>
        <div className='lg:col-span-2'>
          <label className='block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1'>
            Buscar
          </label>
          <input
            type='text'
            placeholder='ID, proveedor...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
          />
        </div>

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
      </div>

      {/* Totales + acciones */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='rounded-lg bg-gray-100 p-4 dark:bg-gray-800 flex-1'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>Total compras filtradas</p>
          <div className='mt-1 flex items-center justify-between'>
            <p className='text-2xl font-semibold'>
              <FormattedAmount amount={totalCompras} />
            </p>
            <button onClick={clearFilters} className='text-sm underline'>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                ID Compra
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Proveedor
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Fecha
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Método Pago
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
            ) : filteredCompras.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-6 py-10 text-center text-gray-500 dark:text-gray-400'>
                  No hay compras registradas
                </td>
              </tr>
            ) : (
              paginatedCompras.map((compra, index) => (
                <tr
                  key={compra.id_compra}
                  onClick={() => handleView(compra.id_compra)}
                  className={`cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='font-medium text-gray-900 dark:text-white'>
                      {compra.id_compra.slice(0, 8)}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    {(() => {
                      const provAny: any = (compra as any).proveedor
                      if (!provAny) return 'No especificado'
                      if (Array.isArray(provAny)) return provAny[0]?.nombre || 'No especificado'
                      if (typeof provAny === 'object' && provAny.nombre) return provAny.nombre
                      return String(provAny) || 'No especificado'
                    })()}
                  </td>
                  <td className='px-6 py-4'>
                    {new Date(compra.created_at).toLocaleDateString('es-CR')}
                  </td>
                  <td className='px-6 py-4'>{compra.metodo_pago || 'No especificado'}</td>
                  <td className='px-6 py-4 text-right font-semibold text-gray-900 dark:text-white'>
                    <FormattedAmount amount={compra.total} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className='flex items-center justify-end gap-3 mt-3'>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className='rounded-md p-2 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-700'
        >
          <ChevronLeft />
        </button>

        <span className='text-sm'>
          {currentPage} / {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className='rounded-md p-2 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-700'
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  )
}
