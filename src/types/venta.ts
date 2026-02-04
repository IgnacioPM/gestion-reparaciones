export interface Venta {
  id_venta: string
  empresa_id: string
  cliente_id: string | null
  total: number
  metodo_pago: string | null
  created_at: string | null
  total_descuento: number
  detalle: VentaDetalle[]
}

export interface VentaDetalle {
  id_detalle: string
  venta_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  descuento_monto: number
  descuento_porcentaje: number | null
}
