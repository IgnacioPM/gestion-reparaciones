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
      usuarios: {
        Row: {
          id_usuario: string
          nombre: string
          email: string
          password_hash: string
          rol: string | null
        }
        Insert: {
          id_usuario?: string
          nombre: string
          email: string
          password_hash: string
          rol?: string | null
        }
        Update: {
          nombre?: string
          email?: string
          password_hash?: string
          rol?: string | null
        }
      }
      clientes: {
        Row: {
          id_cliente: string
          nombre: string
          telefono: string
          correo: string
        }
        Insert: {
          id_cliente?: string
          nombre: string
          telefono: string
          correo: string
        }
        Update: {
          nombre?: string
          telefono?: string
          correo?: string
        }
      }
      equipos: {
        Row: {
          id_equipo: string
          cliente_id: string
          tipo: string
          marca: string
          modelo: string
          serie: string
          foto_url: string | null
        }
        Insert: {
          id_equipo?: string
          cliente_id: string
          tipo: string
          marca: string
          modelo: string
          serie: string
          foto_url?: string | null
        }
        Update: {
          cliente_id?: string
          tipo?: string
          marca?: string
          modelo?: string
          serie?: string
          foto_url?: string | null
        }
      }
      reparaciones: {
        Row: {
          id_reparacion: string
          equipo_id: string
          fecha_ingreso: string
          descripcion_falla: string
          estado: string
          costo_estimado: number
          nota_trabajo: string | null
          fecha_entrega: string | null
        }
        Insert: {
          id_reparacion?: string
          equipo_id: string
          fecha_ingreso: string
          descripcion_falla: string
          estado: string
          costo_estimado: number
          nota_trabajo?: string | null
          fecha_entrega?: string | null
        }
        Update: {
          equipo_id?: string
          fecha_ingreso?: string
          descripcion_falla?: string
          estado?: string
          costo_estimado?: number
          nota_trabajo?: string | null
          fecha_entrega?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
