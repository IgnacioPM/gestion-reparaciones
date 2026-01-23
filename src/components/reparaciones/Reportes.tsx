'use client'

import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { supabase } from '@/lib/supabaseClient'
import { ServicioConNombres } from '@/types/servicio' // Asegúrate de apuntar al archivo correcto
import { Eye, Table } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import FiltrosServicios from './FiltrosServicios'
import ReportesTable from './ReportesTable'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919']

export default function Reportes() {
  const [servicios, setServicios] = useState<ServicioConNombres[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [showTable, setShowTable] = useState(false)

  const handleClearFilters = () => {
    setFiltroEstado('todos')
    setFechaDesde('')
    setFechaHasta('')
  }

  const estados = useMemo(
    () => [
      { value: 'todos', label: 'Todos' },
      { value: 'Recibido', label: 'Recibido' },
      { value: 'En revisión', label: 'En revisión' },
      { value: 'En reparacion', label: 'En reparación' },
      { value: 'Listo', label: 'Listo' },
      { value: 'Entregado', label: 'Entregado' },
      { value: 'Anulado', label: 'Anulado' },
    ],
    []
  )

  const setDateFilter = (filterType: 'day' | 'week' | 'month') => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filterType === 'day') {
      setFechaDesde(today.toISOString().split('T')[0])
      setFechaHasta(today.toISOString().split('T')[0])
    } else if (filterType === 'week') {
      const firstDayOfWeek = new Date(today)
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      firstDayOfWeek.setDate(diff)
      setFechaDesde(firstDayOfWeek.toISOString().split('T')[0])
      setFechaHasta(
        new Date(firstDayOfWeek.setDate(firstDayOfWeek.getDate() + 6)).toISOString().split('T')[0]
      )
    } else if (filterType === 'month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      setFechaDesde(firstDayOfMonth.toISOString().split('T')[0])
      setFechaHasta(lastDayOfMonth.toISOString().split('T')[0])
    }
  }

  useEffect(() => {
    const fetchServicios = async () => {
      setLoading(true)
      try {
        let query = supabase.from('servicios').select(`
          id_reparacion,
          numero_servicio,
          equipo_id,
          fecha_ingreso,
          descripcion_falla,
          estado,
          costo_estimado,
          costo_final,
          nota_trabajo,
          fecha_entrega,
          equipo:equipo_id (
            tipo,
            marca,
            modelo,
            serie
          )
        `)

        if (filtroEstado !== 'todos') query = query.eq('estado', filtroEstado)
        if (fechaDesde) query = query.gte('fecha_ingreso', fechaDesde)
        if (fechaHasta) query = query.lte('fecha_ingreso', `${fechaHasta}T23:59:59`)

        const { data, error } = await query
        if (error) throw error
        if (!data) {
          setServicios([])
          return
        }

        // Normalizamos equipo si viene en array
        const serviciosConEquipo: ServicioConNombres[] = data.map((s) => ({
          ...s,
          equipo: Array.isArray(s.equipo) ? s.equipo[0] : s.equipo,
        }))

        // Obtenemos ids de tipo y marca para traer nombres
        const tipoIds = new Set<string>()
        const marcaIds = new Set<string>()
        serviciosConEquipo.forEach((s) => {
          if (s.equipo?.tipo) tipoIds.add(s.equipo.tipo)
          if (s.equipo?.marca) marcaIds.add(s.equipo.marca)
        })

        let tipoData: { id_tipo: string; nombre: string }[] = []
        if (tipoIds.size > 0) {
          const { data: td, error: e } = await supabase
            .from('tipos_dispositivo')
            .select('id_tipo, nombre')
            .in('id_tipo', Array.from(tipoIds))
          if (e) throw e
          tipoData = td || []
        }
        const tipoMap = new Map<string, string>()
        tipoData.forEach((t) => tipoMap.set(t.id_tipo, t.nombre))

        let marcaData: { id_marca: string; nombre: string }[] = []
        if (marcaIds.size > 0) {
          const { data: md, error: e } = await supabase
            .from('marcas')
            .select('id_marca, nombre')
            .in('id_marca', Array.from(marcaIds))
          if (e) throw e
          marcaData = md || []
        }
        const marcaMap = new Map<string, string>()
        marcaData.forEach((m) => marcaMap.set(m.id_marca, m.nombre))

        const serviciosFinales: ServicioConNombres[] = serviciosConEquipo.map((s) => ({
          ...s,
          equipo: s.equipo
            ? {
                ...s.equipo,
                tipos_dispositivo: s.equipo.tipo
                  ? { id_tipo: s.equipo.tipo, nombre: tipoMap.get(s.equipo.tipo) || s.equipo.tipo }
                  : undefined,
                marcas: s.equipo.marca
                  ? {
                      id_marca: s.equipo.marca,
                      nombre: marcaMap.get(s.equipo.marca) || s.equipo.marca,
                    }
                  : undefined,
              }
            : undefined,
        }))

        setServicios(serviciosFinales)
      } catch (error: unknown) {
        if (error instanceof Error) console.error('Error al cargar servicios:', error.message)
        else console.error('Error al cargar servicios:', String(error))
      } finally {
        setLoading(false)
      }
    }

    fetchServicios()
  }, [filtroEstado, fechaDesde, fechaHasta])

  // Gráficos y cálculos
  const dataPorEstado = useMemo(() => {
    const data = new Map<string, number>()
    estados.forEach((e) => {
      if (e.value !== 'todos') data.set(e.label, 0)
    })
    servicios.forEach((s) => {
      const estadoLabel = estados.find((e) => e.value === s.estado)?.label
      if (estadoLabel) data.set(estadoLabel, (data.get(estadoLabel) || 0) + 1)
    })
    return Array.from(data, ([name, value]) => ({ name, servicios: value }))
  }, [servicios, estados])

  const { totalCostoEstimado, totalCostoFinal } = useMemo(() => {
    return servicios.reduce(
      (acc, s) => {
        acc.totalCostoEstimado += s.costo_estimado || 0
        acc.totalCostoFinal += s.costo_final || 0
        return acc
      },
      { totalCostoEstimado: 0, totalCostoFinal: 0 }
    )
  }, [servicios])

  const dataPorMarca = useMemo(() => {
    const data = new Map<string, number>()
    servicios.forEach((s) => {
      const nombre = s.equipo?.marcas?.nombre
      if (nombre) data.set(nombre, (data.get(nombre) || 0) + 1)
    })
    return Array.from(data, ([name, value]) => ({ name, servicios: value })).sort(
      (a, b) => b.servicios - a.servicios
    )
  }, [servicios])

  const dataPorTipo = useMemo(() => {
    const data = new Map<string, number>()
    servicios.forEach((s) => {
      const nombre = s.equipo?.tipos_dispositivo?.nombre
      if (nombre) data.set(nombre, (data.get(nombre) || 0) + 1)
    })
    return Array.from(data, ([name, value]) => ({ name, servicios: value })).sort(
      (a, b) => b.servicios - a.servicios
    )
  }, [servicios])

  const dataPorDia = useMemo(() => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const data = new Map<string, number>()
    dias.forEach((dia) => data.set(dia, 0))
    servicios.forEach((s) => {
      const dia = dias[new Date(s.fecha_ingreso).getDay()]
      data.set(dia, (data.get(dia) || 0) + 1)
    })
    return Array.from(data, ([name, value]) => ({ name, servicios: value }))
  }, [servicios])

  const fallasComunes = useMemo(() => {
    const data = new Map<string, number>()
    servicios.forEach((s) => {
      if (s.descripcion_falla) {
        const falla = s.descripcion_falla.trim().toLowerCase()
        data.set(falla, (data.get(falla) || 0) + 1)
      }
    })
    return Array.from(data, ([name, value]) => ({ name, count: value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [servicios])

  return (
    <div className='w-full'>
      <FiltrosServicios
        searchQuery=''
        setSearchQuery={() => {}}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
        setDateFilter={setDateFilter}
        estados={estados}
        showSearch={false}
        onClearFilters={handleClearFilters}
      />

      <div className='flex justify-start md:justify-end mt-4'>
        <button
          onClick={() => setShowTable(!showTable)}
          className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors'
        >
          {showTable ? <Eye className='w-5 h-5' /> : <Table className='w-5 h-5' />}
          <span>{showTable ? 'Ocultar Tabla' : 'Mostrar Tabla'}</span>
        </button>
      </div>

      {showTable && (
        <div className='mt-6'>
          <ReportesTable servicios={servicios} loading={loading} />
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6'>
        <div className='lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Fallas Más Comunes
          </h3>
          {loading ? (
            <div className='space-y-2'>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className='h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse'
                ></div>
              ))}
            </div>
          ) : fallasComunes.length > 0 ? (
            <ul className='space-y-2'>
              {fallasComunes.map((falla, index) => (
                <li
                  key={index}
                  className='flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md'
                >
                  <span className='text-sm font-medium text-gray-800 dark:text-gray-200 capitalize truncate'>
                    {falla.name}
                  </span>
                  <span className='text-sm font-bold text-blue-600 dark:text-blue-400'>
                    {falla.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              No hay datos de fallas disponibles.
            </p>
          )}
        </div>

        <div className='lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Totales</h3>
          <div className='grid grid-cols-2 gap-4'>
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
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Servicios por Estado
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={dataPorEstado}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='servicios' fill='#3b82f6' />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Servicios por Marca
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={dataPorMarca}
                dataKey='servicios'
                nameKey='name'
                cx='50%'
                cy='50%'
                outerRadius={80}
                label
              >
                {dataPorMarca.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Servicios por Tipo de Dispositivo
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={dataPorTipo}
                dataKey='servicios'
                nameKey='name'
                cx='50%'
                cy='50%'
                outerRadius={80}
                label
              >
                {dataPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Servicios por Día de la Semana
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={dataPorDia}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='servicios' fill='#8884d8' />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
