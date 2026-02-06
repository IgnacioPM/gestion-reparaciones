import { ProductoConFabricanteRow } from '@/types/producto_con_fabricante'

export interface Producto {
  id_producto: string
  nombre: string
  codigo_barras: string | null
  precio_venta: number
  costo: number | null
  stock_actual: number
  fabricante: {
    id_fabricante?: string
    nombre: string
  }
}

export function mapProductoConFabricante(row: ProductoConFabricanteRow): Producto {
  return {
    id_producto: row.id_producto,
    nombre: row.nombre,
    codigo_barras: row.codigo_barras,
    precio_venta: row.precio_venta,
    costo: row.costo,
    stock_actual: row.stock_actual,
    fabricante: row.fabricante
      ? {
          id_fabricante: (row.fabricante as any).id_fabricante || (row.fabricante as any).id,
          nombre: row.fabricante?.nombre ?? 'Sin fabricante',
        }
      : { nombre: 'Sin fabricante' },
  }
}
