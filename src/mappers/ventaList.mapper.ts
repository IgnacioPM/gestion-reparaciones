import { VentaListItem } from '@/types/venta_list_item'
import { VentaListRow } from '@/types/venta_list_row'

export function mapVentaList(row: VentaListRow): VentaListItem {
  const productos = row.detalle?.map((d) => d.producto?.nombre).filter(Boolean) ?? []

  return {
    id_venta: row.id_venta,
    total: row.total,
    metodo_pago: row.metodo_pago,
    created_at: row.created_at,

    cliente: row.cliente
      ? {
          nombre: row.cliente.nombre,
          telefono: row.cliente.telefono,
        }
      : undefined,

    productos_preview:
      productos.length > 0
        ? productos.slice(0, 3).join(', ') + (productos.length > 3 ? '…' : '')
        : '—',
  }
}
