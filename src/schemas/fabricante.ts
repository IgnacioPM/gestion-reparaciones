// schemas/marcaVenta.ts
import { z } from 'zod'

export const fabricanteSchema  = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
})

export type FabricanteFormData = z.infer<typeof fabricanteSchema>
