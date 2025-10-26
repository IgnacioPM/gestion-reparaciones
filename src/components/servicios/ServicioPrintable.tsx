import { Profile } from '@/stores/auth'
import { Servicio } from '@/types/servicio'
import Image from 'next/image'
import React from 'react'

interface ServicioPrintableProps {
  servicio: Servicio
  profile: Profile | null
  logoSrc: string
}

const formatFechaSimple = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const ServicioPrintable: React.FC<ServicioPrintableProps> = ({
  servicio,
  profile,
  logoSrc,
}) => {
  return (
    <div className='receipt-box'>
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
        {/* {profile?.empresa?.slogan && <p>{profile.empresa.slogan}</p>} */}
      </div>

      {/* <p>Orden: #{servicio.id_reparacion}</p> */}
      <p>Dir: {profile?.empresa?.direccion ?? ''}</p>
      {profile?.empresa?.telefono && <p>Tel: {profile.empresa.telefono}</p>}
      <p>Fecha: {formatFechaSimple(servicio.fecha_ingreso)}</p>

      <h2>----- Cliente -----</h2>
      <p>Nombre: {servicio.equipo?.cliente?.nombre ?? ''}</p>
      <p>Tel: {servicio.equipo?.cliente?.telefono ?? ''}</p>

      <h2>----- Equipo -----</h2>
      <p>Tipo: {servicio.equipo?.tipo ?? ''}</p>
      <p>Marca: {servicio.equipo?.marca ?? ''}</p>
      <p>Modelo: {servicio.equipo?.modelo ?? ''}</p>
      <p>Serie: {servicio.equipo?.serie ?? ''}</p>

      <h2>----- Detalle -----</h2>
      <p>Falla: {servicio.descripcion_falla ?? ''}</p>
      <p>Notas: {servicio.nota_trabajo ?? ''}</p>

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
          <span>{servicio.costo_final ? `₡${Number(servicio.costo_final).toFixed(2)}` : '-'}</span>
        </p>
      </div>

      {servicio.fecha_entrega && (
        <>
          <p>Fecha entrega: {formatFechaSimple(servicio.fecha_entrega)}</p>
        </>
      )}

      <div className='footer'>
        <p>{profile?.empresa?.pie_pagina ?? 'Gracias por su preferencia'}</p>
        <p>Comprobante sin valor fiscal</p>
      </div>
    </div>
  )
}
