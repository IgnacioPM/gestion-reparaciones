import { Producto } from '@/mappers/producto.mapper'
import { Proveedor } from '@/schemas/proveedor'

export interface CompraDetalleItem {
  id_detalle: string
  producto_id: string
  cantidad: number
  costo_unitario: number
  descuento_monto: number
  descuento_porcentaje: number | null
  subtotal: number
}

export interface CompraDetalle extends CompraDetalleItem {
  producto: Producto
}

export interface Compra {
  id_compra: string
  empresa_id: string
  proveedor_id: string
  total: number
  total_descuento: number
  metodo_pago: string | null
  created_at: string
}

export interface CompraConDetalles extends Compra {
  proveedor: Proveedor | null
  items: CompraDetalle[]
}

export interface ProveedorCredito {
  empresa_id: string
  proveedor_id: string
  credito_inicial: number
  saldo_actual: number
  updated_at: string
}

export interface ProveedorMovimiento {
  id_movimiento: string
  empresa_id: string
  proveedor_id: string
  compra_id: string | null
  tipo: 'cargo' | 'abono'
  monto: number
  metodo_pago: string | null
  descripcion: string | null
  created_at: string
}
