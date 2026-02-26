'use client'

import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { supabase } from '@/lib/supabaseClient'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import FiltrosServicios from './FiltrosServicios'
import EstadoServicioModal from './EstadoServicioModal'

interface Servicio {
  id_reparacion: string
  numero_servicio: string | null
  equipo_id: string
  fecha_ingreso: string
  descripcion_falla: string | null
  estado: 'Recibido' | 'En revisión' | 'En reparacion' | 'Listo' | 'Entregado' | 'Anulado' | null
  costo_estimado: number | null
  nota_trabajo: string | null
  fecha_entrega: string | null
  costo_final: number | null
  creado_por: string | null
  creador: string // Mapeado a string
  equipo?: {
    tipos_dispositivo: { nombre: string } | null
    marcas: { nombre: string } | null
    modelo: string
    serie: string
    cliente?: {
      nombre: string
      telefono: string
    }
  }
}

export default function ServiciosTable() {
  const router = useRouter()
  const [allServicios, setAllServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false)
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estadoError, setEstadoError] = useState<string | null>(null)

  const estados = [
    { value: 'todos', label: 'Todos' },
    { value: 'Recibido', label: 'Recibido' },
    { value: 'En revisión', label: 'En revisión' },
    { value: 'En reparacion', label: 'En reparación' },
    { value: 'Listo', label: 'Listo' },
    { value: 'Entregado', label: 'Entregado' },
    { value: 'Anulado', label: 'Anulado' },
  ]

  // ---------------------- FETCH ----------------------
  useEffect(() => {
    const fetchServicios = async () => {
      setLoading(true)
      try {
        const query = supabase
          .from('servicios')
          .select(
            `
                        id_reparacion, numero_servicio, equipo_id, fecha_ingreso, descripcion_falla, estado,
                        costo_estimado, costo_final, nota_trabajo, fecha_entrega, creado_por,
                        creador:creado_por(nombre),
                        equipo:equipo_id(modelo, serie, cliente:cliente_id(nombre, telefono), tipo, marca)
                    `
          )
          .order('fecha_ingreso', { ascending: false })

        const { data, error } = await query

        if (error) throw error

        if (data) {
          const tipoDispositivoIds = new Set<string>()
          const marcaIds = new Set<string>()

          data.forEach((item) => {
            const equipo = Array.isArray(item.equipo) ? item.equipo[0] : item.equipo
            if (equipo?.tipo) tipoDispositivoIds.add(equipo.tipo)
            if (equipo?.marca) marcaIds.add(equipo.marca)
          })

          let tipoDispositivoMap = new Map<string, string>()
          if (tipoDispositivoIds.size > 0) {
            const { data: tipoData, error: tipoError } = await supabase
              .from('tipos_dispositivo')
              .select('id_tipo, nombre')
              .in('id_tipo', Array.from(tipoDispositivoIds))
            if (tipoError) throw tipoError
            tipoData?.forEach((td) => tipoDispositivoMap.set(td.id_tipo, td.nombre))
          }

          let marcaMap = new Map<string, string>()
          if (marcaIds.size > 0) {
            const { data: marcaData, error: marcaError } = await supabase
              .from('marcas')
              .select('id_marca, nombre')
              .in('id_marca', Array.from(marcaIds))
            if (marcaError) throw marcaError
            marcaData?.forEach((m) => marcaMap.set(m.id_marca, m.nombre))
          }

          const serviciosFormateados = data.map((item) => {
            const equipo = Array.isArray(item.equipo) ? item.equipo[0] : item.equipo
            const cliente = equipo
              ? Array.isArray(equipo.cliente)
                ? equipo.cliente[0]
                : equipo.cliente
              : undefined
            const creador = Array.isArray(item.creador) ? item.creador[0] : item.creador

            const tipoNombre = equipo?.tipo ? tipoDispositivoMap.get(equipo.tipo) : null
            const marcaNombre = equipo?.marca ? marcaMap.get(equipo.marca) : null

            return {
              ...item,
              creador: creador?.nombre ?? 'Desconocido',
              equipo: equipo
                ? {
                    ...equipo,
                    cliente,
                    tipos_dispositivo: tipoNombre ? { nombre: tipoNombre } : null,
                    marcas: marcaNombre ? { nombre: marcaNombre } : null,
                  }
                : undefined,
            }
          })

          setAllServicios(serviciosFormateados)
        }
      } catch (error: unknown) {
        console.error('Error al cargar servicios:', error)
        setAllServicios([])
      } finally {
        setLoading(false)
      }
    }

    fetchServicios()
  }, [])

  // ---------------------- FILTROS ----------------------
  const filteredServicios = useMemo(() => {
    return allServicios.filter((servicio) => {
      const searchLower = searchQuery.toLowerCase()

      const matchesSearch =
        searchQuery.trim() === '' ||
        servicio.numero_servicio?.toLowerCase().includes(searchLower) ||
        servicio.equipo?.cliente?.nombre?.toLowerCase().includes(searchLower) ||
        servicio.equipo?.cliente?.telefono?.toLowerCase().includes(searchLower) ||
        servicio.equipo?.tipos_dispositivo?.nombre?.toLowerCase().includes(searchLower) ||
        servicio.equipo?.marcas?.nombre?.toLowerCase().includes(searchLower) ||
        servicio.equipo?.modelo?.toLowerCase().includes(searchLower) ||
        servicio.descripcion_falla?.toLowerCase().includes(searchLower)

      const matchesEstado = filtroEstado === 'todos' || servicio.estado === filtroEstado

      const fechaIngreso = new Date(servicio.fecha_ingreso)
      const matchesFecha =
        (!fechaDesde || fechaIngreso >= new Date(fechaDesde + 'T00:00:00')) &&
        (!fechaHasta || fechaIngreso <= new Date(fechaHasta + 'T23:59:59'))

      return matchesSearch && matchesEstado && matchesFecha
    })
  }, [allServicios, searchQuery, filtroEstado, fechaDesde, fechaHasta])

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filtroEstado, fechaDesde, fechaHasta])

  // ---------------------- PAGINACIÓN ----------------------
  const paginatedServicios = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage
    return filteredServicios.slice(from, to)
  }, [filteredServicios, currentPage])

  const totalPages = Math.ceil(filteredServicios.length / itemsPerPage)
  const totalServicios = filteredServicios.length

  // ---------------------- SUMATORIA ----------------------
  const { totalCostoEstimado, totalCostoFinal } = useMemo(() => {
    return filteredServicios.reduce(
      (acc, servicio) => {
        acc.totalCostoEstimado += servicio.costo_estimado ?? 0
        acc.totalCostoFinal += servicio.costo_final ?? 0
        return acc
      },
      { totalCostoEstimado: 0, totalCostoFinal: 0 }
    )
  }, [filteredServicios])

  // ---------------------- UTILIDADES ----------------------
  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Recibido':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'En revisión':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'En reparacion':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'Listo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'Entregado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'Anulado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  const handleNewServicio = () => router.push('/servicios/nuevo')
  const handleViewServicio = (id: string | undefined) => {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      console.error('ID de servicio no válido:', id)
      return
    }
    router.push(`/servicios/${id}`)
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
      // month
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    }

    setFechaDesde(fromDate.toISOString().split('T')[0])
    setFechaHasta(toDate.toISOString().split('T')[0])
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFiltroEstado('todos')
    setFechaDesde('')
    setFechaHasta('')
  }

  const handleEstadoClick = (e: React.MouseEvent, servicio: Servicio) => {
    e.stopPropagation() // Evitar que se active el onClick de la fila
    setSelectedServicio(servicio)
    setIsEstadoModalOpen(true)
    setEstadoError(null)
  }

  const handleUpdateEstado = async (nuevoEstado: string) => {
    if (!selectedServicio) return

    try {
      setIsSubmitting(true)
      setEstadoError(null)

      const updateData: any = { estado: nuevoEstado }

      // Si el estado es "Entregado", actualizar la fecha de entrega
      if (nuevoEstado === 'Entregado') {
        updateData.fecha_entrega = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('servicios')
        .update(updateData)
        .eq('id_reparacion', selectedServicio.id_reparacion)

      if (updateError) throw updateError

      // Actualizar el estado local
      setAllServicios((prev) =>
        prev.map((s) =>
          s.id_reparacion === selectedServicio.id_reparacion
            ? { ...s, estado: nuevoEstado as Servicio['estado'], fecha_entrega: updateData.fecha_entrega ?? s.fecha_entrega }
            : s
        )
      )
      setIsEstadoModalOpen(false)
      setSelectedServicio(null)
    } catch (e: any) {
      console.error('Error actualizando estado:', e)
      setEstadoError(e.message || 'Error al actualizar el estado')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------------------- RENDER ----------------------
  return (
    <div className='w-full'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-end sm:justify-between items-start sm:items-center mb-6 gap-4'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Servicios</h1>
        <button
          onClick={handleNewServicio}
          className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors ml-auto'
        >
          <Plus className='w-5 h-5' />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Filtros */}
      <FiltrosServicios
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
        setDateFilter={setDateFilter}
        estados={estados}
        onClearFilters={handleClearFilters}
      />

      {/* Totales */}
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='p-4 bg-gray-100 dark:bg-gray-700 rounded-lg'>
          <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            Costo Estimado Total
          </h3>
          <p className='mt-1 text-2xl font-semibold text-gray-900 dark:text-white'>
            <FormattedAmount amount={totalCostoEstimado} />
          </p>
        </div>
        <div className='p-4 bg-gray-100 dark:bg-gray-700 rounded-lg'>
          <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            Costo Final Total
          </h3>
          <p className='mt-1 text-2xl font-semibold text-gray-900 dark:text-white'>
            <FormattedAmount amount={totalCostoFinal} />
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Nro. Servicio
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Cliente
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Dispositivo
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Problema
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Estado
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Fecha
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Costo Est.
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Costo Final
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Creado por
              </th>
            </tr>
          </thead>
          <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
            {loading ? (
              Array(itemsPerPage)
                .fill(0)
                .map((_, index) => (
                  <tr key={index} className='animate-pulse'>
                    {Array(9)
                      .fill(0)
                      .map((_, cellIndex) => (
                        <td key={cellIndex} className='px-6 py-4 whitespace-nowrap'>
                          <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'></div>
                        </td>
                      ))}
                  </tr>
                ))
            ) : paginatedServicios.length === 0 ? (
              <tr>
                <td colSpan={9} className='px-6 py-10 text-center text-gray-500 dark:text-gray-400'>
                  No hay servicios que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              paginatedServicios.map((servicio, index) => (
                <tr
                  key={servicio.id_reparacion}
                  className={`cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                  onClick={() => handleViewServicio(servicio.id_reparacion)}
                >
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                    {servicio.numero_servicio ?? '--'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-medium text-gray-900 dark:text-white'>
                      {servicio.equipo?.cliente?.nombre ?? 'N/A'}
                    </div>
                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                      {servicio.equipo?.cliente?.telefono ?? ''}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900 dark:text-white'>
                      {servicio.equipo?.tipos_dispositivo?.nombre ?? 'N/A'}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      {servicio.equipo?.marcas?.nombre ?? ''} {servicio.equipo?.modelo ?? ''}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-sm text-gray-900 dark:text-white line-clamp-2'>
                      {servicio.descripcion_falla ?? 'N/A'}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      onClick={(e) => servicio.estado !== 'Entregado' && handleEstadoClick(e, servicio)}
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        servicio.estado !== 'Entregado' 
                          ? 'cursor-pointer hover:opacity-80 transition-opacity' 
                          : 'cursor-not-allowed opacity-75'
                      } ${getBadgeColor(servicio.estado ?? 'Recibido')}`}
                      title={servicio.estado !== 'Entregado' ? 'Click para cambiar estado' : 'No se puede cambiar el estado de un servicio entregado'}
                    >
                      {estados.find((e) => e.value === servicio.estado)?.label ?? servicio.estado}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {formatDate(servicio.fecha_ingreso)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right'>
                    <FormattedAmount amount={servicio.costo_estimado ?? 0} />
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right'>
                    <FormattedAmount amount={servicio.costo_final ?? 0} />
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {servicio.creador}
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

      {/* Modal de cambio de estado */}
      <EstadoServicioModal
        isOpen={isEstadoModalOpen}
        onClose={() => {
          setIsEstadoModalOpen(false)
          setSelectedServicio(null)
          setEstadoError(null)
        }}
        onSave={handleUpdateEstado}
        isSubmitting={isSubmitting}
        currentEstado={selectedServicio?.estado || null}
        numeroServicio={selectedServicio?.numero_servicio || null}
        error={estadoError}
      />
    </div>
  )
}
