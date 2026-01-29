'use client'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface FiltrosServiciosProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filtroEstado: string
  setFiltroEstado: (estado: string) => void
  fechaDesde: string
  setFechaDesde: (fecha: string) => void
  fechaHasta: string
  setFechaHasta: (fecha: string) => void
  setDateFilter: (filterType: 'day' | 'week' | 'month') => void
  estados: { value: string; label: string }[]
  showSearch?: boolean
  onClearFilters: () => void
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
    <div className='w-full'>
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${showSearch ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 mb-2 w-full`}
      >
        {showSearch && (
          <div className='lg:col-span-2'>
            <div className='relative'>
              <Input
                label='Buscar'
                id='search'
                type='text'
                className='pl-10'
                placeholder='Cliente, dispositivo, problema...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
        <div>
          <Select
            label='Estado'
            id='filtro-estado'
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            {estados.map((estadoOption) => (
              <option key={estadoOption.value} value={estadoOption.value}>
                {estadoOption.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end w-full'>
        <div>
          <Input
            label='Desde'
            id='fecha-desde'
            type='date'
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div>
          <Input
            label='Hasta'
            id='fecha-hasta'
            type='date'
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={() => setDateFilter('day')}
            className='h-10 px-4 text-sm font-medium border border-gray-200 bg-white transition hover:bg-gray-100
               dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
          >
            Día
          </Button>

          <Button
            onClick={() => setDateFilter('week')}
            className='h-10 px-4 text-sm font-medium border border-gray-200 bg-white transition hover:bg-gray-100
               dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
          >
            Semana
          </Button>

          <Button
            onClick={() => setDateFilter('month')}
            className='h-10 px-4 text-sm font-medium border border-gray-200 bg-white transition hover:bg-gray-100
               dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
          >
            Mes
          </Button>
        </div>

        <div className='flex justify-end'>
          <Button
            onClick={onClearFilters}
            className='px-4 py-2 text-sm font-medium bg-red-800 text-red-100 border border-red-600 rounded-md hover:bg-red-700'
          >
            Borrar Filtros
          </Button>
        </div>
      </div>
    </div>
  )
}
