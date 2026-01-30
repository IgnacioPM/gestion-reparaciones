'use client'

import ProductoAddModal from '@/components/productos/ProductoAddModal'
import ProductoEditModal from '@/components/productos/ProductoEditModal'
import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { supabase } from '@/lib/supabaseClient'
import { ProductoFormData } from '@/schemas/producto'
import { useAuthStore } from '@/stores/auth'
import { ChevronLeft, ChevronRight, Edit, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

// =====================
// TIPOS
// =====================

interface Fabricante {
  id_fabricante: string
  nombre: string
}

interface Producto {
  id_producto: string
  nombre: string
  descripcion: string | null
  codigo_barras: string | null
  tipo: 'venta' | 'repuesto' | 'ambos'
  precio_venta: number
  costo: number | null
  stock_actual: number
  stock_minimo: number | null
  activo: boolean | null
  id_fabricante: string | null
  fabricante?: {
    id_fabricante: string
    nombre: string
  } | null
}

export default function ProductosTable() {
  const router = useRouter()
  const { profile } = useAuthStore()

  const [allProductos, setAllProductos] = useState<Producto[]>([])
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFabricante, setSelectedFabricante] = useState<string>('')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showAddModal, setShowAddModal] = useState(false)
  const [editProducto, setEditProducto] = useState<Producto | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =====================
  // HANDLERS
  // =====================

  const handleNewProducto = () => setShowAddModal(true)
  const handleEditProducto = (producto: Producto) => setEditProducto(producto)

  // =====================
  // FETCH
  // =====================

  const fetchInitialData = async (empresaId: string) => {
    setLoading(true)
    try {
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select(
          `
          *,
          fabricante:fabricantes (
            id_fabricante,
            nombre
          )
        `
        )
        .eq('empresa_id', empresaId)
        .order('nombre', { ascending: true })

      if (productosError) throw productosError

      const normalizedProductos: Producto[] = (productosData ?? []).map((p: any) => ({
        id_producto: p.id_producto,
        nombre: p.nombre,
        descripcion: p.descripcion ?? null,
        codigo_barras: p.codigo_barras ?? null,
        tipo: p.tipo,
        precio_venta: Number(p.precio_venta) ?? 0,
        costo: p.costo != null ? Number(p.costo) : null,
        stock_actual: Number(p.stock_actual) ?? 0,
        stock_minimo: p.stock_minimo != null ? Number(p.stock_minimo) : null,
        activo: p.activo != null ? Boolean(p.activo) : null,
        id_fabricante: p.id_fabricante ?? p.fabricante?.id_fabricante ?? null,
        fabricante: p.fabricante ?? null,
      }))

      setAllProductos(normalizedProductos)

      const { data: fabricantesData, error: fabricantesError } = await supabase
        .from('fabricantes')
        .select('id_fabricante, nombre')
        .eq('empresa_id', empresaId)
        .order('nombre', { ascending: true })

      if (fabricantesError) throw fabricantesError

      setFabricantes((fabricantesData ?? []) as Fabricante[])
    } catch (err) {
      console.error('Error cargando productos:', err)
      setAllProductos([])
      setFabricantes([])
    } finally {
      setLoading(false)
    }
  }

  // =====================
  // ESPERAR PROFILE
  // =====================

  useEffect(() => {
    if (profile?.empresa_id) {
      fetchInitialData(profile.empresa_id)
    }
  }, [profile?.empresa_id])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedFabricante])

  // =====================
  // FILTROS
  // =====================

  const filteredProductos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return allProductos.filter((p) => {
      const nombreMatches = p.nombre.toLowerCase().includes(q)
      const codigoMatches = p.codigo_barras?.toLowerCase().includes(q) ?? false

      const fabricanteNombre =
        p.fabricante?.nombre ||
        fabricantes.find((f) => f.id_fabricante === p.id_fabricante)?.nombre ||
        ''

      const fabricanteMatches = fabricanteNombre.toLowerCase().includes(q)

      const matchesQuery = q === '' || nombreMatches || codigoMatches || fabricanteMatches

      const matchesFabricante =
        !selectedFabricante ||
        p.id_fabricante === selectedFabricante ||
        p.fabricante?.id_fabricante === selectedFabricante

      return matchesQuery && matchesFabricante
    })
  }, [allProductos, searchQuery, selectedFabricante, fabricantes])

  // =====================
  // PAGINACIÓN
  // =====================

  const paginatedProductos = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage
    return filteredProductos.slice(from, from + itemsPerPage)
  }, [filteredProductos, currentPage, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredProductos.length / itemsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // =====================
  // GUARDAR / ACTUALIZAR
  // =====================

  const handleSaveProducto = async (data: ProductoFormData) => {
    if (!profile?.empresa_id) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.from('productos').insert({
        ...data,
        empresa_id: profile.empresa_id,
      })

      if (error) throw error
      setShowAddModal(false)
      fetchInitialData(profile.empresa_id)
    } catch {
      setError('Error al guardar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProducto = async (data: ProductoFormData) => {
    if (!editProducto || !profile?.empresa_id) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('productos')
        .update(data)
        .eq('id_producto', editProducto.id_producto)

      if (error) throw error
      setEditProducto(null)
      fetchInitialData(profile.empresa_id)
    } catch {
      setError('Error al actualizar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =====================
  // JSX
  // =====================

  return (
    <div className='w-full space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>Productos</h1>
        <button
          onClick={handleNewProducto}
          className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md'
        >
          <Plus className='w-5 h-5' />
          Nuevo Producto
        </button>
      </div>

      <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Producto</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Fabricante</th>
              <th className='px-6 py-3 text-right text-xs font-medium uppercase'>Precio</th>
              <th className='px-6 py-3 text-right text-xs font-medium uppercase'>Stock</th>
              <th className='px-6 py-3 text-right text-xs font-medium uppercase'>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProductos.map((p) => (
              <tr key={p.id_producto}>
                <td className='px-6 py-4'>{p.nombre}</td>
                <td className='px-6 py-4'>{p.fabricante?.nombre || '—'}</td>
                <td className='px-6 py-4 text-right'>
                  <FormattedAmount amount={p.precio_venta} />
                </td>
                <td className='px-6 py-4 text-right'>{p.stock_actual}</td>
                <td className='px-6 py-4 text-right'>
                  <button onClick={() => handleEditProducto(p)}>
                    <Edit className='w-4 h-4' />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex items-center justify-end gap-3'>
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

      <ProductoAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveProducto}
        isSubmitting={isSubmitting}
        error={error}
        fabricantesIniciales={fabricantes}
      />

      {editProducto && (
        <ProductoEditModal
          isOpen
          initialData={editProducto as any}
          onClose={() => setEditProducto(null)}
          onSave={handleUpdateProducto}
          isSubmitting={isSubmitting}
          error={error}
          fabricantesIniciales={fabricantes}
        />
      )}
    </div>
  )
}
