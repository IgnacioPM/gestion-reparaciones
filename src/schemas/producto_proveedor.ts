// schemas/productoProveedor.ts
import { z } from 'zod'

export const ProductoProveedorSchema = z.object({
  id: z.string().uuid().optional(),
  id_producto: z.string().uuid(),
  id_proveedor: z.string().uuid(),
  costo: z.number().optional().nullable(),
  proveedor_principal: z.boolean().optional(),
  activo: z.boolean().optional(),
  created_at: z.string().optional(),
})

export type ProductoProveedor = z.infer<typeof ProductoProveedorSchema>
