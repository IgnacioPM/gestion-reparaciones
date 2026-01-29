export interface VentaListRow {
  id_venta: string
  total: number
  metodo_pago: string | null
  created_at: string

  cliente: {
    nombre: string
    telefono: string | null
  } | null

  detalle:
    | {
        cantidad: number
        producto: {
          nombre: string
        } | null
      }[]
    | null
}
