export interface Producto {
  id_producto: string
  empresa_id: string
  fabricante?: {
    id_fabricante: string
    nombre: string
  }
  nombre: string
  descripcion: string | null
  codigo_barras: string | null
  tipo: 'venta' | 'repuesto' | 'ambos'
  precio_venta: number
  costo: number | null
  stock_actual: number
  stock_minimo: number | null
  activo: boolean | null
  created_at: string | null
  id_ubicacion_principal?: string | null
  id_ubicacion_secundaria?: string | null
}
