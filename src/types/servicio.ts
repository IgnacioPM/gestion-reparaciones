export interface Cliente {
  nombre?: string
  telefono?: string
  correo?: string
}

export interface EquipoConNombres {
  tipo?: string
  marca?: string
  modelo?: string
  serie?: string
  cliente?: Cliente
  tipos_dispositivo?: { id_tipo: string; nombre: string } | null
  marcas?: { id_marca: string; nombre: string } | null
}

export interface ServicioConNombres {
  id_reparacion: string
  numero_servicio?: string | null
  equipo_id: string
  fecha_ingreso: string
  descripcion_falla?: string | null
  estado?: string | null
  costo_estimado?: number | null
  costo_final?: number | null
  nota_trabajo?: string | null
  fecha_entrega?: string | null
  equipo?: EquipoConNombres
}
