import { z } from 'zod'

export const productoSchema = z.object({
  id_fabricante: z.string().uuid('Marca requerida'),
  nombre: z.string().min(2, 'Nombre requerido'),
  descripcion: z.string().optional(),
  codigo_barras: z.string().optional(),
  tipo: z.enum(['venta', 'repuesto', 'ambos']),
  precio_venta: z.number().min(0, 'Precio inválido'),
  costo: z.number().optional(),
  stock_actual: z.number().int().min(0),
  stock_minimo: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
})



export type ProductoFormData = z.infer<typeof productoSchema>
