'use client'
import { ServicioEditModal } from '@/components/reparaciones/ServicioEditModal'
import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { InfoBlock } from '@/components/ui/InfoBlock'
import { InfoRow } from '@/components/ui/InfoRow'
import Navbar from '@/components/ui/Navbar'
import SectionTitle from '@/components/ui/SectionTitle'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import '@/styles/print.css'
import { MensajeWhatsapp } from '@/types/mensaje_whatsapp'
import { Cliente, ServicioConNombres } from '@/types/servicio'
import { ArrowLeft, Edit, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function getBadgeColor(estado: string | null) {
  switch (estado) {
    case 'Recibido':
      return 'bg-yellow-100 text-yellow-800'
    case 'En revisión':
      return 'bg-orange-100 text-orange-800'
    case 'En reparacion':
      return 'bg-blue-100 text-blue-800'
    case 'Listo':
      return 'bg-green-100 text-green-800'
    case 'Entregado':
      return 'bg-gray-100 text-gray-800'
    case 'Anulado':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatFechaSimple(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function ServicioDetallePageWrapper({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = useAuthStore()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [servicio, setServicio] = useState<ServicioConNombres | null>(null)
  const [error, setError] = useState<{ message?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')
  const [mensajes, setMensajes] = useState<MensajeWhatsapp[]>([])

  // Cargar mensajes de WhatsApp
  useEffect(() => {
    if (profile?.empresa_id) {
      const fetchMensajes = async () => {
        const { data, error } = await supabase
          .from('mensajes_whatsapp')
          .select('*')
          .eq('empresa_id', profile.empresa_id)
        if (error) console.error('Error fetching mensajes whatsapp:', error)
        else setMensajes(data)
      }
      fetchMensajes()
    }
  }, [profile?.empresa_id])

  // Cargar detalle del servicio
  useEffect(() => {
    ;(async () => {
      const { id } = await params
      setId(id)

      const { data, error } = await supabase
        .from('servicios')
        .select(
          `
          id_reparacion,
          numero_servicio,
          fecha_ingreso,
          descripcion_falla,
          estado,
          costo_estimado,
          costo_final,
          nota_trabajo,
          observaciones,
          fecha_entrega,
          equipo:equipo_id (
            tipo,
            marca,
            modelo,
            serie,
            cliente:cliente_id (
              nombre,
              telefono,
              correo
            )
          )
        `
        )
        .eq('id_reparacion', id)
        .single()

      if (!data) {
        setServicio(null)
        setError(error)
        setLoading(false)
        return
      }

      const equipoRaw = Array.isArray(data.equipo) ? data.equipo[0] : data.equipo

      // IDs únicos
      const tipoDispositivoIds = new Set<string>()
      const marcaIds = new Set<string>()
      if (equipoRaw?.tipo) tipoDispositivoIds.add(equipoRaw.tipo)
      if (equipoRaw?.marca) marcaIds.add(equipoRaw.marca)

      // Traer nombres tipo dispositivo
      let tipoDispositivoData: { id_tipo: string; nombre: string }[] | null = null
      if (tipoDispositivoIds.size > 0) {
        const { data: fetched, error: e } = await supabase
          .from('tipos_dispositivo')
          .select('id_tipo, nombre')
          .in('id_tipo', Array.from(tipoDispositivoIds))
        if (e) throw e
        tipoDispositivoData = fetched
      }
      const tipoDispositivoMap = new Map<string, string>()
      tipoDispositivoData?.forEach((td) => tipoDispositivoMap.set(td.id_tipo, td.nombre))

      // Traer nombres marcas
      let marcaData: { id_marca: string; nombre: string }[] | null = null
      if (marcaIds.size > 0) {
        const { data: fetched, error: e } = await supabase
          .from('marcas')
          .select('id_marca, nombre')
          .in('id_marca', Array.from(marcaIds))
        if (e) throw e
        marcaData = fetched
      }
      const marcaMap = new Map<string, string>()
      marcaData?.forEach((m) => marcaMap.set(m.id_marca, m.nombre))

      const clienteRaw: Cliente | undefined = equipoRaw?.cliente
        ? Array.isArray(equipoRaw.cliente)
          ? equipoRaw.cliente[0]
          : equipoRaw.cliente
        : undefined

      const servicioNormalizado: ServicioConNombres = {
        id_reparacion: data.id_reparacion ?? '',
        numero_servicio: data.numero_servicio ?? null,
        equipo_id: equipoRaw?.serie ?? '',
        fecha_ingreso: data.fecha_ingreso ?? '',
        descripcion_falla: data.descripcion_falla ?? null,
        estado: data.estado ?? 'Recibido',
        costo_estimado: data.costo_estimado ?? null,
        costo_final: data.costo_final ?? null,
        nota_trabajo: data.nota_trabajo ?? null,
        observaciones: data.observaciones ?? null,
        fecha_entrega: data.fecha_entrega ?? null,
        equipo: equipoRaw
          ? {
              ...equipoRaw,
              cliente: clienteRaw ?? { nombre: '', telefono: '', correo: '' },
              tipos_dispositivo: equipoRaw.tipo
                ? { id_tipo: equipoRaw.tipo, nombre: tipoDispositivoMap.get(equipoRaw.tipo)! }
                : null,
              marcas: equipoRaw.marca
                ? { id_marca: equipoRaw.marca, nombre: marcaMap.get(equipoRaw.marca)! }
                : null,
            }
          : undefined,
      }

      setServicio(servicioNormalizado)
      setLoading(false)
      setError(error)
    })()
  }, [params, profile])

  const handleSave = async (data: Partial<ServicioConNombres>) => {
    if (!id) return
    const { error } = await supabase.from('servicios').update(data).eq('id_reparacion', id)
    if (error) {
      console.error('Error updating service:', error)
      alert('Error al actualizar el servicio.')
    } else {
      router.refresh()
      setIsModalOpen(false)
    }
  }

  const handleNotify = (tipo: 'recibido' | 'revision' | 'listo' | 'entregado') => {
    if (!servicio) return
    const mensaje = mensajes.find((m) => m.tipo === tipo)
    if (!mensaje) {
      alert(`No se encontró plantilla de mensaje para el estado: ${tipo}`)
      return
    }

    const telefono = servicio.equipo?.cliente?.telefono?.replace(/\D/g, '') || ''
    const clienteNombre = servicio.equipo?.cliente?.nombre || 'Estimado cliente'
    const equipoInfo =
      `${servicio.equipo?.tipos_dispositivo?.nombre || ''} ${servicio.equipo?.marcas?.nombre || ''} ${servicio.equipo?.modelo || ''}`.trim()
    const problema = servicio.descripcion_falla || 'No especificado'
    const costoEst = servicio.costo_estimado ?? '-'
    const costoFin = servicio.costo_final ?? '-'

    const plantilla = mensaje.plantilla
      .replace(/{cliente}/g, clienteNombre)
      .replace(/{equipo}/g, equipoInfo)
      .replace(/{problema}/g, problema)
      .replace(/{descripcion_falla}/g, problema)
      .replace(/{costo_estimado}/g, `₡${costoEst}`)
      .replace(/{costo_final}/g, `₡${costoFin}`)

    const text = encodeURIComponent(plantilla)
    const isWindows = typeof navigator !== 'undefined' && /Win/i.test(navigator.platform || '')
    const link = isWindows
      ? `https://web.whatsapp.com/send?phone=506${telefono}&text=${text}`
      : `https://wa.me/506${telefono}?text=${text}`

    window.open(link, '_blank')
  }

  if (loading)
    return (
      <div className='min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center'>
        <span className='text-gray-600 dark:text-gray-300'>Cargando...</span>
      </div>
    )

  if (error || !servicio)
    return (
      <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
        <Navbar />
        <div className='container mx-auto px-4 py-8 text-center'>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
            Error al cargar el servicio
          </h2>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            {error?.message ?? 'Servicio no encontrado'}
          </p>
          <Link
            href='/servicios'
            className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          >
            <ArrowLeft className='h-5 w-5 mr-2' />
            <span>Volver a servicios</span>
          </Link>
        </div>
      </div>
    )

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        {profile?.empresa?.logo_url && (
          <Image
            src={profile.empresa.logo_url}
            alt=''
            width={0}
            height={0}
            className='w-0 h-0 opacity-0 absolute print:hidden'
          />
        )}

        {/* Encabezado */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
          <div className='flex w-full'>
            <Link
              href='/'
              className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            >
              <ArrowLeft className='h-5 w-5 mr-2' />
              <span>Ir al inicio</span>
            </Link>

            {servicio.estado !== 'Entregado' && (
              <button
                className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors ml-auto'
                onClick={() => setIsModalOpen(true)}
              >
                <Edit className='h-5 w-5' />
                <span>Editar</span>
              </button>
            )}
          </div>
        </div>

        {/* Detalles */}
        <div className='bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden'>
          <div className='p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                {servicio.equipo?.tipos_dispositivo?.nombre ?? 'Dispositivo'}
              </h1>
            </div>
            <span
              className={`px-3 py-1 rounded text-sm font-medium border ${getBadgeColor(
                servicio.estado ?? 'Recibido'
              )} border-opacity-40 shadow-sm select-none`}
            >
              {servicio.estado ?? 'Recibido'}
            </span>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-6'>
            <div className='space-y-6'>
              <InfoBlock title={<SectionTitle>Cliente</SectionTitle>}>
                <InfoRow label='Nombre' value={servicio.equipo?.cliente?.nombre} />
                <InfoRow label='Teléfono' value={servicio.equipo?.cliente?.telefono} />
                <InfoRow label='Correo' value={servicio.equipo?.cliente?.correo} />
              </InfoBlock>
              <InfoBlock title={<SectionTitle>Equipo</SectionTitle>}>
                <InfoRow label='Tipo' value={servicio.equipo?.tipos_dispositivo?.nombre} />
                <InfoRow label='Marca' value={servicio.equipo?.marcas?.nombre} />
                <InfoRow label='Modelo' value={servicio.equipo?.modelo} />
                <InfoRow label='Serie' value={servicio.equipo?.serie} />
              </InfoBlock>
            </div>

            <div className='space-y-6'>
              <InfoBlock title={<SectionTitle>Servicio</SectionTitle>}>
                <InfoRow label='Nro. Servicio' value={servicio.numero_servicio} />
                <InfoRow label='Fecha ingreso' value={formatFechaSimple(servicio.fecha_ingreso)} />
                {servicio.fecha_entrega && (
                  <InfoRow
                    label='Fecha entrega'
                    value={formatFechaSimple(servicio.fecha_entrega)}
                  />
                )}
                {servicio.descripcion_falla && (
                  <InfoRow label='Falla' value={servicio.descripcion_falla} />
                )}
                {servicio.observaciones && (
                  <InfoRow label='Observación' value={servicio.observaciones} />
                )}
                {servicio.nota_trabajo && (
                  <InfoRow label='Notas de trabajo' value={servicio.nota_trabajo} />
                )}
                {servicio.costo_estimado !== null && (
                  <InfoRow
                    label='Costo estimado'
                    value={<FormattedAmount amount={Number(servicio.costo_estimado)} />}
                  />
                )}
                {servicio.costo_final !== null && (
                  <InfoRow
                    label='Costo final'
                    value={<FormattedAmount amount={Number(servicio.costo_final)} />}
                  />
                )}
              </InfoBlock>
            </div>
          </div>

          {/* Botones */}
          <div className='flex justify-end mr-4 mb-4 gap-2'>
            {servicio.estado === 'En revisión' && servicio.equipo?.cliente?.telefono && (
              <button
                onClick={() => handleNotify('revision')}
                className='bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2'
              >
                <MessageCircle className='h-5 w-5' />
                <span>Notificar costo estimado</span>
              </button>
            )}

            {servicio.estado === 'Listo' && servicio.equipo?.cliente?.telefono && (
              <button
                onClick={() => handleNotify('listo')}
                className='bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2'
              >
                <MessageCircle className='h-5 w-5' />
                <span>Notificar equipo listo</span>
              </button>
            )}

            {servicio.estado === 'Entregado' && servicio.equipo?.cliente?.telefono && (
              <button
                onClick={() => handleNotify('entregado')}
                className='bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2'
              >
                <MessageCircle className='h-5 w-5' />
                <span>Confirmar entrega</span>
              </button>
            )}
            <Link
              href={`/servicios/${id}/imprimir?tipo=factura`}
              target='_blank'
              rel='noopener noreferrer'
            >
              <button className='bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors'>
                Imprimir factura
              </button>
            </Link>
            <Link
              href={`/servicios/${id}/imprimir?tipo=etiqueta`}
              target='_blank'
              rel='noopener noreferrer'
            >
              <button className='bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors'>
                Imprimir etiqueta
              </button>
            </Link>
          </div>
        </div>
      </main>

      <ServicioEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        servicio={servicio}
        onSave={handleSave}
      />
    </div>
  )
}
