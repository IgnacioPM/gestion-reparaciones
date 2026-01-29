// src/types/producto_venta.ts
export interface ProductoVenta {
  id_producto: string
  nombre: string
  codigo_barras: string | null
  precio_venta: number
  stock_actual: number
  fabricante: {
    id_fabricante: string
    nombre: string
  }
}
