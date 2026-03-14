'use client'

import { ServicioPrintable } from '@/components/reparaciones/ServicioPrintable'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import '@/styles/print.css'
import { ServicioConNombres } from '@/types/servicio'
import { useSearchParams } from 'next/navigation'
import { use, useEffect, useState } from 'react'

export default function ServicioImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { profile } = useAuthStore()
  const searchParams = useSearchParams()

  const tipo_impresion = (searchParams.get('tipo') as 'factura' | 'etiqueta') ?? 'factura'

  const [servicio, setServicio] = useState<ServicioConNombres | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('servicios')
        .select(
          `
    id_reparacion,
    numero_servicio,
    equipo_id,
    fecha_ingreso,
    created_at,
    descripcion_falla,
    observaciones,
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

      if (error || !data) {
        console.error('Error impresión:', error)
        return
      }

      const equipoRaw = Array.isArray(data.equipo) ? data.equipo[0] : data.equipo

      // 🔹 Obtener IDs
      const tipoId = equipoRaw?.tipo
      const marcaId = equipoRaw?.marca

      // 🔹 Traer tipo dispositivo
      const { data: tipoData } = tipoId
        ? await supabase
            .from('tipos_dispositivo')
            .select('id_tipo, nombre')
            .eq('id_tipo', tipoId)
            .single()
        : { data: null }

      // 🔹 Traer marca
      const { data: marcaData } = marcaId
        ? await supabase.from('marcas').select('id_marca, nombre').eq('id_marca', marcaId).single()
        : { data: null }

      const fechaIngresoMostrada =
        data.fecha_ingreso && data.fecha_entrega && data.fecha_ingreso === data.fecha_entrega
          ? (data.created_at ?? data.fecha_ingreso)
          : data.fecha_ingreso

      const servicioNormalizado: ServicioConNombres = {
        id_reparacion: data.id_reparacion,
        numero_servicio: data.numero_servicio,
        equipo_id: data.equipo_id, // ✅ SOLUCIÓN
        fecha_ingreso: fechaIngresoMostrada,
        created_at: data.created_at,
        descripcion_falla: data.descripcion_falla,
        observaciones: data.observaciones,
        estado: data.estado,
        costo_estimado: data.costo_estimado,
        costo_final: data.costo_final,
        nota_trabajo: data.nota_trabajo,
        fecha_entrega: data.fecha_entrega,
        equipo: equipoRaw
          ? {
              ...equipoRaw,
              tipos_dispositivo: tipoData
                ? { id_tipo: tipoData.id_tipo, nombre: tipoData.nombre }
                : null,
              marcas: marcaData ? { id_marca: marcaData.id_marca, nombre: marcaData.nombre } : null,
              cliente: equipoRaw.cliente
                ? Array.isArray(equipoRaw.cliente)
                  ? equipoRaw.cliente[0]
                  : equipoRaw.cliente
                : { nombre: '', telefono: '', correo: '' },
            }
          : undefined,
      }

      setServicio(servicioNormalizado)
    }

    fetchData()
  }, [id])

  useEffect(() => {
    if (servicio) {
      setTimeout(() => window.print(), 500)
    }
  }, [servicio])

  if (!servicio) return <p>Cargando...</p>

  return (
    <div className='printable-area'>
      <ServicioPrintable servicio={servicio} profile={profile} tipo_impresion={tipo_impresion} />
    </div>
  )
}
