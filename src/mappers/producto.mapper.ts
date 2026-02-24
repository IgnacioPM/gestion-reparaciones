import { ProductoConFabricanteRow } from '@/types/producto_con_fabricante'

export interface Producto {
  id_producto: string
  nombre: string
  descripcion: string | null
  codigo_barras: string | null
  precio_venta: number
  costo: number | null
  stock_actual: number
  fabricante: {
    id_fabricante?: string
    nombre: string
  }
  ubicacion_principal?: {
    id_ubicacion?: string
    codigo?: string
    id_catalogo?: string | null
    catalogo?: {
      id_catalogo?: string
      nombre?: string
    } | null
  } | null
  ubicacion_secundaria?: {
    id_ubicacion?: string
    codigo?: string
    id_catalogo?: string | null
    catalogo?: {
      id_catalogo?: string
      nombre?: string
    } | null
  } | null
}

export function mapProductoConFabricante(row: ProductoConFabricanteRow): Producto {
  return {
    id_producto: row.id_producto,
    nombre: row.nombre,
    descripcion: row.descripcion,
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
    ubicacion_principal: row.ubicacion_principal
      ? {
          id_ubicacion:
            (row.ubicacion_principal as any).id_ubicacion || (row.ubicacion_principal as any).id,
          codigo: row.ubicacion_principal.codigo,
          id_catalogo: (row.ubicacion_principal as any).id_catalogo || null,
          catalogo: row.ubicacion_principal_catalogo
            ? {
                id_catalogo:
                  (row.ubicacion_principal_catalogo as any).id_catalogo ||
                  (row.ubicacion_principal_catalogo as any).id,
                nombre: row.ubicacion_principal_catalogo.nombre,
              }
            : null,
        }
      : null,
    ubicacion_secundaria: row.ubicacion_secundaria
      ? {
          id_ubicacion:
            (row.ubicacion_secundaria as any).id_ubicacion || (row.ubicacion_secundaria as any).id,
          codigo: row.ubicacion_secundaria.codigo,
          id_catalogo: (row.ubicacion_secundaria as any).id_catalogo || null,
          catalogo: row.ubicacion_secundaria_catalogo
            ? {
                id_catalogo:
                  (row.ubicacion_secundaria_catalogo as any).id_catalogo ||
                  (row.ubicacion_secundaria_catalogo as any).id,
                nombre: row.ubicacion_secundaria_catalogo.nombre,
              }
            : null,
        }
      : null,
  }
}
