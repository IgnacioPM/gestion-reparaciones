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

  const tipo_impresion =
    (searchParams.get('tipo') as 'factura' | 'etiqueta') ?? 'factura'

  const [servicio, setServicio] = useState<ServicioConNombres | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('servicios')
        .select(`
          id_reparacion,
          equipo_id,
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
        `)
        .eq('id_reparacion', id)
        .single()

      if (error) {
        console.error('Error impresión:', error)
        return
      }

      setServicio(data as ServicioConNombres)
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
      <ServicioPrintable
        servicio={servicio}
        profile={profile}
        tipo_impresion={tipo_impresion}
      />
    </div>
  )
}
