// schemas/empleado.ts
import { z } from 'zod'

export const EmpleadoSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  rol: z.enum(['Admin', 'Tecnico']).optional(),
})

export type EmpleadoFormData = z.infer<typeof EmpleadoSchema>
