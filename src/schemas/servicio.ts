import { z } from 'zod'

export const servicioSchema = z.object({
  tipo_dispositivo: z.string().uuid('Tipo de dispositivo es requerido'),
  marca: z.string().uuid('La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  numero_serie: z.string().trim().optional(),
  problema: z.string().min(5, 'Describa el problema (mínimo 5 caracteres)'),
  accesorios: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
  costo_estimado: z
    .number()
    .optional()
    .nullable()
    .refine(
      (val): val is number | null =>
        val === null ||
        (typeof val === 'number' && val >= 0 && val <= 999999.99),
      'El costo debe ser un número válido entre 0 y 999,999.99'
    ),
  creado_por: z.string().optional().nullable(),
  numero_servicio: z.string().optional(),
})

export type ServicioFormData = z.infer<typeof servicioSchema>
