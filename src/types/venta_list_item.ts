export interface VentaListItem {
  id_venta: string
  total: number
  metodo_pago: string | null
  created_at: string

  cliente?: {
    nombre: string
    telefono: string | null
  }

  productos_preview: string
}
