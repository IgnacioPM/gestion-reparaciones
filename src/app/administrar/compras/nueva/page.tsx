'use client'

import ProductoAddModal from '@/components/productos/ProductoAddModal'
import ProductoEditModal from '@/components/productos/ProductoEditModal'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Input from '@/components/ui/Input'
import Navbar from '@/components/ui/Navbar'
import Select from '@/components/ui/Select'
import { supabase } from '@/lib/supabaseClient'
import { mapProductoConFabricante, Producto } from '@/mappers/producto.mapper'
import { ProductoFormData } from '@/schemas/producto'
import { Proveedor } from '@/schemas/proveedor'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, Minus, Plus, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

type Item = {
  producto: any
  cantidad: number
  costo_unitario: number
  descuento_monto: number
  descuento_porcentaje?: number | null
}

export default function CompraNuevaPage() {
  const router = useRouter()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [proveedorId, setProveedorId] = useState<string | null>(null)

  const [productosQuery, setProductosQuery] = useState('')
  const [productosResultado, setProductosResultado] = useState<Producto[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [fabricantes, setFabricantes] = useState<{ id_fabricante: string; nombre: string }[]>([])

  const [items, setItems] = useState<Item[]>([])
  const [isAddProductModalOpen, setAddProductModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<any | null>(null)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [editProductError, setEditProductError] = useState<string | null>(null)
  // handler to be called when ProductoEditModal saves changes
  async function handleProductoEditSave(data: ProductoFormData & { id_proveedor?: string | null }) {
    if (!editingProducto) return
    try {
      setIsEditingProduct(true)
      setEditProductError(null)

      // update producto in DB by id_producto
      const updatePayload: any = {
        nombre: data.nombre,
        costo: data.costo ?? null,
        precio_venta: data.precio_venta ?? null,
        id_fabricante: data.id_fabricante || null,
      }

      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .update(updatePayload)
        .eq('id_producto', editingProducto.id_producto)
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
        .single()

      if (prodError) throw prodError

      // update proveedor relation if provided
      if (data.id_proveedor) {
        // upsert product-proveedor relation (simple approach: insert if not exists)
        const { error: relErr } = await supabase.from('producto_proveedores').upsert({
          id_producto: prodData.id_producto,
          id_proveedor: data.id_proveedor,
        })
        if (relErr) throw relErr
      }

      // update local items that reference this producto
      const newItems = items.map((it) => {
        if (it.producto.id_producto === prodData.id_producto) {
          return {
            ...it,
            producto: mapProductoConFabricante(prodData as any),
            costo_unitario: data.costo ?? it.costo_unitario,
          }
        }
        return it
      })

      setItems(newItems)
      setEditModalOpen(false)
      toast.success('Producto actualizado')
    } catch (err: any) {
      setEditProductError(err.message || 'Error actualizando producto')
      toast.error(err.message || 'Error actualizando producto')
    } finally {
      setIsEditingProduct(false)
    }
  }

  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'sinpe' | 'credito'>(
    'efectivo'
  )

  // Abono inline
  const [applyAbono, setApplyAbono] = useState(false)
  const [abonoMonto, setAbonoMonto] = useState<number>(0)
  const [abonoMetodo, setAbonoMetodo] = useState<'efectivo' | 'tarjeta' | 'sinpe'>('efectivo')
  const [abonoDescripcion, setAbonoDescripcion] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmittingNewProduct, setIsSubmittingNewProduct] = useState(false)
  const [newProductError, setNewProductError] = useState<string | null>(null)

  const { profile } = useAuthStore()

  useEffect(() => {
    const loadProveedores = async () => {
      if (!profile?.empresa_id) return
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('nombre')
      if (!error && data) setProveedores(data)
    }
    loadProveedores()
  }, [profile?.empresa_id])

  // Load productos for empresa into cache (used for client-side search)
  // Load productos mapeados (same approach as ventas)
  useEffect(() => {
    if (!profile?.empresa_id) return

    const fetchProductos = async () => {
      try {
        const { data, error } = await supabase
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
          .order('nombre')

        if (!error && data)
          setProductos(
            data.map((d: any) =>
              mapProductoConFabricante({
                ...d,
                fabricante: Array.isArray(d.fabricante) ? (d.fabricante[0] ?? null) : d.fabricante,
              } as any)
            )
          )
        else setProductos([])
      } catch (e) {
        setProductos([])
      }
    }

    fetchProductos()
  }, [profile?.empresa_id])

  // fetch fabricantes for product modal
  useEffect(() => {
    if (!profile?.empresa_id) return

    const fetchFabricantes = async () => {
      const { data, error } = await supabase
        .from('fabricantes')
        .select('id_fabricante, nombre')
        .eq('empresa_id', profile.empresa_id)
        .order('nombre')

      if (!error && data) setFabricantes(data)
    }

    fetchFabricantes()
  }, [profile?.empresa_id])

  // Search productos in local cache with debounce
  const searchTimer = useRef<number | null>(null)
  useEffect(() => {
    const qtrim = productosQuery.trim()
    if (!qtrim) {
      setProductosResultado([])
      return
    }

    // exact barcode match -> add immediately
    const exacto = productos.find((p: any) => p.codigo_barras && p.codigo_barras === qtrim)
    if (exacto) {
      addProducto(exacto)
      setProductosQuery('')
      setProductosResultado([])
      return
    }

    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      const q = qtrim.toLowerCase()
      const resultados = productos
        .filter(
          (p: any) =>
            (p.nombre || '').toLowerCase().includes(q) ||
            (p.codigo_barras || '').toLowerCase().includes(q) ||
            (p.fabricante?.nombre || '').toLowerCase().includes(q)
        )
        .slice(0, 10)

      setProductosResultado(resultados)
    }, 200)

    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    }
  }, [productosQuery, productos])

  const totalDescuento = useMemo(
    () => items.reduce((acc, it) => acc + (it.descuento_monto || 0) * it.cantidad, 0),
    [items]
  )
  const total = useMemo(
    () =>
      items.reduce(
        (acc, it) =>
          acc + it.cantidad * (it.costo_unitario || 0) - (it.descuento_monto || 0) * it.cantidad,
        0
      ),
    [items]
  )

  const addProducto = useCallback((producto: Producto | any) => {
    const mapped = (producto as Producto).id_producto
      ? (producto as Producto)
      : mapProductoConFabricante(producto)

    setItems((prev) => {
      const existing = prev.find((i) => i.producto.id_producto === mapped.id_producto)
      if (existing) {
        return prev.map((i) =>
          i.producto.id_producto === mapped.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }

      return [
        ...prev,
        { producto: mapped, cantidad: 1, costo_unitario: mapped.costo ?? 0, descuento_monto: 0 },
      ]
    })

    setProductosQuery('')
    setProductosResultado([])
  }, [])

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
        .single()

      if (error) throw error
      if (!newProduct) throw new Error('No se pudo crear el producto')

      if (id_proveedor && newProduct.id_producto) {
        const { error: relError } = await supabase.from('producto_proveedores').insert({
          id_producto: newProduct.id_producto,
          id_proveedor,
        })

        if (relError) throw relError
      }

      const mapped = mapProductoConFabricante({
        ...newProduct,
        fabricante: Array.isArray(newProduct.fabricante)
          ? (newProduct.fabricante[0] ?? null)
          : newProduct.fabricante,
      } as any)

      setProductos((prev) => [...prev, mapped])
      addProducto(mapped)
      toast.success('Producto creado y agregado a la compra')
      setAddProductModalOpen(false)
    } catch (e: any) {
      setNewProductError(e.message)
      toast.error(e.message)
    } finally {
      setIsSubmittingNewProduct(false)
    }
  }

  const updateCantidad = (id: string, cantidad: number) =>
    setItems((prev) =>
      prev.map((it) =>
        it.producto.id_producto === id ? { ...it, cantidad: Math.max(1, cantidad) } : it
      )
    )
  const updateCostoUnitario = (id: string, costo: number) =>
    setItems((prev) =>
      prev.map((it) =>
        it.producto.id_producto === id ? { ...it, costo_unitario: Math.max(0, costo) } : it
      )
    )
  const updateDescuento = (id: string, monto: number) =>
    setItems((prev) =>
      prev.map((it) =>
        it.producto.id_producto === id ? { ...it, descuento_monto: Math.max(0, monto) } : it
      )
    )

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      if (!proveedorId) throw new Error('Seleccione un proveedor')
      if (items.length === 0) throw new Error('Agregue al menos un producto')

      const compraPayload: any = {
        empresa_id: profile?.empresa_id,
        proveedor_id: proveedorId,
        metodo_pago: metodoPago,
        total: Math.round(total),
        total_descuento: Math.round(totalDescuento),
      }

      const { data: compraData, error: compraErr } = await supabase
        .from('compras')
        .insert(compraPayload)
        .select()
        .single()
      if (compraErr) throw compraErr
      const compraId = compraData?.id_compra || compraData?.id || null

      for (const it of items) {
        await supabase.from('compras_detalle').insert({
          compra_id: compraId,
          producto_id: it.producto.id_producto,
          cantidad: it.cantidad,
          costo_unitario: it.costo_unitario,
          descuento_monto: it.descuento_monto,
          subtotal: Math.round(it.cantidad * it.costo_unitario - it.descuento_monto * it.cantidad),
        })
      }

      // Crear movimiento(es) en proveedores_movimientos según método y abonos
      const movimientoBase: any = {
        empresa_id: compraData.empresa_id,
        proveedor_id: proveedorId,
        compra_id: compraId,
        descripcion: `Compra ${compraId}`,
      }

      // monto con dos decimales
      const montoTotal = Number(Number(total).toFixed(2))

      if (montoTotal > 0) {
        // Siempre registrar el movimiento de la compra como 'cargo'
        const { data: movCargoData, error: movCargoErr } = await supabase
          .from('proveedores_movimientos')
          .insert({
            ...movimientoBase,
            tipo: 'cargo',
            monto: montoTotal,
            metodo_pago: metodoPago,
            descripcion: `Compra #${compraId?.toString().slice(0, 8)}`,
          })
          .select()
          .single()

        if (movCargoErr) throw movCargoErr

        // DEBUG: fetch and log the inserted movimiento and current proveedores_credito
        try {
          const { data: creditoAfterCargo, error: creditoErr } = await supabase
            .from('proveedores_credito')
            .select('*')
            .eq('empresa_id', compraData.empresa_id)
            .eq('proveedor_id', proveedorId)
            .single()

          // keep creditoAfterCargo/creditoErr available for debugging if needed
        } catch (debugErr) {
          console.error('Debug fetch error (cargo):', debugErr)
        }

        // No crear automatically un 'abono' aquí — solo crear abonos cuando el usuario
        // marque explícitamente "Registrar abono ahora" (handled below with applyAbono).
      }

      // Si se solicita un abono adicional (p. ej. pago parcial), registrarlo también
      if (applyAbono && abonoMonto > 0) {
        const montoAbono = Number(Number(abonoMonto).toFixed(2))
        if (montoAbono > 0) {
          const { error: abonoErr } = await supabase.from('proveedores_movimientos').insert({
            ...movimientoBase,
            tipo: 'abono',
            monto: montoAbono,
            metodo_pago: abonoMetodo,
            descripcion: abonoDescripcion,
          })
          if (abonoErr) throw abonoErr
        }
      }

      // redirect to compra detail
      if (compraId) router.push(`/administrar/compras/${compraId}`)

      setItems([])
      setProveedorId(null)
      setApplyAbono(false)
      setAbonoMonto(0)
    } catch (err: any) {
      setError(err.message || 'Error al registrar la compra')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
      <Navbar />
      <main className='container mx-auto p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-bold'>Nueva Compra</h1>
          <div className='flex items-center gap-2'>
            <Link href='/administrar/compras'>
              <button className='flex items-center gap-2 text-gray-600 dark:text-gray-400'>
                <ArrowLeft className='h-4 w-4' /> Regresar
              </button>
            </Link>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
          <div className='md:col-span-1'>
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-0'>
              <label className='block text-sm font-medium mb-2'>Proveedor</label>
              <Select
                value={proveedorId ?? ''}
                onChange={(e: any) => setProveedorId(e.target.value || null)}
              >
                <option value=''>-- Seleccione proveedor --</option>
                {proveedores.map((p) => (
                  <option
                    key={(p as any).id_proveedor || (p as any).id}
                    value={(p as any).id_proveedor || (p as any).id}
                  >
                    {(p as any).nombre}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-0'>
            <div className='flex gap-2'>
              <div className='flex-grow'>
                <Input
                  label='Buscar'
                  placeholder='Buscar producto o código'
                  value={productosQuery}
                  onChange={(e: any) => setProductosQuery(e.target.value)}
                />
              </div>
              <div className='flex justify-end mt-4'>
                <Button onClick={() => setAddProductModalOpen(true)}>Nuevo producto</Button>
              </div>
            </div>
          </div>
          <div className='md:col-span-2'>
            <div className='flex flex-col gap-2 mb-3'>
              {productosResultado.length > 0 && (
                <div className='bg-white dark:bg-gray-800 border rounded shadow mt-1 max-h-48 overflow-auto'>
                  <ul>
                    {productosResultado
                      .filter(
                        (p: any) => !items.some((i) => i.producto.id_producto === p.id_producto)
                      )
                      .map((p: any) => (
                        <li
                          key={p.id_producto}
                          onClick={() => {
                            addProducto(p)
                            setProductosQuery('')
                            setProductosResultado([])
                          }}
                          className='px-3 py-2 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                        >
                          <div>
                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                              {p.nombre}
                            </div>
                            <div className='text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2'>
                              <span>{p.fabricante?.nombre || ''}</span>
                              <span>•</span>
                              <span className='flex items-center gap-2'>
                                <span>Stock: {p.stock_actual ?? 0}</span>
                                {p.stock_actual === 0 ? (
                                  <span className='text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded'>
                                    Sin stock
                                  </span>
                                ) : p.stock_minimo != null && p.stock_actual <= p.stock_minimo ? (
                                  <span className='text-xs font-semibold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded'>
                                    Bajo
                                  </span>
                                ) : null}
                              </span>
                              <span>
                                • ₡{(p.costo ?? p.precio_venta ?? 0).toLocaleString('es-CR')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                addProducto(p)
                                setProductosQuery('')
                                setProductosResultado([])
                              }}
                            >
                              Agregar
                            </Button>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {items.length > 0 ? (
              <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='text-xs font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-700'>
                      <th className='px-4 py-3 text-left'>Producto</th>
                      <th className='px-4 py-3 text-left'>Cantidad</th>
                      <th className='px-4 py-3 text-right'>Precio</th>
                      <th className='px-4 py-3 text-right'>Costo</th>
                      <th className='px-4 py-3 text-right'>Descuento</th>
                      <th className='px-4 py-3 text-right'>Subtotal</th>
                      <th className='px-4 py-3 text-center'>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr
                        key={idx}
                        className={`border-b dark:border-gray-700 ${
                          idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                        }`}
                      >
                        <td className='px-4 py-3'>
                          <div className='font-semibold'>
                            {it.producto.fabricante?.nombre} {it.producto.nombre}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            <button
                              onClick={() =>
                                updateCantidad(it.producto.id_producto, it.cantidad - 1)
                              }
                              className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                              aria-label='disminuir'
                            >
                              <Minus className='w-4 h-4' />
                            </button>
                            <label
                              htmlFor={`cantidad-${it.producto.id_producto}-${idx}`}
                              className='sr-only'
                            >
                              Cantidad para {it.producto.nombre}
                            </label>
                            <input
                              id={`cantidad-${it.producto.id_producto}-${idx}`}
                              type='number'
                              value={it.cantidad}
                              onChange={(e) =>
                                updateCantidad(it.producto.id_producto, Number(e.target.value))
                              }
                              className='w-16 text-center border rounded dark:bg-gray-800 py-1'
                              title={`Cantidad de ${it.producto.nombre}`}
                              placeholder='1'
                              aria-label={`Cantidad de ${it.producto.nombre}`}
                            />
                            <button
                              onClick={() =>
                                updateCantidad(it.producto.id_producto, it.cantidad + 1)
                              }
                              className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                              aria-label='aumentar'
                            >
                              <Plus className='w-4 h-4' />
                            </button>
                          </div>
                        </td>
                        <td className='px-4 py-3 text-right'>
                          ₡{Number(it.producto.precio_venta ?? 0).toLocaleString('es-CR')}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          ₡{Number(it.costo_unitario ?? 0).toLocaleString('es-CR')}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          <label
                            htmlFor={`descuento-${it.producto.id_producto}-${idx}`}
                            className='sr-only'
                          >
                            Descuento por unidad para {it.producto.nombre}
                          </label>
                          <input
                            id={`descuento-${it.producto.id_producto}-${idx}`}
                            type='number'
                            value={it.descuento_monto}
                            onChange={(e) =>
                              updateDescuento(it.producto.id_producto, Number(e.target.value))
                            }
                            className='w-24 text-right border rounded dark:bg-gray-800 py-1'
                            title={`Descuento por unidad de ${it.producto.nombre}`}
                            placeholder='0'
                            aria-label={`Descuento por unidad de ${it.producto.nombre}`}
                          />
                        </td>
                        <td className='px-4 py-3 text-right font-semibold'>
                          ₡
                          {(
                            it.cantidad * it.costo_unitario -
                            it.descuento_monto * it.cantidad
                          ).toLocaleString('es-CR')}
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <div className='flex items-center justify-center gap-2'>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingProducto({
                                  ...it.producto,
                                  id_fabricante:
                                    it.producto.fabricante?.id_fabricante ||
                                    it.producto.fabricante?.id ||
                                    '',
                                  id_proveedor: proveedorId ?? null,
                                })
                                setEditModalOpen(true)
                              }}
                            >
                              Editar
                            </Button>
                            <button
                              onClick={() => setItems(items.filter((x) => x !== it))}
                              className='p-1 rounded'
                              aria-label='eliminar'
                            >
                              <Trash className='w-4 h-4 text-red-500' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-600 dark:text-gray-300'>
                Agrega productos para comenzar la compra
              </div>
            )}

            {/* Totals + Abono + Submit now inside full-width block */}
            <div className='mt-4'>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
                <div className='text-sm mb-2'>
                  Total compra:{' '}
                  <span className='font-semibold'>₡{total.toLocaleString('es-CR')}</span>
                </div>
                <div className='text-sm mb-4'>
                  Descuento:{' '}
                  <span className='font-semibold'>₡{totalDescuento.toLocaleString('es-CR')}</span>
                </div>

                <label className='inline-flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={applyAbono}
                    onChange={(e) => setApplyAbono(e.target.checked)}
                  />
                  <span className='text-sm'>Registrar abono ahora</span>
                </label>

                {applyAbono && (
                  <div className='mt-3 space-y-2'>
                    <Input
                      label='Monto del abono'
                      type='number'
                      value={abonoMonto}
                      onChange={(e: any) => setAbonoMonto(Number(e.target.value))}
                    />
                    <div>
                      <label className='block text-sm mb-1'>Método abono</label>
                      <Select
                        value={abonoMetodo}
                        onChange={(e: any) => setAbonoMetodo(e.target.value as any)}
                      >
                        <option value='efectivo'>Efectivo</option>
                        <option value='tarjeta'>Tarjeta</option>
                        <option value='sinpe'>SINPE</option>
                      </Select>
                    </div>
                    <Input
                      label='Descripción (opcional)'
                      value={abonoDescripcion}
                      onChange={(e: any) => setAbonoDescripcion(e.target.value)}
                    />
                  </div>
                )}

                <div className='text-right mt-4'>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    Subtotal: ₡{(total + totalDescuento).toLocaleString('es-CR')}
                  </div>
                  {totalDescuento > 0 && (
                    <div className='text-sm text-green-600'>
                      Descuento: - ₡{totalDescuento.toLocaleString('es-CR')}
                    </div>
                  )}
                  <div className='text-xl font-bold mt-2'>
                    Total: ₡{total.toLocaleString('es-CR')}
                  </div>

                  <div className='flex justify-end mt-4'>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Procesando...' : 'Registrar Compra'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className='mt-4'>
            <FormError message={error} />
          </div>
        )}

        <ProductoAddModal
          isOpen={isAddProductModalOpen}
          onClose={() => setAddProductModalOpen(false)}
          onSave={handleSaveNewProduct}
          isSubmitting={isSubmittingNewProduct}
          error={newProductError}
          fabricantesIniciales={fabricantes}
          onFabricanteAdded={(f) => setFabricantes((prev) => [...prev, f])}
          initialProveedorId={proveedorId}
        />
        <ProductoEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleProductoEditSave}
          isSubmitting={isEditingProduct}
          error={editProductError}
          fabricantesIniciales={fabricantes}
          initialData={editingProducto}
        />
      </main>
    </div>
  )
}
