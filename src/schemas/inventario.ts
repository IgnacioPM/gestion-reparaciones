import { z } from 'zod'

export const inventarioMovimientoSchema = z.object({
  empresa_id: z.string().uuid(),
  producto_id: z.string().uuid(),
  tipo: z.enum(['entrada', 'salida', 'ajuste', 'venta', 'reparacion']),
  cantidad: z.number().int('La cantidad debe ser un número entero'),
  referencia: z.string().nullable(),
  observacion: z.string().nullable(),
})
