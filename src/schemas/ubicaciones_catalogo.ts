import { z } from 'zod'

export const ubicacionesCatalogoSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido'),
  activo: z.boolean().optional(),
})

export type UbicacionesCatalogoFormData = z.infer<typeof ubicacionesCatalogoSchema>
