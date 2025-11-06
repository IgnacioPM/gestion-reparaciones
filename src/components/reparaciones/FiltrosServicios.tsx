"use client"

import { Search, Filter } from "lucide-react";

interface FiltrosServiciosProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filtroEstado: string;
    setFiltroEstado: (estado: string) => void;
    fechaDesde: string;
    setFechaDesde: (fecha: string) => void;
    fechaHasta: string;
    setFechaHasta: (fecha: string) => void;
    setDateFilter: (filterType: "day" | "week" | "month") => void;
    estados: { value: string; label: string }[];
    showSearch?: boolean;
    onClearFilters: () => void;
}

export default function FiltrosServicios({
    searchQuery,
    setSearchQuery,
    filtroEstado,
    setFiltroEstado,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    setDateFilter,
    estados,
    showSearch = true,
    onClearFilters,
}: FiltrosServiciosProps) {
    return (
        <div className="w-full">
            <div className={`grid grid-cols-1 md:grid-cols-2 ${showSearch ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 mb-6 w-full`}>
                {showSearch && (
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
                )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-end w-full">
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
                <div className="flex justify-end">
                    <button onClick={onClearFilters} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:border-red-600 dark:hover:bg-red-700">Borrar Filtros</button>
                </div>
            </div>
        </div>
    )
}