'use client'

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
import { ServicioConNombres } from '@/types/servicio'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useState } from 'react'

interface ServicioEditModalProps {
  isOpen: boolean
  onClose: () => void
  servicio: ServicioConNombres // 👈 AQUÍ está la corrección real
  onSave: (data: Partial<ServicioConNombres>) => void
}

const estados = ['Recibido', 'En revisión', 'En reparacion', 'Listo', 'Garantía', 'Entregado', 'Anulado']

export function ServicioEditModal({ isOpen, onClose, servicio, onSave }: ServicioEditModalProps) {
  const [estado, setEstado] = useState<ServicioConNombres['estado']>(servicio.estado || 'Recibido')

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
  const [descripcionFalla, setDescripcionFalla] = useState(servicio.descripcion_falla ?? '')
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
    // Validar que solo admin puede cambiar estado de "Entregado"
    if (servicio.estado === 'Entregado' && estado !== 'Entregado' && profile?.rol !== 'Admin') {
      alert('Solo administradores pueden cambiar el estado de servicios entregados.')
      return
    }

    // Si no es admin y el servicio está entregado, mantener el estado como Entregado
    const estadoFinal = servicio.estado === 'Entregado' && profile?.rol !== 'Admin' 
      ? servicio.estado 
      : estado

    const data: Partial<ServicioConNombres> = {
      estado: estadoFinal,
      nota_trabajo: notaTrabajo || null,
      descripcion_falla: descripcionFalla || null,
    }

    // Solo incluir costo_final si tiene valor
    if (costoFinal !== '') {
      data.costo_final = Number(costoFinal)
    }

    if (estadoFinal === 'Entregado') {
      const crDate = dayjs().tz('America/Costa_Rica')
      data.fecha_entrega = crDate.toISOString()
    } else if (estadoFinal === 'En revisión') {
      // Solo incluir costo_estimado si tiene valor
      if (costoEstimado !== '') {
        data.costo_estimado = Number(costoEstimado)
      }
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
    const equipoInfo =
      `${servicio.equipo?.tipos_dispositivo?.nombre || ''} ` +
      `${servicio.equipo?.marcas?.nombre || ''} ` +
      `${servicio.equipo?.modelo || ''}`.trim()

    const problema = descripcionFalla || servicio.descripcion_falla || 'No especificado'
    const costoEst = costoEstimado || servicio.costo_estimado || '-'
    const costoFin = costoFinal || servicio.costo_final || '-'

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
          {servicio.estado === 'Entregado' && profile?.rol !== 'Admin' && (
            <div className='bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded'>
              <p className='font-semibold'>No se puede modificar</p>
              <p className='text-sm mt-1'>
                Los servicios con estado "Entregado" no pueden cambiar de estado.
              </p>
            </div>
          )}

          {servicio.estado === 'Entregado' && profile?.rol === 'Admin' && (
            <div className='bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded'>
              <p className='font-semibold'>⚠️ Acción restringida a administrador</p>
              <p className='text-sm mt-1'>
                Solo administradores pueden cambiar el estado de servicios entregados.
              </p>
            </div>
          )}

          {(servicio.estado !== 'Entregado' || profile?.rol === 'Admin') && (
            <InfoRow
              label='Estado'
              value={
                <Select
                  value={estado ?? ''}
                  onChange={(e) => setEstado(e.target.value as ServicioConNombres['estado'])}
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
          )}

          {servicio.estado === 'Entregado' && profile?.rol !== 'Admin' && (
            <InfoRow
              label='Estado'
              value={<span className='text-gray-700 dark:text-gray-300'>{servicio.estado}</span>}
            />
          )}

          {estado === 'En revisión' && (
            <InfoRow
              label='Costo estimado'
              value={
                <>
                  <Input
                    label=''
                    value={costoEstimado}
                    onChange={(e) => setCostoEstimado(e.target.value)}
                    min={0}
                    step={0.01}
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
            label='Descripción del problema'
            value={
              <Textarea
                value={descripcionFalla}
                onChange={(e) => setDescripcionFalla(e.target.value)}
                rows={3}
                className='w-full'
              />
            }
          />

          <InfoRow
            label='Notas de trabajo'
            value={
              <Textarea
                value={notaTrabajo}
                onChange={(e) => setNotaTrabajo(e.target.value)}
                rows={3}
                className='w-full'
              />
            }
          />
        </InfoBlock>

        <div className='flex flex-col gap-2 mt-6'>
          {estado === 'En revisión' && servicio.equipo?.cliente?.telefono && (
            <Button onClick={() => handleNotify('revision')}>Notificar costo estimado</Button>
          )}

          {estado === 'Listo' && servicio.equipo?.cliente?.telefono && (
            <Button onClick={() => handleNotify('listo')}>Notificar equipo listo</Button>
          )}

          {estado === 'Entregado' && servicio.equipo?.cliente?.telefono && (
            <Button onClick={() => handleNotify('entregado')}>Confirmar entrega</Button>
          )}

          <div className='flex justify-end gap-2'>
            <Button color='secondary' onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
