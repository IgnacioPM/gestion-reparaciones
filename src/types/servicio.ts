export interface Servicio {
  id_reparacion: string
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
  equipo?: {
    tipo?: string
    marca?: string
    modelo?: string
    serie?: string
    cliente?: {
      nombre?: string
      telefono?: string
      correo?: string
    }
  }
}
