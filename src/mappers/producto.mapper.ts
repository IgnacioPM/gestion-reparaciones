import { ProductoConFabricanteRow } from '@/types/producto_con_fabricante'

export interface Producto {
  id_producto: string
  nombre: string
  codigo_barras: string | null
  precio_venta: number
  stock_actual: number
  fabricante: {
    nombre: string
  }
}

export function mapProductoConFabricante(row: ProductoConFabricanteRow): Producto {
  return {
    id_producto: row.id_producto,
    nombre: row.nombre,
    codigo_barras: row.codigo_barras,
    precio_venta: row.precio_venta,
    stock_actual: row.stock_actual,
    fabricante: {
      nombre: row.fabricante?.nombre ?? 'Sin fabricante',
    },
  }
}
