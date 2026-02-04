import { z } from 'zod'

const ventaDetalleSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().positive(),
  subtotal: z.number().positive(),
  descuento_monto: z.number().nonnegative(),
  descuento_porcentaje: z.number().nullable()
})

export const ventaSchema = z.object({
  empresa_id: z.string().uuid(),
  cliente_id: z.string().uuid().nullable(),
  total: z.number().positive(),
  metodo_pago: z.string().nullable(),
  total_descuento: z.number().nonnegative(),
  detalle: z.array(ventaDetalleSchema).min(1, 'La venta debe tener al menos un producto')
})
