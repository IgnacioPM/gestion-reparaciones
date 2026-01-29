import { z } from 'zod'

export const servicioProductoSchema = z.object({
  servicio_id: z.string().uuid(),
  producto_id: z.string().uuid(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().positive(),
  subtotal: z.number().positive(),
})
