"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface Servicio {
    id_reparacion: string
    equipo_id: string
    fecha_ingreso: string
    descripcion_falla: string | null
    estado: "Recibido" | "En reparacion" | "Listo" | "Entregado" | null
    costo_estimado: number | null
    nota_trabajo: string | null
    fecha_entrega: string | null
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
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalServicios, setTotalServicios] = useState(0)
    const itemsPerPage = 10

    // Estados posibles de un servicio
    const estados = [
        { value: "todos", label: "Todos" },
        { value: "Recibido", label: "Recibido" },
        { value: "En reparacion", label: "En reparación" },
        { value: "Listo", label: "Listo" },
        { value: "Entregado", label: "Entregado" }
    ]

    // Color de badge según estado
    const getBadgeColor = (estado: string) => {
        switch (estado) {
            case "Recibido": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
            case "En reparacion": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
            case "Listo": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            case "Entregado": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }
    }

    // Formatear fecha para mostrar
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('es', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date)
    }

    // Navegar a la página de nuevo servicio
    const handleNewServicio = () => {
        router.push("/servicios/nuevo")
    }

    // Navegar a la página de detalle de servicio
    const handleViewServicio = (id: string | undefined) => {
        // Validación más estricta del ID
        if (!id || id === 'undefined' || id === 'null') {
            console.error("ID de servicio no válido o no definido:", id);
            return;
        }

        // Verificar formato UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            console.error("ID no tiene formato UUID válido:", id);
            return;
        }

        console.log("Navegando a servicio con ID:", id);
        router.push(`/servicios/${id}`);
    }

    // Cargar servicios desde Supabase
    useEffect(() => {
        const fetchServicios = async () => {
            setLoading(true)
            try {
                // Calcular paginación
                const from = (currentPage - 1) * itemsPerPage
                const to = from + itemsPerPage - 1

                console.log("Cargando servicios - página:", currentPage);

                // Construir la consulta base
                let query = supabase
                    .from('servicios')
                    .select(`
                        id_reparacion,
                        equipo_id,
                        fecha_ingreso,
                        descripcion_falla,
                        estado,
                        costo_estimado,
                        costo_final,
                        nota_trabajo,
                        fecha_entrega,
                        equipo:equipo_id(
                            tipo,
                            marca,
                            modelo,
                            serie,
                            cliente:cliente_id(
                                nombre,
                                telefono
                            )
                        )
                    `, { count: 'exact' })

                // Aplicar filtros
                if (filtroEstado !== "todos") {
                    query = query.eq('estado', filtroEstado)
                }

                // No aplicar filtros en la consulta, filtrar en el frontend

                // Aplicar paginación y ordenar por fecha más reciente
                const { data, error, count } = await query
                    .order('fecha_ingreso', { ascending: false })
                    .range(from, to)

                if (error) {
                    throw error
                }

                if (data && count !== null) {
                    // Transformar los datos para que coincidan con nuestra interfaz Servicio
                    let serviciosFormateados = data.map(item => {
                        // Si equipo es array, tomar el primero
                        const equipo = Array.isArray(item.equipo) ? item.equipo[0] : item.equipo;
                        // Si cliente es array, tomar el primero
                        const cliente = equipo && Array.isArray(equipo.cliente) ? equipo.cliente[0] : equipo?.cliente;
                        return {
                            id_reparacion: item.id_reparacion,
                            equipo_id: item.equipo_id,
                            fecha_ingreso: item.fecha_ingreso,
                            descripcion_falla: item.descripcion_falla,
                            estado: item.estado || 'Recibido',
                            costo_estimado: item.costo_estimado,
                            costo_final: item.costo_final,
                            nota_trabajo: item.nota_trabajo,
                            fecha_entrega: item.fecha_entrega,
                            equipo: equipo ? {
                                tipo: equipo.tipo,
                                marca: equipo.marca,
                                modelo: equipo.modelo,
                                serie: equipo.serie,
                                cliente: cliente ? {
                                    nombre: cliente && !Array.isArray(cliente) ? cliente.nombre : undefined,
                                    telefono: cliente && !Array.isArray(cliente) ? cliente.telefono : undefined
                                } : undefined
                            } : undefined
                        }
                    });

                    // Filtrar en el frontend por los tres campos (OR)
                    if (searchQuery.trim() !== "") {
                        const q = searchQuery.trim().toLowerCase();
                        serviciosFormateados = serviciosFormateados.filter(s => {
                            const problema = s.descripcion_falla?.toLowerCase() || "";
                            const dispositivo = s.equipo?.tipo?.toLowerCase() || "";
                            const cliente = s.equipo?.cliente?.nombre?.toLowerCase() || "";
                            return (
                                problema.includes(q) ||
                                dispositivo.includes(q) ||
                                cliente.includes(q)
                            );
                        });
                    }

                    setServicios(serviciosFormateados)
                    setTotalServicios(serviciosFormateados.length)
                    setTotalPages(Math.ceil(serviciosFormateados.length / itemsPerPage))
                }
            } catch (error) {
                if (error && typeof error === 'object' && 'message' in error) {
                    console.error('Error al cargar servicios:', error.message)
                } else {
                    console.error('Error al cargar servicios:', error)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchServicios()
    }, [currentPage, filtroEstado, searchQuery])

    return (
        <div className="w-full">
            {/* Header con título y botón de nuevo servicio */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Servicios</h1>
                <button
                    onClick={handleNewServicio}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Servicio</span>
                </button>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-grow relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100
                     shadow-sm focus:border-blue-500 dark:focus:border-blue-400 
                     focus:ring-blue-500 dark:focus:ring-blue-400"
                        placeholder="Buscar por cliente, dispositivo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="w-full md:w-64">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-400" />
                        <select
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-800 
                        text-gray-900 dark:text-gray-100
                        shadow-sm focus:border-blue-500 dark:focus:border-blue-400 
                        focus:ring-blue-500 dark:focus:ring-blue-400"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            aria-label="Filtrar por estado"
                        >
                            {estados.map((estado) => (
                                <option key={estado.value} value={estado.value}>
                                    {estado.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabla de servicios */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Cliente
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Dispositivo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Problema
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Estado
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Fecha
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            Array(5).fill(0).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                    </td>
                                </tr>
                            ))
                        ) : servicios.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    No hay servicios registrados
                                </td>
                            </tr>
                        ) : (
                            servicios.map((servicio) => (
                                <tr
                                    key={servicio.id_reparacion}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    onClick={() => handleViewServicio(servicio.id_reparacion)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {servicio.equipo?.cliente?.nombre || 'Cliente no disponible'}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {servicio.equipo?.cliente?.telefono || 'Teléfono no disponible'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{servicio.equipo?.tipo || 'N/A'}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {servicio.equipo?.marca || 'N/A'} {servicio.equipo?.modelo || ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                            {servicio.descripcion_falla || 'Sin descripción'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(servicio.estado || 'Recibido')}`}>
                                            {estados.find(e => e.value === servicio.estado)?.label || servicio.estado || 'Recibido'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(servicio.fecha_ingreso)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    {totalServicios > 0 ? (
                        <>
                            Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                            <span className="font-medium">
                                {Math.min(currentPage * itemsPerPage, totalServicios)}
                            </span>{" "}
                            de <span className="font-medium">{totalServicios}</span> resultados
                        </>
                    ) : (
                        "No hay resultados"
                    )}
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