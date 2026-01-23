'use client'

import ClienteForm, { Cliente } from '@/components/forms/ClienteForm'
import MarcaAddModal from '@/components/reparaciones/MarcaAddModal'
import TipoDispositivoAddModal from '@/components/reparaciones/TipoDispositivoAddModal'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { supabase } from '@/lib/supabaseClient'
import { servicioSchema, type ServicioFormData } from '@/schemas/servicio'
import { useAuthStore } from '@/stores/auth'
import { Marca } from '@/types/marca'
import { TipoDispositivo } from '@/types/tipo_dispositivo'
import { translateSupabaseError } from '@/utils/supabase-db-errors'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { ArrowLeft, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
// Plugins de dayjs
const pluginsInitialized: boolean =
  (globalThis as unknown as { _dayjsPluginsInitialized?: boolean })._dayjsPluginsInitialized ??
  false
if (!pluginsInitialized) {
  dayjs.extend(utc)
  dayjs.extend(timezone)
  ;(globalThis as unknown as { _dayjsPluginsInitialized?: boolean })._dayjsPluginsInitialized = true
}

export default function NuevoServicioPage() {
  const handleClienteChange = (selectedCliente: Cliente | null) => {
    setCliente(selectedCliente)
  }

  const router = useRouter()
  const { profile } = useAuthStore()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [tiposDispositivo, setTiposDispositivo] = useState<TipoDispositivo[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])

  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false)
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [newlyCreatedTipoId, setNewlyCreatedTipoId] = useState<string | null>(null)
  const [newlyCreatedMarcaId, setNewlyCreatedMarcaId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    control,
    setValue,
  } = useForm<ServicioFormData>({
    resolver: zodResolver(servicioSchema),
  })

  const selectedTipoId = useWatch({ control, name: 'tipo_dispositivo' })

  const fetchTiposDispositivo = async () => {
    const { data, error } = await supabase
      .from('tipos_dispositivo')
      .select('*')
      .eq('empresa_id', profile?.empresa_id)
      .order('nombre', { ascending: true })
    if (error) {
      console.error('Error fetching tipos de dispositivo:', error)
    } else {
      console.log('Fetching tipos de dispositivo for empresa_id:', profile?.empresa_id)
      setTiposDispositivo(data)
      console.log('Fetched tipos de dispositivo:', data)
      const defaultTipo = data.find((tipo) => tipo.predeterminado)
      console.log('Default tipo de dispositivo found:', defaultTipo)
      if (defaultTipo) {
        setValue('tipo_dispositivo', defaultTipo.id_tipo, { shouldValidate: true })
      }
    }
  }

  const fetchMarcas = async (tipoId: string) => {
    if (!tipoId) {
      setMarcas([])
      return
    }
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('empresa_id', profile?.empresa_id)
      .eq('id_tipo', tipoId)
      .order('nombre', { ascending: true })
    if (error) {
      console.error('Error fetching marcas:', error)
    } else {
      setMarcas(data)
    }
  }

  useEffect(() => {
    if (!profile?.empresa_id) return

    const fetchData = async () => {
      const { data, error } = await supabase
        .from('tipos_dispositivo')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error fetching tipos de dispositivo:', error)
        return
      }

      setTiposDispositivo(data)

      const defaultTipo = data.find((tipo) => !!tipo.predeterminado)
      console.log('Default tipo de dispositivo:', defaultTipo)

      if (defaultTipo) {
        requestAnimationFrame(() => {
          setValue('tipo_dispositivo', defaultTipo.id_tipo, { shouldValidate: true })
        })
      }
    }

    fetchData()
  }, [profile?.empresa_id, setValue])

  useEffect(() => {
    if (selectedTipoId) {
      fetchMarcas(selectedTipoId)
    } else {
      setMarcas([])
    }
    setValue('marca', '')
  }, [selectedTipoId, setValue])

  useEffect(() => {
    if (newlyCreatedTipoId && tiposDispositivo.some((t) => t.id_tipo === newlyCreatedTipoId)) {
      setValue('tipo_dispositivo', newlyCreatedTipoId, { shouldValidate: true, shouldDirty: true })
      setNewlyCreatedTipoId(null)
    }
  }, [newlyCreatedTipoId, tiposDispositivo, setValue])

  useEffect(() => {
    if (newlyCreatedMarcaId && marcas.some((m) => m.id_marca === newlyCreatedMarcaId)) {
      setValue('marca', newlyCreatedMarcaId, { shouldValidate: true, shouldDirty: true })
      setNewlyCreatedMarcaId(null)
    }
  }, [newlyCreatedMarcaId, marcas, setValue])

  const handleSaveTipoDispositivo = async (formData: { nombre: string }) => {
    setModalError(null)
    if (!profile?.empresa_id) {
      setModalError('No se pudo identificar la empresa.')
      return
    }
    try {
      const { data: newTipo, error } = await supabase
        .from('tipos_dispositivo')
        .insert({ nombre: formData.nombre, empresa_id: profile.empresa_id })
        .select()
        .single()
      if (error) throw error

      await fetchTiposDispositivo()
      setNewlyCreatedTipoId(newTipo.id_tipo)
      setIsTipoModalOpen(false)
    } catch (error) {
      setModalError(translateSupabaseError(error))
    }
  }

  const handleSaveMarca = async (formData: { nombre: string; id_tipo: string }) => {
    setModalError(null)
    if (!profile?.empresa_id) {
      setModalError('No se pudo identificar la empresa.')
      return
    }
    try {
      const { data, error } = await supabase
        .from('marcas')
        .insert({ ...formData, empresa_id: profile.empresa_id })
        .select()
        .single()
      if (error) throw error

      await fetchMarcas(data.id_tipo)
      setNewlyCreatedMarcaId(data.id_marca)
      setIsMarcaModalOpen(false)
    } catch (error) {
      setModalError(translateSupabaseError(error))
    }
  }

  const onSubmit = async (data: ServicioFormData) => {
    if (!cliente) {
      setError('root', {
        message: 'Debe seleccionar o ingresar los datos del cliente',
      })
      return
    }

    const empresaId = profile?.empresa_id
    if (!empresaId) {
      setError('root', { message: 'Error: No se pudo identificar la empresa del usuario.' })
      return
    }

    setIsSubmitting(true)
    try {
      let clienteId = cliente.id_cliente
      if (clienteId === 'nuevo') {
        const { data: nuevoCliente, error: errorCliente } = await supabase
          .from('clientes')
          .insert({
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            correo: cliente.correo,
            empresa_id: empresaId,
          })
          .select('id_cliente')
          .single()

        if (errorCliente) throw errorCliente
        if (!nuevoCliente) throw new Error('No se pudo crear el cliente.')
        clienteId = nuevoCliente.id_cliente
      }

      const { data: nuevoEquipo, error: errorEquipo } = await supabase
        .from('equipos')
        .insert({
          cliente_id: clienteId,
          tipo: data.tipo_dispositivo,
          marca: data.marca,
          modelo: data.modelo,
          serie: data.numero_serie || null,
          empresa_id: empresaId,
        })
        .select('id_equipo')
        .single()
      if (errorEquipo) throw errorEquipo

      const fechaIngresoCR = dayjs().tz('America/Costa_Rica').toISOString()
      const { data: nuevoServicio, error: errorServicio } = await supabase
        .from('servicios')
        .insert({
          equipo_id: nuevoEquipo.id_equipo,
          fecha_ingreso: fechaIngresoCR,
          descripcion_falla: data.problema,
          estado: 'Recibido',
          nota_trabajo: data.observaciones || null,
          costo_estimado: data.costo_estimado ?? null,
          fecha_entrega: null,
          empresa_id: empresaId,
          creado_por: profile.id_usuario,
        })
        .select('id_reparacion')
        .single()

      if (errorServicio) throw errorServicio

      if (!nuevoServicio) {
        setError('root', { message: 'Error: No se pudo obtener el ID del nuevo servicio.' })
        return
      }

      reset()
      router.push(`/servicios/${nuevoServicio.id_reparacion}`)
    } catch (error: unknown) {
      setError('root', { message: translateSupabaseError(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
      <TipoDispositivoAddModal
        isOpen={isTipoModalOpen}
        onClose={() => setIsTipoModalOpen(false)}
        onSave={handleSaveTipoDispositivo}
        isSubmitting={isSubmitting}
        error={modalError}
      />
      <MarcaAddModal
        isOpen={isMarcaModalOpen}
        onClose={() => setIsMarcaModalOpen(false)}
        onSave={handleSaveMarca}
        isSubmitting={isSubmitting}
        tiposDispositivo={tiposDispositivo}
        selectedTipo={selectedTipoId}
        error={modalError}
      />
      <div className='container mx-auto px-4 py-8'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Nuevo Servicio</h1>
          <button
            onClick={() => router.push('/')}
            className='mt-4 sm:mt-0 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'
          >
            <ArrowLeft className='h-5 w-5 mr-2' />
            <span>Volver al inicio</span>
          </button>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
          <div className='mb-8'>
            <h2 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
              Información del Cliente
            </h2>
            <ClienteForm onClienteChange={handleClienteChange} />
          </div>

          <hr className='my-8 border-gray-200 dark:border-gray-700' />

          <div>
            <h2 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
              Información del Dispositivo
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-end gap-2'>
                  <div className='flex-grow'>
                    <Select
                      label='Tipo de dispositivo'
                      {...register('tipo_dispositivo')}
                      error={errors.tipo_dispositivo?.message}
                    >
                      <option value=''>Seleccione un tipo</option>
                      {tiposDispositivo.map((tipo) => (
                        <option key={tipo.id_tipo} value={tipo.id_tipo}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type='button'
                    onClick={() => {
                      setModalError(null)
                      setIsTipoModalOpen(true)
                    }}
                    className='p-2'
                  >
                    <Plus size={20} />
                  </Button>
                </div>
                <div className='flex items-end gap-2'>
                  <div className='flex-grow'>
                    <Select
                      label='Marca'
                      {...register('marca')}
                      error={errors.marca?.message}
                      disabled={!selectedTipoId || tiposDispositivo.length === 0}
                    >
                      <option value=''>Seleccione una marca</option>
                      {marcas.map((marca) => (
                        <option key={marca.id_marca} value={marca.id_marca}>
                          {marca.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type='button'
                    onClick={() => {
                      setModalError(null)
                      setIsMarcaModalOpen(true)
                    }}
                    className='p-2'
                    disabled={!selectedTipoId}
                  >
                    <Plus size={20} />
                  </Button>
                </div>
                <Input
                  label='Modelo'
                  type='text'
                  {...register('modelo')}
                  error={errors.modelo?.message}
                />
                <Input
                  label='Número de serie (opcional)'
                  type='text'
                  {...register('numero_serie')}
                  error={errors.numero_serie?.message}
                />
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-200'>
                    Descripción del problema
                  </label>
                  <textarea
                    {...register('problema')}
                    rows={3}
                    className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100
                                        shadow-sm focus:border-blue-500 dark:focus:border-blue-400 
                                        focus:ring-blue-500 dark:focus:ring-blue-400'
                    placeholder='Describa el problema del dispositivo'
                  ></textarea>
                  {errors.problema && (
                    <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                      {errors.problema.message}
                    </p>
                  )}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Input
                      label='Costo estimado'
                      type='number'
                      step='0.01'
                      min='0'
                      max='999999.99'
                      {...register('costo_estimado', { valueAsNumber: true })}
                      error={errors.costo_estimado?.message}
                      placeholder='0.00'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-200'>
                    Observaciones (opcional)
                  </label>
                  <textarea
                    {...register('observaciones')}
                    rows={2}
                    className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100
                                        shadow-sm focus:border-blue-500 dark:focus:border-blue-400 
                                        focus:ring-blue-500 dark:focus:ring-blue-400'
                    placeholder='Observaciones adicionales'
                  ></textarea>
                  {errors.observaciones && (
                    <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                      {errors.observaciones.message}
                    </p>
                  )}
                </div>
              </div>

              {errors.root && <FormError message={errors.root.message} />}

              <div className='flex justify-end mt-6'>
                <Button type='submit' disabled={isSubmitting} className='w-full sm:w-auto'>
                  {isSubmitting ? 'Registrando...' : 'Registrar Servicio'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
