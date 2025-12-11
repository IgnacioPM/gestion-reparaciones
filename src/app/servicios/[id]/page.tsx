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
import { Cliente, Servicio } from '@/types/servicio'
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
    hour12: true, // 👈 formato 12h con AM/PM
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
  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [error, setError] = useState<{ message?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')
  const [mensajes, setMensajes] = useState<MensajeWhatsapp[]>([])

  useEffect(() => {
    if (profile?.empresa_id) {
      const fetchMensajes = async () => {
        const { data, error } = await supabase
          .from('mensajes_whatsapp')
          .select('*')
          .eq('empresa_id', profile.empresa_id)

        if (error) {
          console.error('Error fetching mensajes whatsapp:', error)
        } else {
          setMensajes(data)
        }
      }
      fetchMensajes()
    }
  }, [profile?.empresa_id])

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

      if (data) {
        const equipoRaw = Array.isArray(data.equipo) ? data.equipo[0] : data.equipo
        const clienteRaw: Cliente | undefined = equipoRaw?.cliente
          ? Array.isArray(equipoRaw.cliente)
            ? equipoRaw.cliente[0]
            : equipoRaw.cliente
          : undefined

        const servicioNormalizado: Servicio = {
          id_reparacion: data.id_reparacion ?? '',
          numero_servicio: data.numero_servicio ?? null,
          equipo_id: equipoRaw?.serie ?? '',
          fecha_ingreso: data.fecha_ingreso ?? '',
          descripcion_falla: data.descripcion_falla ?? null,
          estado: data.estado ?? 'Recibido',
          costo_estimado: data.costo_estimado ?? null,
          costo_final: data.costo_final ?? null,
          nota_trabajo: data.nota_trabajo ?? null,
          fecha_entrega: data.fecha_entrega ?? null,
          equipo: equipoRaw
            ? {
                tipo: equipoRaw.tipo ?? '',
                marca: equipoRaw.marca ?? '',
                modelo: equipoRaw.modelo ?? '',
                serie: equipoRaw.serie ?? '',
                cliente: clienteRaw ?? { nombre: '', telefono: '', correo: '' },
              }
            : undefined,
        }

        setServicio(servicioNormalizado)
      } else {
        setServicio(null)
      }

      setError(error)
      setLoading(false)
    })()
  }, [params, profile])

  const handleSave = async (data: Partial<Servicio>) => {
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

    // Normalizar teléfono
    const rawTel = servicio.equipo?.cliente?.telefono || ''
    const telefono = rawTel.replace(/\D/g, '').trim()

    if (!telefono) {
      alert('El cliente no tiene un número válido.')
      return
    }

    const clienteNombre = servicio.equipo?.cliente?.nombre || 'Estimado cliente'
    const equipoInfo = `${servicio.equipo?.tipo || ''} ${servicio.equipo?.marca || ''} ${
      servicio.equipo?.modelo || ''
    }`.trim()
    const problema = servicio.descripcion_falla || 'No especificado'
    const costoEst = servicio.costo_estimado || '-'
    const costoFin = servicio.costo_final || '-'

    // Procesar plantilla y normalizar
    let plantilla = mensaje.plantilla
      .replace(/{cliente}/g, clienteNombre)
      .replace(/{equipo}/g, equipoInfo)
      .replace(/{problema}/g, problema)
      .replace(/{costo_estimado}/g, `₡${costoEst}`)
      .replace(/{costo_final}/g, `₡${costoFin}`)

    plantilla = plantilla
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\u00A0/g, ' ') // non-breaking spaces
      .trim()

    const link = `https://wa.me/506${telefono}?text=${encodeURIComponent(plantilla)}`
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
                {servicio.equipo?.tipo ?? 'Dispositivo'}
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
                <InfoRow label='Tipo' value={servicio.equipo?.tipo} />
                <InfoRow label='Marca' value={servicio.equipo?.marca} />
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
                {servicio.nota_trabajo && <InfoRow label='Notas' value={servicio.nota_trabajo} />}
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

          {/* Botones de impresión */}
          <div className='flex justify-end mr-4 mb-4 gap-2'>
            {servicio.estado === 'Recibido' && (
              <button
                onClick={() => handleNotify('recibido')}
                className='bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2'
              >
                <MessageCircle className='h-5 w-5' />
                <span>Notificar Recibido</span>
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
