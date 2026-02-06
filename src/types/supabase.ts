// types/supabase.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id_usuario: string
          nombre: string
          email: string
          rol: string | null
          created_at: string | null
          auth_uid: string | null
          empresa_id: string
          actualizado_en: string | null
          descuento_maximo: number
        }
        Insert: {
          id_usuario?: string
          nombre: string
          email: string
          rol?: string | null
          created_at?: string | null
          auth_uid?: string | null
          empresa_id: string
          actualizado_en?: string | null
          descuento_maximo?: number
        }
        Update: {
          nombre?: string
          email?: string
          rol?: string | null
          actualizado_en?: string | null
          descuento_maximo?: number
        }
      }
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
      proveedores: {
        Row: {
          id_proveedor: string
          empresa_id: string
          nombre: string
          telefono: string | null
          email: string | null
          direccion: string | null
          activo: boolean | null
          created_at: string | null
        }
        Insert: {
          id_proveedor?: string
          empresa_id: string
          nombre: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          activo?: boolean | null
          created_at?: string | null
        }
        Update: {
          id_proveedor?: string
          empresa_id?: string
          nombre?: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          activo?: boolean | null
          created_at?: string | null
        }
      }
      producto_proveedores: {
        Row: {
          id: string
          id_producto: string
          id_proveedor: string
          costo: number | null
          proveedor_principal: boolean | null
          activo: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          id_producto: string
          id_proveedor: string
          costo?: number | null
          proveedor_principal?: boolean | null
          activo?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          id_producto?: string
          id_proveedor?: string
          costo?: number | null
          proveedor_principal?: boolean | null
          activo?: boolean | null
          created_at?: string | null
        }
      }
      compras: {
        Row: {
          id_compra: string
          empresa_id: string
          proveedor_id: string
          total: number
          total_descuento: number
          metodo_pago: string | null
          created_at: string | null
        }
        Insert: {
          id_compra?: string
          empresa_id: string
          proveedor_id: string
          total: number
          total_descuento?: number
          metodo_pago?: string | null
          created_at?: string | null
        }
        Update: {
          total?: number
          total_descuento?: number
          metodo_pago?: string | null
        }
      }
      compras_detalle: {
        Row: {
          id_detalle: string
          compra_id: string
          producto_id: string
          cantidad: number
          costo_unitario: number
          descuento_monto: number
          descuento_porcentaje: number | null
          subtotal: number
        }
        Insert: {
          id_detalle?: string
          compra_id: string
          producto_id: string
          cantidad: number
          costo_unitario: number
          descuento_monto?: number
          descuento_porcentaje?: number | null
          subtotal: number
        }
        Update: {
          cantidad?: number
          descuento_monto?: number
          descuento_porcentaje?: number | null
          subtotal?: number
        }
      }
      proveedores_credito: {
        Row: {
          empresa_id: string
          proveedor_id: string
          credito_inicial: number
          saldo_actual: number
          updated_at: string | null
        }
        Insert: {
          empresa_id: string
          proveedor_id: string
          credito_inicial?: number
          saldo_actual?: number
          updated_at?: string | null
        }
        Update: {
          credito_inicial?: number
          saldo_actual?: number
          updated_at?: string | null
        }
      }
      proveedores_movimientos: {
        Row: {
          id_movimiento: string
          empresa_id: string
          proveedor_id: string
          compra_id: string | null
          tipo: 'cargo' | 'abono'
          monto: number
          metodo_pago: string | null
          descripcion: string | null
          created_at: string | null
        }
        Insert: {
          id_movimiento?: string
          empresa_id: string
          proveedor_id: string
          compra_id?: string | null
          tipo: 'cargo' | 'abono'
          monto: number
          metodo_pago?: string | null
          descripcion?: string | null
          created_at?: string | null
        }
        Update: {
          tipo?: 'cargo' | 'abono'
          monto?: number
          metodo_pago?: string | null
          descripcion?: string | null
        }
      }
    }
    Views: object
    Functions: object
    Enums: object
    CompositeTypes: object
  }
}
