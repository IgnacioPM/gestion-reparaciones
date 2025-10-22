import { z } from 'zod'

export const empresaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la empresa es requerido'),
  telefono: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  logo_url: z.string().optional().nullable(),
  correo: z.string().email('Correo electrónico no válido').optional().nullable(),
  sitio_web: z.string().optional().nullable(),
})

export type EmpresaFormData = z.infer<typeof empresaSchema>
