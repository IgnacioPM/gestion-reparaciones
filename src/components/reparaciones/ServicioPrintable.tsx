import { Profile } from '@/stores/auth'
import { Servicio } from '@/types/servicio'
//import Image from 'next/image'
import React from 'react'

interface ServicioPrintableProps {
  servicio: Servicio
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
    hour12: true, // 👈 Esto activa el formato 12 horas con AM/PM
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
          {/* <div className='logo'>
            <Image
              src={logoSrc}
              alt={profile?.empresa?.nombre ?? 'Logo'}
              width={60}
              height={60}
              style={{ objectFit: 'contain' }}
            />
          </div> */}
          <h1>{profile?.empresa?.nombre ?? 'Control de Reparaciones'}</h1>
        </div>
      )}

      {!esEtiqueta && (
        <>
          <p>Dir: {profile?.empresa?.direccion ?? ''}</p>
          {profile?.empresa?.telefono && <p>Tel: {profile.empresa.telefono}</p>}
        </>
      )}

      {/* Siempre mostrar fecha */}
      <p>Fecha: {formatFechaSimple(servicio.fecha_ingreso)}</p>
      <p>Nro. Servicio: {servicio.numero_servicio ?? '--'}</p>

      {/* Cliente y equipo siempre visibles, incluso en etiqueta */}
      <h2>----- Cliente -----</h2>
      <p>Nombre: {servicio.equipo?.cliente?.nombre ?? ''}</p>
      <p>Tel: {servicio.equipo?.cliente?.telefono ?? ''}</p>

      <h2>----- Equipo -----</h2>
      <p>Tipo: {servicio.equipo?.tipo ?? ''}</p>
      <p>Marca: {servicio.equipo?.marca ?? ''}</p>
      <p>Modelo: {servicio.equipo?.modelo ?? ''}</p>
      <p>Serie: {servicio.equipo?.serie ?? ''}</p>

      {/* Siempre mostrar detalles */}
      <h2>----- Detalle -----</h2>
      <p>Falla: {servicio.descripcion_falla ?? ''}</p>
      <p>Notas: {servicio.nota_trabajo ?? ''}</p>

      {/* Costos solo si NO es etiqueta */}
      {!esEtiqueta && (
        <>
          <h2>----- Costos -----</h2>
          <div className='totals'>
            <p>
              <span>Estimado:</span>{' '}
              <span>
                {servicio.costo_estimado ? `₡${Number(servicio.costo_estimado).toFixed(2)}` : '-'}
              </span>
            </p>
            <p className='total'>
              <span>Total:</span>{' '}
              <span>
                {servicio.costo_final ? `₡${Number(servicio.costo_final).toFixed(2)}` : '-'}
              </span>
            </p>
          </div>
        </>
      )}

      {/* Fecha de entrega visible siempre */}
      {servicio.fecha_entrega && <p>Fecha entrega: {formatFechaSimple(servicio.fecha_entrega)}</p>}

      {/* Footer solo si no es etiqueta */}
      {!esEtiqueta && (
        <div className='footer'>
          <p>{profile?.empresa?.pie_pagina ?? 'Gracias por su preferencia'}</p>
          <p>Comprobante sin valor fiscal</p>
        </div>
      )}
    </div>
  )
}
