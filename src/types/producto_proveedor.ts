import { z } from 'zod'
import { ProductoProveedorSchema } from '@/schemas/producto_proveedor'

export type ProductoProveedor = z.infer<typeof ProductoProveedorSchema>
