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
import { useForm } from 'react-hook-form'
import MarcaVentaAddModal from './FabricanteAddModal'

interface Fabricante {
  id_fabricante: string
  nombre: string
}

interface ProductoEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProductoFormData & { id_proveedor?: string | null }) => void
  isSubmitting?: boolean
  error?: string | null
  fabricantesIniciales?: Fabricante[]
  initialData?: Partial<ProductoFormData & { id_producto?: string }>
}

export default function ProductoEditModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  error,
  fabricantesIniciales = [],
  initialData,
}: ProductoEditModalProps) {
  const [isClient, setIsClient] = useState(false)
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([])
  const [openFabricanteModal, setOpenFabricanteModal] = useState(false)
  const { profile } = useAuthStore()
  const [proveedores, setProveedores] = useState<{ id_proveedor: string; nombre: string }[]>([])
  const [idProveedor, setIdProveedor] = useState<string | null>(null)

  useEffect(() => setIsClient(true), [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      tipo: initialData?.tipo || 'venta',
      stock_actual: initialData?.stock_actual ?? 0,
      activo: initialData?.activo ?? true,
      nombre: initialData?.nombre || '',
      descripcion: initialData?.descripcion || '',
      codigo_barras: initialData?.codigo_barras || '',
      precio_venta: initialData?.precio_venta ?? 0,
      costo: initialData?.costo ?? 0,
      stock_minimo: initialData?.stock_minimo ?? 0,
      id_fabricante: initialData?.id_fabricante || '',
    },
  })

  // Resetear formulario al abrir
  useEffect(() => {
    if (!isOpen) return

    reset({
      tipo: initialData?.tipo || 'venta',
      stock_actual: initialData?.stock_actual ?? 0,
      activo: initialData?.activo ?? true,
      nombre: initialData?.nombre || '',
      descripcion: initialData?.descripcion || '',
      codigo_barras: initialData?.codigo_barras || '',
      precio_venta: initialData?.precio_venta ?? 0,
      costo: initialData?.costo ?? 0,
      stock_minimo: initialData?.stock_minimo ?? 0,
      id_fabricante: initialData?.id_fabricante || '',
    })
  }, [isOpen, initialData, reset])

  // Cargar fabricantes
  useEffect(() => {
    if (isOpen) {
      setFabricantes(fabricantesIniciales)
    }
  }, [isOpen, fabricantesIniciales])

  // Cargar proveedores de la empresa y proveedor asociado al producto
  useEffect(() => {
    if (!isOpen || !profile?.empresa_id) return

    const fetch = async () => {
      const { data: provs } = await supabase
        .from('proveedores')
        .select('id_proveedor, nombre')
        .eq('empresa_id', profile.empresa_id)
        .order('nombre', { ascending: true })

      setProveedores((provs ?? []) as any)

      // Si tenemos producto inicial, obtener su proveedor principal (si existe)
      if (initialData?.id_producto) {
        const { data: rel } = await supabase
          .from('producto_proveedores')
          .select('id_proveedor')
          .eq('id_producto', initialData.id_producto)
          .limit(1)

        if (rel && rel.length > 0) {
          setIdProveedor(rel[0].id_proveedor)
        } else {
          setIdProveedor(null)
        }
      }
    }

    fetch()
  }, [isOpen, profile?.empresa_id, initialData?.id_producto])

  // Reaplicar fabricante cuando ya existen opciones
  useEffect(() => {
    if (isOpen && fabricantes.length > 0 && initialData?.id_fabricante) {
      setValue('id_fabricante', initialData.id_fabricante, {
        shouldDirty: false,
        shouldValidate: false,
      })
    }
    // reaplicar proveedor seleccionado
    if (isOpen) {
      setValue('id_fabricante', initialData?.id_fabricante || '')
    }
  }, [isOpen, fabricantes, initialData?.id_fabricante, setValue])

  if (!isOpen || !isClient) return null

  return ReactDOM.createPortal(
    <>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col relative'>
          {/* HEADER FIJO */}
          <div className='flex items-center justify-between p-6 border-b dark:border-gray-700'>
            <SectionTitle>Editar Producto</SectionTitle>
            <button
              className='text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl'
              onClick={onClose}
              title='Cerrar'
            >
              &times;
            </button>
          </div>

          {/* CONTENIDO CON SCROLL */}
          <div className='flex-1 overflow-y-auto p-6'>
            <form
              onSubmit={handleSubmit((data) => onSave({ ...data, id_proveedor: idProveedor }))}
              className='space-y-4'
            >
              {/* Marca */}
              <div>
                <label className='text-sm font-medium'>Marca</label>
                <div className='flex gap-2'>
                  <select
                    {...register('id_fabricante')}
                    className='flex-1 mt-1 px-3 py-2 border rounded-md dark:bg-gray-800'
                  >
                    <option value=''>Seleccionar marca</option>
                    {fabricantes.map((f) => (
                      <option key={f.id_fabricante} value={f.id_fabricante}>
                        {f.nombre}
                      </option>
                    ))}
                  </select>

                  <button
                    type='button'
                    title='Agregar marca'
                    onClick={() => setOpenFabricanteModal(true)}
                    className='px-3 border rounded-md'
                  >
                    +
                  </button>
                </div>

                {errors.id_fabricante && (
                  <p className='text-red-500 text-sm'>{errors.id_fabricante.message}</p>
                )}
              </div>

              {/* PROVEEDOR */}
              <div>
                <label className='text-sm font-medium'>Proveedor</label>
                <select
                  value={idProveedor ?? ''}
                  onChange={(e) => setIdProveedor(e.target.value === '' ? null : e.target.value)}
                  className='w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800'
                >
                  <option value=''>Sin proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id_proveedor} value={p.id_proveedor}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <Input label='Nombre' {...register('nombre')} error={errors.nombre?.message} />
              <Input label='Descripción' {...register('descripcion')} />
              <Input label='Código de barras' {...register('codigo_barras')} />

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

              <div className='grid grid-cols-2 gap-4'>
                <Input
                  label='Precio venta'
                  type='number'
                  step='0.01'
                  {...register('precio_venta', { valueAsNumber: true })}
                  error={errors.precio_venta?.message}
                />
                <Input
                  label='Costo'
                  type='number'
                  step='0.01'
                  {...register('costo', { valueAsNumber: true })}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <Input
                  label='Stock actual'
                  type='number'
                  {...register('stock_actual', { valueAsNumber: true })}
                />
                <Input
                  label='Stock mínimo'
                  type='number'
                  {...register('stock_minimo', { valueAsNumber: true })}
                />
              </div>

              <div className='flex items-center gap-2'>
                <input type='checkbox' {...register('activo')} />
                <label className='text-sm'>Producto activo</label>
              </div>

              {error && <FormError message={error} />}

              <div className='flex justify-end gap-2 pt-4'>
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
          setValue('id_fabricante', f.id_fabricante)
          setOpenFabricanteModal(false)
        }}
      />
    </>,
    document.body
  )
}
