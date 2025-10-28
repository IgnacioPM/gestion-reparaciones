export interface Cliente {
  nombre?: string
  telefono?: string
  correo?: string
}

export interface Equipo {
  tipo?: string
  marca?: string
  modelo?: string
  serie?: string
  cliente?: Cliente
}

export interface Servicio {
  id_reparacion: string
  numero_servicio?: string | null
  equipo_id: string
  fecha_ingreso: string
  descripcion_falla?: string | null
  estado?:
    | 'Recibido'
    | 'En revisión'
    | 'En reparacion'
    | 'Listo'
    | 'Entregado'
    | 'Anulado'
    | null
  costo_estimado?: number | null
  nota_trabajo?: string | null
  fecha_entrega?: string | null
  created_at?: string | null
  costo_final?: number | null
  equipo?: Equipo
  tipo_impresion?: 'factura' | 'etiqueta'
}
