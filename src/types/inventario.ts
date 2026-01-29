export interface InventarioMovimiento {
  id_movimiento: string
  empresa_id: string
  producto_id: string
  tipo: 'entrada' | 'salida' | 'ajuste' | 'venta' | 'reparacion'
  cantidad: number
  referencia: string | null
  observacion: string | null
  created_at: string | null
}
