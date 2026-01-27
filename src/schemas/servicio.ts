import { z } from 'zod'

export const servicioSchema = z.object({
  tipo_dispositivo: z.string().uuid('Tipo de dispositivo es requerido'),
  marca: z.string().uuid('La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  numero_serie: z.string().trim().optional(),
  problema: z.string().min(5, 'Describa el problema (mínimo 5 caracteres)'),
  accesorios: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
  nota_trabajo: z.string().trim().optional(),
  costo_estimado: z
    .string()
    .optional()
    .nullable()
    .transform((val, ctx) => {
      if (val === null || val === undefined || val.trim() === '') {
        return null
      }
      // Allow comma as decimal separator
      const processedVal = val.replace(',', '.')
      const parsed = Number(processedVal)
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: 'custom',
          message: 'En este campo solo se aceptan números',
        })
        return z.NEVER
      }
      return parsed
    })
    .refine((val) => val === null || (val >= 0 && val <= 999999.99), {
      message: 'El costo debe ser un número válido entre 0 y 999,999.99',
    }),
  creado_por: z.string().optional().nullable(),
  numero_servicio: z.string().optional(),
})

export type ServicioFormData = z.infer<typeof servicioSchema>
export type ServicioFormInput = z.input<typeof servicioSchema>
