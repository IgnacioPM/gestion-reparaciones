'use client'

import ClienteForm, { Cliente } from '@/components/forms/ClienteForm'
import ProductoAddModal from '@/components/productos/ProductoAddModal'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { supabase } from '@/lib/supabaseClient'
import { mapProductoConFabricante, Producto } from '@/mappers/producto.mapper'
import { ProductoFormData } from '@/schemas/producto'
import { useAuthStore } from '@/stores/auth'
import { ProductoConFabricanteRow } from '@/types/producto_con_fabricante'
import { ArrowLeft, Minus, Plus, Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface VentaItem {
  producto: Producto
  cantidad: number
}

export default function NuevaVentaPage() {
  const router = useRouter()
  const { profile } = useAuthStore()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [items, setItems] = useState<VentaItem[]>([])
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'sinpe'>('efectivo')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Producto[]>([])

  const [isAddProductModalOpen, setAddProductModalOpen] = useState(false)
  const [fabricantes, setFabricantes] = useState<{ id_fabricante: string; nombre: string }[]>([])
  const [isSubmittingNewProduct, setIsSubmittingNewProduct] = useState(false)
  const [newProductError, setNewProductError] = useState<string | null>(null)

  /* =========================
     CLIENTE GENÉRICO
     ========================= */
  useEffect(() => {
    if (!profile?.empresa_id) return

    const fetchClienteGenerico = async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .ilike('nombre', 'consumidor final')
        .single()

      if (error) {
        console.error('Error cargando cliente genérico:', error)
        return
      }

      setCliente(data)
    }

    fetchClienteGenerico()
  }, [profile?.empresa_id])

  /* =========================
     PRODUCTOS Y FABRICANTES
     ========================= */
  useEffect(() => {
    if (!profile?.empresa_id) return

    const fetchProductos = supabase
      .from('productos')
      .select(
        `
    id_producto,
    empresa_id,
    nombre,
    descripcion,
    codigo_barras,
    tipo,
    precio_venta,
    costo,
    stock_actual,
    stock_minimo,
    activo,
    created_at,
    fabricante:fabricantes (
      id_fabricante,
      nombre
    )
    `
      )
      .eq('empresa_id', profile.empresa_id)
      .eq('activo', true)
      .gt('stock_actual', 0)
      .order('nombre')
      .returns<ProductoConFabricanteRow[]>() // ← 🔥 ESTO

    const fetchFabricantes = supabase
      .from('fabricantes')
      .select('id_fabricante, nombre')
      .eq('empresa_id', profile.empresa_id)
      .order('nombre')

    Promise.all([fetchProductos, fetchFabricantes]).then(([productosRes, fabricantesRes]) => {
      if (productosRes.error) {
        console.error(productosRes.error)
      } else if (productosRes.data) {
        const productos = productosRes.data.map(mapProductoConFabricante)
        setProductos(productos)
      }

      if (fabricantesRes.error) {
        console.error(fabricantesRes.error)
      } else if (fabricantesRes.data) {
        setFabricantes(fabricantesRes.data)
      }
    })
  }, [profile?.empresa_id])

  /* =========================
     BÚSQUEDA / ESCÁNER
     ========================= */
  useEffect(() => {
    if (!query.trim()) {
      setResultados([])
      return
    }

    const exacto = productos.find((p) => p.codigo_barras && p.codigo_barras === query)

    if (exacto) {
      addProducto(exacto)
      return
    }

    if (query.length < 2) {
      setResultados([])
      return
    }

    const q = query.toLowerCase()

    setResultados(
      productos
        .filter(
          (p) => p.nombre.toLowerCase().includes(q) || p.fabricante.nombre.toLowerCase().includes(q)
        )
        .slice(0, 10)
    )
  }, [query, productos])

  /* =========================
     LÓGICA ITEMS
     ========================= */
  const addProducto = (producto: Producto) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.producto.id_producto === producto.id_producto)

      if (existing) {
        if (existing.cantidad >= producto.stock_actual) {
          setError('Stock insuficiente')
          return prev
        }

        return prev.map((i) =>
          i.producto.id_producto === producto.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }

      return [...prev, { producto, cantidad: 1 }]
    })

    setQuery('')
    setResultados([])
  }

  const updateCantidad = (id: string, cantidad: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.producto.id_producto === id
          ? {
              ...item,
              cantidad: Math.min(Math.max(1, cantidad), item.producto.stock_actual),
            }
          : item
      )
    )
  }

  const total = items.reduce((acc, item) => acc + item.cantidad * item.producto.precio_venta, 0)

  /* =========================
     SUBMIT
     ========================= */
  const handleSubmit = async () => {
    if (!items.length) return setError('Debe agregar productos')
    if (!cliente) return setError('No se pudo determinar el cliente')

    setIsSubmitting(true)
    setError(null)

    try {
      let clienteId = cliente.id_cliente

      // Si el cliente tiene id 'nuevo', es nuevo y hay que crearlo
      if (clienteId === 'nuevo') {
        const { data: newClient, error: clientError } = await supabase
          .from('clientes')
          .insert({
            empresa_id: profile?.empresa_id,
            nombre: cliente.nombre,
            telefono: cliente.telefono || null,
            correo: cliente.correo || null,
          })
          .select('id_cliente')
          .single()

        if (clientError) throw clientError
        clienteId = newClient.id_cliente
      }

      const { data: venta, error } = await supabase
        .from('ventas')
        .insert({
          empresa_id: profile?.empresa_id,
          cliente_id: clienteId,
          total,
          metodo_pago: metodoPago,
        })
        .select()
        .single()

      if (error) throw error

      for (const item of items) {
        await supabase.from('ventas_detalle').insert({
          venta_id: venta.id_venta,
          producto_id: item.producto.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio_venta,
          subtotal: item.cantidad * item.producto.precio_venta,
        })

        await supabase.rpc('descontar_stock', {
          p_producto_id: item.producto.id_producto,
          p_cantidad: item.cantidad,
        })
      }

      router.push(`/ventas/${venta.id_venta}`)
    } catch (e: any) {
      setError(e.message || 'Error al registrar la venta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFabricanteAdded = (nuevoFabricante: { id_fabricante: string; nombre: string }) => {
    setFabricantes((prev) => [...prev, nuevoFabricante])
  }

  const handleSaveNewProduct = async (
    data: ProductoFormData & { id_proveedor?: string | null }
  ) => {
    if (!profile?.empresa_id) {
      toast.error('No hay empresa asociada al usuario')
      return
    }

    setIsSubmittingNewProduct(true)
    setNewProductError(null)

    try {
      const { id_proveedor, ...productPayload } = data as any

      const { data: newProduct, error } = await supabase
        .from('productos')
        .insert({
          ...productPayload,
          empresa_id: profile.empresa_id,
        })
        .select(
          `
        id_producto,
        empresa_id,
        nombre,
        descripcion,
        codigo_barras,
        tipo,
        precio_venta,
        costo,
        stock_actual,
        stock_minimo,
        activo,
        created_at,
        fabricante:fabricantes (
          id_fabricante,
          nombre
        )
      `
        )
        .returns<ProductoConFabricanteRow[]>()
        .single()

      if (error) throw error
      if (!newProduct) throw new Error('No se pudo crear el producto')

      // si hay proveedor seleccionado, crear relación
      if (id_proveedor && newProduct.id_producto) {
        const { error: relError } = await supabase.from('producto_proveedores').insert({
          id_producto: newProduct.id_producto,
          id_proveedor,
        })

        if (relError) throw relError
      }

      const mapped = mapProductoConFabricante(newProduct)

      setProductos((prev) => [...prev, mapped])
      addProducto(mapped)
      toast.success('Producto creado y agregado a la venta')
      setAddProductModalOpen(false)
    } catch (e: any) {
      setNewProductError(e.message)
      toast.error(e.message)
    } finally {
      setIsSubmittingNewProduct(false)
    }
  }

  return (
    <>
      <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
        <div className='container mx-auto px-4 py-8'>
          <div className='flex justify-between items-center mb-6'>
            <h1 className='text-2xl font-bold dark:text-white'>Nueva Venta</h1>
            <button
              onClick={() => router.push('/')}
              className='flex items-center gap-2 text-gray-600 dark:text-gray-400'
            >
              <ArrowLeft className='h-5 w-5' /> Volver
            </button>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-8'>
            <ClienteForm clienteInicial={cliente} onClienteChange={setCliente} />

            {/* BUSCADOR */}
            <div className='relative'>
              <div className='flex items-end gap-2'>
                <div className='flex-grow'>
                  <Input
                    label='Buscar producto'
                    placeholder='Fabricante, nombre o escanear código'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Button type='button' onClick={() => setAddProductModalOpen(true)}>
                  Nuevo producto
                </Button>
              </div>

              {resultados.length > 0 && (
                <div className='absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border rounded shadow'>
                  {/* HEADER VISUAL RESULTADOS */}
                  <div className='px-3 py-2 border-b bg-gray-50 dark:bg-gray-800 grid grid-cols-4 gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300'>
                    <span>Fabricante</span>
                    <span>Producto</span>
                    <span>Stock</span>
                    <span className='text-right'>Precio</span>
                  </div>

                  {resultados
                    .filter((p) => !items.some((i) => i.producto.id_producto === p.id_producto))
                    .map((p) => (
                      <div
                        key={p.id_producto}
                        onClick={() => addProducto(p)}
                        className='px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 grid grid-cols-4 gap-2 text-sm'
                      >
                        <span className='font-semibold'>{p.fabricante.nombre}</span>
                        <span>{p.nombre}</span>
                        <span>Stock: {p.stock_actual}</span>
                        <span className='text-right'>
                          ₡{p.precio_venta.toLocaleString('es-CR')}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* ITEMS AGREGADOS */}
            <div className='space-y-2'>
              {/* HEADER VISUAL ITEMS */}
              {items.length > 0 && (
                <div className='grid grid-cols-6 gap-2 px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300'>
                  <div className='col-span-2'>Producto</div>
                  <div>Cantidad</div>
                  <div className='text-right'>Subtotal</div>
                  <div />
                </div>
              )}

              {items.map((item) => (
                <div
                  key={item.producto.id_producto}
                  className='grid grid-cols-6 items-center bg-gray-100 dark:bg-gray-700 p-2 rounded gap-2'
                >
                  {/* PRODUCTO */}
                  <div className='col-span-2'>
                    <div className='text-sm font-semibold'>{item.producto.fabricante.nombre}</div>
                    <div>{item.producto.nombre}</div>
                  </div>

                  {/* CANTIDAD */}
                  <div className='flex items-center gap-2'>
                    <Minus
                      className='w-4 h-4 cursor-pointer'
                      onClick={() => updateCantidad(item.producto.id_producto, item.cantidad - 1)}
                    />
                    <input
                      title='sumar'
                      type='number'
                      min={1}
                      max={item.producto.stock_actual}
                      value={item.cantidad}
                      onChange={(e) =>
                        updateCantidad(item.producto.id_producto, Number(e.target.value))
                      }
                      className='w-16 text-center border rounded dark:bg-gray-800'
                    />
                    <Plus
                      className='w-4 h-4 cursor-pointer'
                      onClick={() => updateCantidad(item.producto.id_producto, item.cantidad + 1)}
                    />
                  </div>

                  {/* SUBTOTAL */}
                  <div className='text-right'>
                    ₡{(item.cantidad * item.producto.precio_venta).toLocaleString('es-CR')}
                  </div>

                  {/* ELIMINAR */}
                  <Trash
                    className='w-4 h-4 cursor-pointer text-red-500 justify-self-end'
                    onClick={() => setItems(items.filter((i) => i !== item))}
                  />
                </div>
              ))}
            </div>

            {/* PAGO + TOTAL */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Select
                label='Método de pago'
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as 'efectivo' | 'tarjeta' | 'sinpe')}
              >
                <option value='efectivo'>Efectivo</option>
                <option value='tarjeta'>Tarjeta</option>
                <option value='sinpe'>SINPE</option>
              </Select>

              <div className='text-right text-xl font-bold dark:text-white'>
                Total: ₡{total.toLocaleString('es-CR')}
              </div>
            </div>

            {error && <FormError message={error} />}

            <div className='flex justify-end'>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Procesando...' : 'Registrar Venta'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ProductoAddModal
        isOpen={isAddProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        onSave={handleSaveNewProduct}
        isSubmitting={isSubmittingNewProduct}
        error={newProductError}
        fabricantesIniciales={fabricantes}
        onFabricanteAdded={handleFabricanteAdded}
      />
    </>
  )
}
