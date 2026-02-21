'use client'

import ProductoAddModal from '@/components/productos/ProductoAddModal'
import ProductoEditModal from '@/components/productos/ProductoEditModal'
import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { supabase } from '@/lib/supabaseClient'
import { ProductoFormData } from '@/schemas/producto'
import { useAuthStore } from '@/stores/auth'
import { translateSupabaseError } from '@/utils/supabase-db-errors'
import { ChevronLeft, ChevronRight, Edit, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  proveedor?: {
    id_proveedor: string
    nombre: string
  } | null
}

export default function ProductosTable() {
  const router = useRouter()
  const { profile } = useAuthStore()

  const [allProductos, setAllProductos] = useState<Producto[]>([])
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([])
  const [proveedores, setProveedores] = useState<{ id_proveedor: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFabricante, setSelectedFabricante] = useState<string>('')
  const [selectedProveedor, setSelectedProveedor] = useState<string>('')

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
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedFabricante('')
    setSelectedProveedor('')
    setCurrentPage(1)
    // focus en buscador
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }

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
        proveedor: null,
      }))

      // obtener relaciones producto_proveedores para mapear proveedores a productos (evita enviar id_proveedor al insertar productos)
      const productIds = normalizedProductos.map((p) => p.id_producto)
      if (productIds.length > 0) {
        const { data: relacionesData, error: relacionesError } = await supabase
          .from('producto_proveedores')
          .select('id_producto, id_proveedor, proveedor:proveedores ( id_proveedor, nombre )')
          .in('id_producto', productIds)

        if (!relacionesError && relacionesData) {
          const proveedorMap = new Map<string, { id_proveedor: string; nombre: string }>()
          ;(relacionesData as any[]).forEach((r) => {
            const prov = r.proveedor || r.proveedores || null
            if (r.id_producto && (r.id_proveedor || prov)) {
              proveedorMap.set(r.id_producto, {
                id_proveedor: r.id_proveedor ?? prov?.id_proveedor,
                nombre: prov?.nombre ?? prov?.nombre ?? r.nombre,
              })
            }
          })

          // asignar proveedor a cada producto (si existe)
          for (const p of normalizedProductos) {
            p.proveedor = proveedorMap.get(p.id_producto) ?? null
          }
        }
      }

      setAllProductos(normalizedProductos)

      const { data: fabricantesData, error: fabricantesError } = await supabase
        .from('fabricantes')
        .select('id_fabricante, nombre')
        .eq('empresa_id', empresaId)
        .order('nombre', { ascending: true })

      if (fabricantesError) throw fabricantesError

      setFabricantes((fabricantesData ?? []) as Fabricante[])
      // cargar proveedores para el filtro
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('proveedores')
        .select('id_proveedor, nombre')
        .eq('empresa_id', empresaId)
        .order('nombre', { ascending: true })

      if (!proveedoresError) setProveedores(proveedoresData ?? [])
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
  }, [searchQuery, selectedFabricante, selectedProveedor])

  // =====================
  // FILTROS
  // =====================

  const filteredProductos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return allProductos.filter((p) => {
      const nombreMatches = p.nombre.toLowerCase().includes(q)
      const descripcionMatches = p.descripcion?.toLowerCase().includes(q) ?? false
      const codigoMatches = p.codigo_barras?.toLowerCase().includes(q) ?? false

      const fabricanteNombre =
        p.fabricante?.nombre ||
        fabricantes.find((f) => f.id_fabricante === p.id_fabricante)?.nombre ||
        ''
      const fabricanteMatches = fabricanteNombre.toLowerCase().includes(q)

      const proveedorNombre = p.proveedor?.nombre ?? ''
      const proveedorMatches = proveedorNombre.toLowerCase().includes(q)

      const matchesQuery =
        q === '' ||
        nombreMatches ||
        descripcionMatches ||
        codigoMatches ||
        fabricanteMatches ||
        proveedorMatches

      const matchesFabricante =
        !selectedFabricante ||
        p.id_fabricante === selectedFabricante ||
        p.fabricante?.id_fabricante === selectedFabricante

      const matchesProveedor = !selectedProveedor || p.proveedor?.id_proveedor === selectedProveedor

      return matchesQuery && matchesFabricante && matchesProveedor
    })
  }, [allProductos, searchQuery, selectedFabricante, selectedProveedor, fabricantes])

  const { totalPrecioVentaFiltrado, totalCostoFiltrado } = useMemo(() => {
    return filteredProductos.reduce(
      (acc, producto) => {
        acc.totalPrecioVentaFiltrado += producto.precio_venta ?? 0
        acc.totalCostoFiltrado += producto.costo ?? 0
        return acc
      },
      { totalPrecioVentaFiltrado: 0, totalCostoFiltrado: 0 }
    )
  }, [filteredProductos])

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

  const handleSaveProducto = async (data: ProductoFormData & { id_proveedor?: string | null }) => {
    if (!profile?.empresa_id) return

    setIsSubmitting(true)
    setError(null)

    const { id_proveedor, ...productPayload } = data as any

    try {
      const { data: newProduct, error: insertError } = await supabase
        .from('productos')
        .insert({
          ...productPayload,
          empresa_id: profile.empresa_id,
        })
        .select('id_producto')
        .single()

      if (insertError) throw insertError

      // si viene proveedor, crear relación en producto_proveedores
      if (id_proveedor && newProduct?.id_producto) {
        const { error: relError } = await supabase.from('producto_proveedores').insert({
          id_producto: newProduct.id_producto,
          id_proveedor,
        })

        if (relError) throw relError
      }

      setShowAddModal(false)
      fetchInitialData(profile.empresa_id)
    } catch (e: any) {
      console.error('Error al guardar el producto:', e)
      setError(translateSupabaseError(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProducto = async (
    data: ProductoFormData & { id_proveedor?: string | null }
  ) => {
    if (!editProducto || !profile?.empresa_id) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { id_proveedor, ...productPayload } = data as any

      const { error: updateError } = await supabase
        .from('productos')
        .update(productPayload)
        .eq('id_producto', editProducto.id_producto)

      if (updateError) throw updateError

      // sincronizar tabla producto_proveedores: eliminar relaciones previas y crear la nueva si aplica
      const { error: delError } = await supabase
        .from('producto_proveedores')
        .delete()
        .eq('id_producto', editProducto.id_producto)
      if (delError) throw delError

      if (id_proveedor) {
        const { error: relError } = await supabase.from('producto_proveedores').insert({
          id_producto: editProducto.id_producto,
          id_proveedor,
        })

        if (relError) throw relError
      }

      setEditProducto(null)
      fetchInitialData(profile.empresa_id)
    } catch (e: any) {
      console.error('Error al actualizar el producto:', e)
      setError(translateSupabaseError(e))
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

      <div className='mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end'>
        <div className='lg:col-span-2'>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1'>
            Buscar
          </label>
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Buscar por producto, descripción, código, fabricante o proveedor'
            className='w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1'>
            Proveedor
          </label>
          <select
            value={selectedProveedor}
            onChange={(e) => setSelectedProveedor(e.target.value)}
            className='w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800'
          >
            <option value=''>Todos</option>
            {proveedores.map((pr) => (
              <option key={pr.id_proveedor} value={pr.id_proveedor}>
                {pr.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1'>
            Marca
          </label>
          <select
            value={selectedFabricante}
            onChange={(e) => setSelectedFabricante(e.target.value)}
            className='w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800'
          >
            <option value=''>Todos</option>
            {fabricantes.map((f) => (
              <option key={f.id_fabricante} value={f.id_fabricante}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            type='button'
            onClick={handleClearFilters}
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-yellow-400 text-black hover:bg-yellow-500'
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-b border-gray-200 dark:border-gray-700'>
          <div className='p-3 bg-gray-100 dark:bg-gray-700 rounded-lg'>
            <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>Total Precio Venta</h3>
            <p className='mt-1 text-xl font-semibold text-gray-900 dark:text-white'>
              <FormattedAmount amount={totalPrecioVentaFiltrado} />
            </p>
          </div>

          <div className='p-3 bg-gray-100 dark:bg-gray-700 rounded-lg'>
            <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>Total Costo</h3>
            <p className='mt-1 text-xl font-semibold text-gray-900 dark:text-white'>
              <FormattedAmount amount={totalCostoFiltrado} />
            </p>
          </div>
        </div>

        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Código</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Proveedor</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Producto</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Fabricante</th>
              <th className='px-6 py-3 text-right text-xs font-medium uppercase'>Costo</th>
              <th className='px-6 py-3 text-right text-xs font-medium uppercase'>Precio</th>
              <th className='px-6 py-3 text-right text-xs font-medium uppercase'>Stock</th>
              <th className='px-6 py-3 text-right text-xs font-medium uppercase'>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProductos.map((p) => (
              <tr key={p.id_producto}>
                <td className='px-6 py-4 text-sm text-gray-600 dark:text-gray-400'>
                  {p.codigo_barras || '—'}
                </td>
                <td className='px-6 py-4'>{p.proveedor?.nombre || '—'}</td>
                <td className='px-6 py-4'>{p.nombre}</td>
                <td className='px-6 py-4'>{p.fabricante?.nombre || '—'}</td>
                <td className='px-6 py-4 text-right'>
                  {p.costo != null ? <FormattedAmount amount={p.costo} /> : '—'}
                </td>
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
