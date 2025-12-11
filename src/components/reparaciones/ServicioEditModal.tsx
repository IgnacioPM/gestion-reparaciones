import Button from '@/components/ui/Button'
import { FormattedAmount } from '@/components/ui/FormattedAmount'
import { InfoBlock } from '@/components/ui/InfoBlock'
import { InfoRow } from '@/components/ui/InfoRow'
import Input from '@/components/ui/Input'
import SectionTitle from '@/components/ui/SectionTitle'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { MensajeWhatsapp } from '@/types/mensaje_whatsapp'
import { Servicio } from '@/types/servicio'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useState } from 'react'

interface ServicioEditModalProps {
  isOpen: boolean
  onClose: () => void
  servicio: Servicio
  onSave: (data: Partial<Servicio>) => void
}

const estados = ['Recibido', 'En revisión', 'En reparacion', 'Listo', 'Entregado', 'Anulado']

export function ServicioEditModal({ isOpen, onClose, servicio, onSave }: ServicioEditModalProps) {
  const [estado, setEstado] = useState<Servicio['estado']>(servicio.estado || 'Recibido')
  const [costoEstimado, setCostoEstimado] = useState(
    servicio.costo_estimado !== undefined && servicio.costo_estimado !== null
      ? String(servicio.costo_estimado)
      : ''
  )
  const [costoFinal, setCostoFinal] = useState(
    servicio.costo_final !== undefined && servicio.costo_final !== null
      ? String(servicio.costo_final)
      : servicio.costo_estimado !== undefined && servicio.costo_estimado !== null
      ? String(servicio.costo_estimado)
      : ''
  )
  const [notaTrabajo, setNotaTrabajo] = useState(servicio.nota_trabajo ?? '')
  const [mensajes, setMensajes] = useState<MensajeWhatsapp[]>([])
  const { profile } = useAuthStore()

  useEffect(() => {
    if (isOpen && profile?.empresa_id) {
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
  }, [isOpen, profile?.empresa_id])

  if (!(dayjs as unknown as { _hasTimezonePlugin?: boolean })._hasTimezonePlugin) {
    dayjs.extend(utc)
    dayjs.extend(timezone)
    ;(dayjs as unknown as { _hasTimezonePlugin?: boolean })._hasTimezonePlugin = true
  }

  const handleSave = () => {
    const data: Partial<Servicio> = {
      estado,
      costo_final: costoFinal === '' ? null : Number(costoFinal),
      nota_trabajo: notaTrabajo,
    }
    if (estado === 'Entregado') {
      const crDate = dayjs().tz('America/Costa_Rica')
      data.fecha_entrega = crDate.toISOString()
    } else if (estado === 'En revisión') {
      data.costo_estimado = costoEstimado === '' ? null : Number(costoEstimado)
    }
    onSave(data)
  }

  const handleNotify = (tipo: 'recibido' | 'revision' | 'listo' | 'entregado') => {
    const mensaje = mensajes.find((m) => m.tipo === tipo)
    if (!mensaje) {
      alert(`No se encontró plantilla de mensaje para el estado: ${tipo}`)
      return
    }

    const telefono = servicio.equipo?.cliente?.telefono?.replace(/\D/g, '') || ''
    const clienteNombre = servicio.equipo?.cliente?.nombre || 'Estimado cliente'
    const equipoInfo = `${servicio.equipo?.tipo || ''} ${servicio.equipo?.marca || ''} ${
      servicio.equipo?.modelo || ''
    }`.trim()
    const problema = servicio.descripcion_falla || 'No especificado'
    const costoEst = costoEstimado || servicio.costo_estimado || '-'
    const costoFin = costoFinal || servicio.costo_final || '-'

    const plantilla = mensaje.plantilla
      .replace(/{cliente}/g, clienteNombre)
      .replace(/{equipo}/g, equipoInfo)
      .replace(/{problema}/g, problema)
      .replace(/{costo_estimado}/g, `₡${costoEst}`)
      .replace(/{costo_final}/g, `₡${costoFin}`)

    const text = encodeURIComponent(plantilla)

    // Detectar Windows (incluye Windows 11 y el navegador Edge/Chrome)
    const isWindows = typeof navigator !== 'undefined' && /Win/i.test(navigator.platform || '')

    // Si es Windows → forzar WhatsApp Web
    // Sino → usar wa.me (mejor en móviles)
    const link = isWindows
      ? `https://web.whatsapp.com/send?phone=506${telefono}&text=${text}`
      : `https://wa.me/506${telefono}?text=${text}`

    window.open(link, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative'>
        <button
          className='absolute top-2 right-2 text-gray-500 hover:text-gray-800'
          onClick={onClose}
          title='Cerrar'
        >
          ×
        </button>
        <SectionTitle className='mb-4'>Editar Servicio</SectionTitle>
        <InfoBlock title={null} className='space-y-4'>
          <InfoRow
            label='Estado'
            value={
              <Select
                value={estado ?? ''}
                onChange={(e) => setEstado(e.target.value as Servicio['estado'])}
                title='Seleccionar estado'
                className='w-full'
              >
                {estados.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            }
          />
          {estado === 'En revisión' && (
            <InfoRow
              label='Costo estimado'
              value={
                <>
                  <Input
                    label=''
                    type='number'
                    value={costoEstimado}
                    onChange={(e) => setCostoEstimado(e.target.value)}
                    min={0}
                    step={0.01}
                    placeholder='Ingrese el costo estimado'
                    className='w-full'
                  />
                  {costoEstimado !== '' && (
                    <div className='mt-1 text-sm text-gray-500'>
                      <FormattedAmount amount={Number(costoEstimado)} />
                    </div>
                  )}
                </>
              }
            />
          )}
          <InfoRow
            label='Costo final'
            value={
              <>
                <Input
                  label=''
                  type='number'
                  value={costoFinal}
                  onChange={(e) => setCostoFinal(e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder='Ingrese el costo final'
                  className='w-full'
                />
                {costoFinal !== '' && (
                  <div className='mt-1 text-sm text-gray-500'>
                    <FormattedAmount amount={Number(costoFinal)} />
                  </div>
                )}
              </>
            }
          />
          <InfoRow
            label='Notas de trabajo'
            value={
              <Textarea
                value={notaTrabajo}
                onChange={(e) => setNotaTrabajo(e.target.value)}
                rows={3}
                placeholder='Ingrese notas de trabajo'
                title='Notas de trabajo'
                className='w-full'
              />
            }
          />
        </InfoBlock>
        <div className='flex flex-col gap-2 mt-6'>
          {estado === 'En revisión' && servicio.equipo?.cliente?.telefono && (
            <Button
              type='button'
              color='primary'
              className='mb-2'
              onClick={() => handleNotify('revision')}
            >
              Notificar costo estimado
            </Button>
          )}
          {estado === 'Listo' && servicio.equipo?.cliente?.telefono && (
            <Button
              type='button'
              color='primary'
              className='mb-2'
              onClick={() => handleNotify('listo')}
            >
              Notificar equipo listo por WhatsApp
            </Button>
          )}
          {estado === 'Entregado' && servicio.equipo?.cliente?.telefono && (
            <Button
              type='button'
              color='primary'
              className='mb-2'
              onClick={() => handleNotify('entregado')}
            >
              Enviar confirmación de entrega
            </Button>
          )}
          <div className='flex justify-end gap-2'>
            <Button type='button' color='secondary' onClick={onClose}>
              Cancelar
            </Button>
            <Button type='button' onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
