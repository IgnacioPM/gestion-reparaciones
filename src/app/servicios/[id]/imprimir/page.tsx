'use client'

import { useEffect, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { ServicioPrintable } from '@/components/servicios/ServicioPrintable'
import '@/styles/print.css'
import { Servicio, Cliente } from '@/types/servicio'

export default function ServicioImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { profile } = useAuthStore()
  const searchParams = useSearchParams()
  const tipo_impresion = (searchParams.get('tipo') as 'factura' | 'etiqueta') ?? 'factura'
  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('servicios')
        .select(`
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
        `)
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
      }
    }

    fetchData()
  }, [id])

  // Cargar logo en base64 (opcional)
  useEffect(() => {
    if (profile?.empresa?.logo_url) {
      fetch(profile.empresa.logo_url)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onloadend = () => setLogoDataUrl(reader.result as string)
          reader.readAsDataURL(blob)
        })
        .catch(console.error)
    }
  }, [profile])

  // Lanzar impresión automáticamente al cargar
  useEffect(() => {
    if (servicio) {
      setTimeout(() => window.print(), 500)
    }
  }, [servicio])

  if (!servicio) return <p>Cargando...</p>

  return (
    <div className="printable-area">
      <ServicioPrintable
        servicio={servicio}
        profile={profile}
        logoSrc={logoDataUrl ?? profile?.empresa?.logo_url ?? '/icons/logo-CR.svg'}
        tipo_impresion={tipo_impresion}
      />
    </div>
  )
}