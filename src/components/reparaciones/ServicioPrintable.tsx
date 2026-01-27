import { Profile } from '@/stores/auth'
import { ServicioConNombres } from '@/types/servicio'
import React from 'react'

interface ServicioPrintableProps {
  servicio: ServicioConNombres
  profile: Profile | null
  tipo_impresion: 'factura' | 'etiqueta'
}

const formatFechaSimple = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export const ServicioPrintable: React.FC<ServicioPrintableProps> = ({
  servicio,
  profile,
  tipo_impresion,
}) => {
  const esEtiqueta = tipo_impresion === 'etiqueta'

  return (
    <div className='receipt-box'>
      {!esEtiqueta && (
        <div className='header'>
          <h1>{profile?.empresa?.nombre ?? 'Control de Reparaciones'}</h1>
        </div>
      )}

      {!esEtiqueta && (
        <>
          <p>Dir: {profile?.empresa?.direccion ?? ''}</p>
          {profile?.empresa?.telefono && <p>Tel: {profile.empresa.telefono}</p>}
        </>
      )}

      <p>Fecha: {formatFechaSimple(servicio.fecha_ingreso)}</p>
      <p>Nro. Servicio: {servicio.numero_servicio ?? '--'}</p>

      <h2>----- Cliente -----</h2>
      <p>Nombre: {servicio.equipo?.cliente?.nombre ?? ''}</p>
      <p>Tel: {servicio.equipo?.cliente?.telefono ?? ''}</p>

      <h2>----- Equipo -----</h2>
      <p>Tipo: {servicio.equipo?.tipos_dispositivo?.nombre ?? ''}</p>
      <p>Marca: {servicio.equipo?.marcas?.nombre ?? ''}</p>
      <p>Modelo: {servicio.equipo?.modelo ?? ''}</p>
      <p>Serie: {servicio.equipo?.serie ?? ''}</p>

      <h2>----- Detalle -----</h2>
      <p>Falla: {servicio.descripcion_falla ?? ''}</p>
      <p>Observaciones: {servicio.observaciones ?? ''}</p>
      <p>Notas: {servicio.nota_trabajo ?? ''}</p>

      {!esEtiqueta && (
        <>
          <h2>----- Costos -----</h2>
          <div className='totals'>
            <p>
              <span>Estimado:</span>{' '}
              <span>
                {servicio.costo_estimado !== null
                  ? `₡${Number(servicio.costo_estimado).toFixed(2)}`
                  : '-'}
              </span>
            </p>
            <p className='total'>
              <span>Total:</span>{' '}
              <span>
                {servicio.costo_final !== null
                  ? `₡${Number(servicio.costo_final).toFixed(2)}`
                  : '-'}
              </span>
            </p>
          </div>
        </>
      )}

      {servicio.fecha_entrega && <p>Fecha entrega: {formatFechaSimple(servicio.fecha_entrega)}</p>}

      {!esEtiqueta && (
        <div className='footer'>
          <p>{profile?.empresa?.pie_pagina ?? 'Gracias por su preferencia'}</p>
          <p>Comprobante sin valor fiscal</p>
        </div>
      )}
    </div>
  )
}
