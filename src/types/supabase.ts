// types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      servicios: {
        Row: {
          id_servicio: string
          equipo_id: string
          fecha_ingreso: string
          descripcion_falla: string | null
          estado: 'Recibido' | 'En reparacion' | 'Listo' | 'Entregado' | null
          costo_estimado: number | null
          nota_trabajo: string | null
          fecha_entrega: string | null
          created_at: string | null
        }
        Insert: {
          id_servicio?: string
          equipo_id: string
          fecha_ingreso?: string
          descripcion_falla?: string | null
          estado?: 'Recibido' | 'En reparacion' | 'Listo' | 'Entregado' | null
          costo_estimado?: number | null
          nota_trabajo?: string | null
          fecha_entrega?: string | null
          created_at?: string | null
        }
        Update: {
          equipo_id?: string
          fecha_ingreso?: string
          descripcion_falla?: string | null
          estado?: 'Recibido' | 'En reparacion' | 'Listo' | 'Entregado' | null
          costo_estimado?: number | null
          nota_trabajo?: string | null
          fecha_entrega?: string | null
          created_at?: string | null
        }
      }
      clientes: {
        Row: {
          id_cliente: string
          nombre: string
          telefono: string | null
          correo: string | null
          created_at: string | null
        }
        Insert: {
          id_cliente?: string
          nombre: string
          telefono?: string | null
          correo?: string | null
          created_at?: string | null
        }
        Update: {
          nombre?: string
          telefono?: string | null
          correo?: string | null
          created_at?: string | null
        }
      }
      equipos: {
        Row: {
          id_equipo: string
          cliente_id: string
          tipo: string
          marca: string | null
          modelo: string | null
          serie: string | null
          foto_url: string | null
          created_at: string | null
        }
        Insert: {
          id_equipo?: string
          cliente_id: string
          tipo: string
          marca?: string | null
          modelo?: string | null
          serie?: string | null
          foto_url?: string | null
          created_at?: string | null
        }
        Update: {
          cliente_id?: string
          tipo?: string
          marca?: string | null
          modelo?: string | null
          serie?: string | null
          foto_url?: string | null
          created_at?: string | null
        }
      }

    }
  Views: object
  Functions: object
  Enums: object
  CompositeTypes: object
  }
}
