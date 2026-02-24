'use client'

import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Input from '@/components/ui/Input'
import SectionTitle from '@/components/ui/SectionTitle'
import { supabase } from '@/lib/supabaseClient'
import { ProductoFormData, productoSchema } from '@/schemas/producto'
import { useAuthStore } from '@/stores/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Controller, useForm } from 'react-hook-form'
import MarcaVentaAddModal from './FabricanteAddModal'

interface Fabricante {
  id_fabricante: string
  nombre: string
}

interface Proveedor {
  id_proveedor: string
  nombre: string
}

interface ProductoAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProductoFormData & { id_proveedor: string | null }) => void
  isSubmitting?: boolean
  error?: string | null
  fabricantesIniciales?: Fabricante[]
  onFabricanteAdded?: (fabricante: Fabricante) => void
  initialProveedorId?: string | null
}

export default function ProductoAddModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  error,
  fabricantesIniciales = [],
  onFabricanteAdded,
  initialProveedorId,
}: ProductoAddModalProps) {
  const { profile } = useAuthStore()

  const [isClient, setIsClient] = useState(false)
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [openFabricanteModal, setOpenFabricanteModal] = useState(false)
  const [idProveedor, setIdProveedor] = useState<string | null>(null)
  const [catalogos, setCatalogos] = useState<{ id_catalogo: string; nombre: string }[]>([])
  const [selectedCatalogo, setSelectedCatalogo] = useState<string | null>(null)
  const [codigoUbicacion, setCodigoUbicacion] = useState<string>('')
  const [selectedCatalogoSec, setSelectedCatalogoSec] = useState<string | null>(null)
  const [codigoUbicacionSec, setCodigoUbicacionSec] = useState<string>('')
  const [modalError, setModalError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    shouldUnregister: true,
    defaultValues: {
      tipo: 'venta',
      stock_actual: 0,
      activo: true,
      nombre: '',
      descripcion: '',
      codigo_barras: '',
      precio_venta: 0,
      costo: undefined,
      stock_minimo: undefined,
      id_fabricante: undefined,
    },
  })

  useEffect(() => setIsClient(true), [])

  useEffect(() => {
    if (!isOpen) return

    reset({
      tipo: 'venta',
      stock_actual: 0,
      activo: true,
      nombre: '',
      descripcion: '',
      codigo_barras: '',
      precio_venta: 0,
      costo: undefined,
      stock_minimo: undefined,
      id_fabricante: undefined,
    })

    setIdProveedor(initialProveedorId ?? null)
    setSelectedCatalogo(null)
    setCodigoUbicacion('')
    setSelectedCatalogoSec(null)
    setCodigoUbicacionSec('')
    setModalError(null)
  }, [isOpen, reset, initialProveedorId])

  useEffect(() => {
    setFabricantes(fabricantesIniciales)
  }, [fabricantesIniciales])

  useEffect(() => {
    if (!isOpen || !profile?.empresa_id) return

    const fetchCatalogos = async () => {
      const { data } = await supabase
        .from('ubicaciones_catalogo')
        .select('id_catalogo, nombre')
        .eq('empresa_id', profile.empresa_id)
        .order('nombre', { ascending: true })

      setCatalogos((data ?? []) as any)
    }

    fetchCatalogos()

    const fetchProveedores = async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id_proveedor, nombre')
        .eq('empresa_id', profile.empresa_id)
        .order('nombre', { ascending: true })

      if (!error) setProveedores(data ?? [])
    }

    fetchProveedores()
  }, [isOpen, profile?.empresa_id])

  if (!isOpen || !isClient) return null

  const handleCreate = async (data: ProductoFormData) => {
    setModalError(null)
    let id_ubicacion_principal: string | undefined
    let id_ubicacion_secundaria: string | undefined

    try {
      if (selectedCatalogo && codigoUbicacion?.trim()) {
        const { data: found } = await supabase
          .from('ubicaciones')
          .select('id_ubicacion')
          .eq('empresa_id', profile?.empresa_id)
          .eq('id_catalogo', selectedCatalogo)
          .eq('codigo', codigoUbicacion)
          .limit(1)

        if (found && found.length > 0) {
          id_ubicacion_principal = (found[0] as any).id_ubicacion
        } else {
          const { data: ins, error: insErr } = await supabase
            .from('ubicaciones')
            .insert({
              empresa_id: profile?.empresa_id,
              id_catalogo: selectedCatalogo,
              codigo: codigoUbicacion,
            })
            .select('id_ubicacion')
            .single()

          if (insErr) throw insErr
          id_ubicacion_principal = (ins as any).id_ubicacion
        }
      }
    } catch (e: any) {
      console.error('Error gestionando ubicacion:', e)
      setModalError(e.message || 'Error al gestionar ubicacion')
      return
    }

    try {
      if (selectedCatalogoSec && codigoUbicacionSec?.trim()) {
        const { data: found } = await supabase
          .from('ubicaciones')
          .select('id_ubicacion')
          .eq('empresa_id', profile?.empresa_id)
          .eq('id_catalogo', selectedCatalogoSec)
          .eq('codigo', codigoUbicacionSec)
          .limit(1)

        if (found && found.length > 0) {
          id_ubicacion_secundaria = (found[0] as any).id_ubicacion
        } else {
          const { data: ins, error: insErr } = await supabase
            .from('ubicaciones')
            .insert({
              empresa_id: profile?.empresa_id,
              id_catalogo: selectedCatalogoSec,
              codigo: codigoUbicacionSec,
            })
            .select('id_ubicacion')
            .single()

          if (insErr) throw insErr
          id_ubicacion_secundaria = (ins as any).id_ubicacion
        }
      }
    } catch (e: any) {
      console.error('Error gestionando ubicacion secundaria:', e)
      setModalError(e.message || 'Error al gestionar ubicacion secundaria')
      return
    }

    const base: any = {
      ...data,
      descripcion: data.descripcion || null,
      codigo_barras: data.codigo_barras || null,
      costo: data.costo ?? null,
      stock_minimo: data.stock_minimo ?? null,
      id_fabricante: data.id_fabricante ?? null,
      id_proveedor: idProveedor ?? null,
      ...(id_ubicacion_principal ? { id_ubicacion_principal } : {}),
      ...(id_ubicacion_secundaria ? { id_ubicacion_secundaria } : {}),
    }

    onSave(base as ProductoFormData & { id_proveedor: string | null })
  }

  return ReactDOM.createPortal(
    <>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col relative'>
          <div className='flex items-center justify-between p-6 border-b dark:border-gray-700'>
            <SectionTitle>Nuevo Producto</SectionTitle>
            <button
              className='text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl'
              onClick={onClose}
            >
              &times;
            </button>
          </div>

          <div className='flex-1 overflow-y-auto p-6'>
            <form
              onSubmit={handleSubmit(handleCreate)}
              className='grid grid-cols-1 md:grid-cols-2 gap-4'
            >
              <Input label='Nombre' {...register('nombre')} error={errors.nombre?.message} />

              <div>
                <label className='text-sm font-medium'>Tipo</label>
                <select
                  {...register('tipo')}
                  className='w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800'
                >
                  <option value='venta'>Venta</option>
                  <option value='repuesto'>Repuesto</option>
                  <option value='ambos'>Ambos</option>
                </select>
              </div>

              <div>
                <label className='text-sm font-medium'>Proveedor</label>
                <div className='flex gap-2 items-center'>
                  <select
                    value={idProveedor ?? ''}
                    onChange={(e) => setIdProveedor(e.target.value === '' ? null : e.target.value)}
                    className='flex-1 mt-1 px-3 py-2 border rounded-md dark:bg-gray-800'
                  >
                    <option value=''>Sin proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id_proveedor} value={p.id_proveedor}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className='text-sm font-medium'>Marca</label>
                <div className='flex gap-2'>
                  <Controller
                    name='id_fabricante'
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        value={field.value ?? ''}
                        className='flex-1 mt-1 px-3 py-2 border rounded-md dark:bg-gray-800'
                      >
                        <option value=''>Seleccionar marca</option>
                        {fabricantes.map((f) => (
                          <option key={f.id_fabricante} value={f.id_fabricante}>
                            {f.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <button
                    type='button'
                    onClick={() => setOpenFabricanteModal(true)}
                    className='px-3 border rounded-md'
                  >
                    +
                  </button>
                </div>
              </div>

              <Input label='Codigo de barras' {...register('codigo_barras')} />

              <div className='md:col-span-2'>
                <Input label='Descripcion' {...register('descripcion')} />
              </div>

              <div className='md:col-span-2 pt-1'>
                <p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>
                  Ubicaciones
                </p>
              </div>

              {/* Ubicación principal: select + código en una fila */}
              <div>
                <label className='text-sm font-medium'>Ubicación (principal)</label>
                <div className='mt-1 grid grid-cols-2 gap-2 items-end'>
                  <select
                    value={selectedCatalogo ?? ''}
                    onChange={(e) =>
                      setSelectedCatalogo(e.target.value === '' ? null : e.target.value)
                    }
                    className='w-full px-3 py-2 border rounded-md dark:bg-gray-800'
                  >
                    <option value=''>Sin selección</option>
                    {catalogos.map((c) => (
                      <option key={c.id_catalogo} value={c.id_catalogo}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>

                  <input
                    aria-label='Código ubicación principal'
                    placeholder='Código (ej: A-1)'
                    value={codigoUbicacion}
                    onChange={(e) => setCodigoUbicacion(e.target.value)}
                    className='w-full block rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 py-2 px-3'
                  />
                </div>
                <div className='mt-1 grid grid-cols-2 gap-2 text-xs text-gray-500'>
                  <span>Selecciona el catálogo</span>
                  <span>Ingresa el código de ubicación</span>
                </div>
              </div>

              {/* Ubicación secundaria: select + código en una fila */}
              <div>
                <label className='text-sm font-medium'>Ubicación (secundaria)</label>
                <div className='mt-1 grid grid-cols-2 gap-2 items-end'>
                  <select
                    value={selectedCatalogoSec ?? ''}
                    onChange={(e) =>
                      setSelectedCatalogoSec(e.target.value === '' ? null : e.target.value)
                    }
                    className='w-full px-3 py-2 border rounded-md dark:bg-gray-800'
                  >
                    <option value=''>Sin selección</option>
                    {catalogos.map((c) => (
                      <option key={c.id_catalogo} value={c.id_catalogo}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>

                  <input
                    aria-label='Código ubicación secundaria'
                    placeholder='Código (ej: B-2)'
                    value={codigoUbicacionSec}
                    onChange={(e) => setCodigoUbicacionSec(e.target.value)}
                    className='w-full block rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 py-2 px-3'
                  />
                </div>
                <div className='mt-1 grid grid-cols-2 gap-2 text-xs text-gray-500'>
                  <span>Selecciona el catálogo</span>
                  <span>Ingresa el código de ubicación</span>
                </div>
              </div>

              <Input
                label='Precio venta'
                type='number'
                step='0.01'
                {...register('precio_venta', { valueAsNumber: true })}
              />

              <Input
                label='Costo'
                type='number'
                step='0.01'
                {...register('costo', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
              />

              <Input
                label='Stock actual'
                type='number'
                {...register('stock_actual', { valueAsNumber: true })}
              />

              <Input
                label='Stock minimo'
                type='number'
                {...register('stock_minimo', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
              />

              <div className='md:col-span-2 flex items-center gap-2 pt-1'>
                <input type='checkbox' {...register('activo')} />
                <label className='text-sm'>Producto activo</label>
              </div>

              {(error || modalError) && (
                <div className='md:col-span-2'>
                  <FormError message={modalError ?? error ?? undefined} />
                </div>
              )}

              <div className='md:col-span-2 flex justify-end gap-2 pt-4'>
                <Button type='button' color='secondary' onClick={onClose}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <MarcaVentaAddModal
        isOpen={openFabricanteModal}
        onClose={() => setOpenFabricanteModal(false)}
        onSave={(nuevoFabricante) => {
          const f: Fabricante = {
            id_fabricante: nuevoFabricante.id_fabricante ?? nuevoFabricante.id,
            nombre: nuevoFabricante.nombre,
          }

          setFabricantes((prev) => [...prev, f])
          onFabricanteAdded?.(f)

          setValue('id_fabricante', f.id_fabricante, {
            shouldValidate: true,
            shouldDirty: true,
          })

          setOpenFabricanteModal(false)
        }}
      />
    </>,
    document.body
  )
}
