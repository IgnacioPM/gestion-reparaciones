'use client'

import { useEffect, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { ServicioPrintable } from '@/components/reparaciones/ServicioPrintable'
import '@/styles/print.css'
import { Cliente, Servicio, Equipo } from '@/types/servicio'

interface EquipoConNombres extends Equipo {
  tipos_dispositivo?: { nombre: string } | null
  marcas?: { nombre: string } | null
}

interface ServicioConNombres extends Servicio {
  equipo?: EquipoConNombres
}

export default function ServicioImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { profile } = useAuthStore()
  const searchParams = useSearchParams()
  const tipo_impresion = (searchParams.get('tipo') as 'factura' | 'etiqueta') ?? 'factura'
  const [servicio, setServicio] = useState<ServicioConNombres | null>(null)

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

        // Collect unique tipo_dispositivo_ids and marca_ids
        const tipoDispositivoIds = new Set<string>();
        const marcaIds = new Set<string>();

        if (equipoRaw && equipoRaw.tipo) {
            tipoDispositivoIds.add(equipoRaw.tipo);
        }
        if (equipoRaw && equipoRaw.marca) {
            marcaIds.add(equipoRaw.marca);
        }

        // Fetch tipo_dispositivo names
        let tipoDispositivoData = null;
        if (tipoDispositivoIds.size > 0) {
            const { data: fetchedTipoDispositivoData, error: tipoDispositivoError } = await supabase
                .from('tipos_dispositivo')
                .select('id_tipo, nombre')
                .in('id_tipo', Array.from(tipoDispositivoIds));
            
            if (tipoDispositivoError) throw tipoDispositivoError;
            tipoDispositivoData = fetchedTipoDispositivoData;
        }

        const tipoDispositivoMap = new Map<string, string>();
        tipoDispositivoData?.forEach(td => tipoDispositivoMap.set(td.id_tipo, td.nombre));

        // Fetch marca names
        let marcaData = null;
        if (marcaIds.size > 0) {
            const { data: fetchedMarcaData, error: marcaError } = await supabase
                .from('marcas')
                .select('id_marca, nombre')
                .in('id_marca', Array.from(marcaIds));

            if (marcaError) throw marcaError;
            marcaData = fetchedMarcaData;
        }

        const marcaMap = new Map<string, string>();
        marcaData?.forEach(m => marcaMap.set(m.id_marca, m.nombre));

        const clienteRaw: Cliente | undefined = equipoRaw?.cliente
          ? Array.isArray(equipoRaw.cliente)
            ? equipoRaw.cliente[0]
            : equipoRaw.cliente
          : undefined

        const tipoDispositivoNombre = equipoRaw?.tipo ? tipoDispositivoMap.get(equipoRaw.tipo) : null;
        const marcaNombre = equipoRaw?.marca ? marcaMap.get(equipoRaw.marca) : null;


        const servicioNormalizado: ServicioConNombres = { // Changed to ServicioConNombres
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
                ...equipoRaw, // Include existing equipoRaw properties
                cliente: clienteRaw ?? { nombre: '', telefono: '', correo: '' },
                tipos_dispositivo: tipoDispositivoNombre ? { nombre: tipoDispositivoNombre } : null,
                marcas: marcaNombre ? { nombre: marcaNombre } : null,
            }
            : undefined,
        }

        setServicio(servicioNormalizado)
      }
    }

    fetchData()
  }, [id])



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
        tipo_impresion={tipo_impresion}
      />
    </div>
  )
}