import { z } from 'zod'

export const ubicacionSchema = z.object({
  empresa_id: z.string().uuid('Empresa inválida'),
  codigo: z.string().trim().min(1, 'Código requerido'),
  id_catalogo: z.string().uuid('Catálogo inválido'),
  activo: z.boolean().optional(),
})

export type UbicacionFormData = z.infer<typeof ubicacionSchema>
