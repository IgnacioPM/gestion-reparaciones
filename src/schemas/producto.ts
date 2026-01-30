import { z } from 'zod'

export const productoSchema = z.object({
  id_fabricante: z.string().uuid('Marca inválida').optional().nullable(),

  nombre: z.string().trim().min(2, 'Nombre requerido'),

  descripcion: z.string().trim().optional().nullable(),

  codigo_barras: z.string().trim().optional().nullable(),

  tipo: z.enum(['venta', 'repuesto', 'ambos']),

  precio_venta: z
    .number({
      required_error: 'El precio de venta es obligatorio',
      invalid_type_error: 'El precio de venta es obligatorio',
    })
    .refine((v) => !Number.isNaN(v), {
      message: 'El precio de venta es obligatorio',
    })
    .refine((v) => v > 0, {
      message: 'El precio de venta debe ser mayor a 0',
    }),

  costo: z
    .number()
    .optional()
    .nullable()
    .refine((v) => v == null || !Number.isNaN(v), {
      message: 'Costo inválido',
    }),

  stock_actual: z.number().int().min(0, 'El stock no puede ser negativo'),

  stock_minimo: z
    .number()
    .int()
    .optional()
    .nullable()
    .refine((v) => v == null || v >= 0, {
      message: 'El stock mínimo no puede ser negativo',
    }),

  activo: z.boolean().optional(),
})

export type ProductoFormData = z.infer<typeof productoSchema>
