"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"
import { FormattedAmount } from "@/components/ui/FormattedAmount"

interface Servicio {
    id_reparacion: string
    numero_servicio: string | null
    equipo_id: string
    fecha_ingreso: string
    descripcion_falla: string | null
    estado: "Recibido" | "En revisión" | "En reparacion" | "Listo" | "Entregado" | "Anulado" | null
    costo_estimado: number | null
    nota_trabajo: string | null
    fecha_entrega: string | null
    costo_final: number | null
    creado_por: string | null
    creador: string // Mapeado a string
    equipo?: {
        tipo: string
        marca: string
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
    const [servicios, setServicios] = useState<Servicio[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filtroEstado, setFiltroEstado] = useState<string>("todos")
    const [fechaDesde, setFechaDesde] = useState<string>("")
    const [fechaHasta, setFechaHasta] = useState<string>("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalServicios, setTotalServicios] = useState(0)
    const itemsPerPage = 10

    const estados = [
        { value: "todos", label: "Todos" },
        { value: "Recibido", label: "Recibido" },
        { value: "En revisión", label: "En revisión" },
        { value: "En reparacion", label: "En reparación" },
        { value: "Listo", label: "Listo" },
        { value: "Entregado", label: "Entregado" },
        { value: "Anulado", label: "Anulado" },
    ]

    const getBadgeColor = (estado: string) => {
        switch (estado) {
            case "Recibido": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
            case "En revisión": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
            case "En reparacion": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
            case "Listo": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            case "Entregado": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            case "Anulado": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('es', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
    }

    const handleNewServicio = () => router.push("/servicios/nuevo")

    const handleViewServicio = (id: string | undefined) => {
        if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
            console.error("ID de servicio no válido:", id)
            return
        }
        router.push(`/servicios/${id}`)
    }

    const setDateFilter = (filterType: "day" | "week" | "month") => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (filterType === "day") {
            setFechaDesde(today.toISOString().split('T')[0])
            setFechaHasta(today.toISOString().split('T')[0])
        } else if (filterType === "week") {
            const firstDayOfWeek = new Date(today)
            const day = today.getDay()
            const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
            firstDayOfWeek.setDate(diff)
            setFechaDesde(firstDayOfWeek.toISOString().split('T')[0])
            setFechaHasta(new Date(firstDayOfWeek.setDate(firstDayOfWeek.getDate() + 6)).toISOString().split('T')[0])
        } else if (filterType === "month") {
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
                const from = (currentPage - 1) * itemsPerPage
                const to = from + itemsPerPage - 1

                let query = supabase
                    .from('servicios')
                    .select(`
                        id_reparacion, numero_servicio, equipo_id, fecha_ingreso, descripcion_falla, estado,
                        costo_estimado, costo_final, nota_trabajo, fecha_entrega, creado_por,
                        creador:creado_por(nombre),
                        equipo:equipo_id(tipo, marca, modelo, serie, cliente:cliente_id(nombre, telefono))
                    `, { count: 'exact' })

                if (filtroEstado !== "todos") query = query.eq('estado', filtroEstado)
                if (fechaDesde) query = query.gte('fecha_ingreso', fechaDesde)
                if (fechaHasta) query = query.lte('fecha_ingreso', `${fechaHasta}T23:59:59`)

                const { data, error, count } = await query
                    .order('fecha_ingreso', { ascending: false })
                    .range(from, to)

                if (error) throw error

                if (data && count !== null) {
                    let serviciosFormateados = data.map(item => {
                        const equipo = Array.isArray(item.equipo) ? item.equipo[0] : item.equipo
                        const cliente = equipo && (Array.isArray(equipo.cliente) ? equipo.cliente[0] : equipo.cliente)
                        const creador = Array.isArray(item.creador) ? item.creador[0] : item.creador

                        return {
                            ...item,
                            creador: creador ? creador.nombre : 'Desconocido',
                            equipo: equipo ? { ...equipo, cliente } : undefined
                        }
                    })

                    if (searchQuery.trim() !== "") {
                        const q = searchQuery.trim().toLowerCase()
                        serviciosFormateados = serviciosFormateados.filter(s =>
                            s.descripcion_falla?.toLowerCase().includes(q) ||
                            s.equipo?.tipo?.toLowerCase().includes(q) ||
                            s.equipo?.marca?.toLowerCase().includes(q) ||
                            s.equipo?.modelo?.toLowerCase().includes(q) ||
                            s.equipo?.cliente?.nombre?.toLowerCase().includes(q)
                        )
                    }

                    setServicios(serviciosFormateados)
                    setTotalServicios(count)
                    setTotalPages(Math.ceil(count / itemsPerPage))
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error('Error al cargar servicios:', error.message)
                } else {
                    console.error('Error al cargar servicios:', error)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchServicios()
    }, [currentPage, filtroEstado, searchQuery, fechaDesde, fechaHasta])

    const { totalCostoEstimado, totalCostoFinal } = useMemo(() => {
        return servicios.reduce((acc, servicio) => {
            acc.totalCostoEstimado += servicio.costo_estimado || 0
            acc.totalCostoFinal += servicio.costo_final || 0
            return acc
        }, { totalCostoEstimado: 0, totalCostoFinal: 0 })
    }, [servicios])

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-end sm:justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Servicios</h1>
                <button
                    onClick={handleNewServicio}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors ml-auto"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Servicio</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="lg:col-span-2">
                    <label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Buscar</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="search"
                            className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                            placeholder="Cliente, dispositivo, problema..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="filtro-estado" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Estado</label>
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-400" />
                        <select
                            id="filtro-estado"
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            aria-label="Filtrar por estado"
                        >
                            {estados.map((estado) => (
                                <option key={estado.value} value={estado.value}>{estado.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-end">
                <div>
                    <label htmlFor="fecha-desde" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Desde</label>
                    <input
                        type="date"
                        id="fecha-desde"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="fecha-hasta" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Hasta</label>
                    <input
                        type="date"
                        id="fecha-hasta"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setDateFilter("day")} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Día</button>
                    <button onClick={() => setDateFilter("week")} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Semana</button>
                    <button onClick={() => setDateFilter("month")} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Mes</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Costo Estimado Total</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                        <FormattedAmount amount={totalCostoEstimado} />
                    </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Costo Final Total</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                        <FormattedAmount amount={totalCostoFinal} />
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nro. Servicio</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dispositivo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Problema</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Costo Est.</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Costo Final</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Creado por</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            Array(itemsPerPage).fill(0).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    {Array(9).fill(0).map((_, cellIndex) => (
                                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : servicios.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    No hay servicios que coincidan con los filtros aplicados.
                                </td>
                            </tr>
                        ) : (
                            servicios.map((servicio) => (
                                <tr
                                    key={servicio.id_reparacion}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    onClick={() => handleViewServicio(servicio.id_reparacion)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{servicio.numero_servicio || '--'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{servicio.equipo?.cliente?.nombre || 'N/A'}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{servicio.equipo?.cliente?.telefono || ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{servicio.equipo?.tipo || 'N/A'}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{servicio.equipo?.marca || ''} {servicio.equipo?.modelo || ''}</div>
                                    </td>
                                    <td className="px-6 py-4"><div className="text-sm text-gray-900 dark:text-white line-clamp-2">{servicio.descripcion_falla || 'N/A'}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(servicio.estado || 'Recibido')}`}>
                                            {estados.find(e => e.value === servicio.estado)?.label || servicio.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(servicio.fecha_ingreso)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right"><FormattedAmount amount={servicio.costo_estimado} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right"><FormattedAmount amount={servicio.costo_final} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{servicio.creador}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    {totalServicios > 0 ? (
                        <>
                            Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalServicios)}</span> de{" "}
                            <span className="font-medium">{totalServicios}</span> resultados
                        </>
                    ) : "No hay resultados"}
                </div>
                <div className="flex gap-2">
                    <button
                        className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        aria-label="Página anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        aria-label="Página siguiente"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}