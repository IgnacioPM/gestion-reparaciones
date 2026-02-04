import { z } from 'zod'

export const proveedorSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es requerido'),

  telefono: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),

  email: z
    .string()
    .trim()
    .email('Email no válido')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),

  direccion: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),

  activo: z.boolean().optional(),
})

export const proveedorWithIdSchema = proveedorSchema.extend({
  id_proveedor: z.string().uuid(),
})

export type ProveedorFormData = z.infer<typeof proveedorSchema>
export type Proveedor = z.infer<typeof proveedorWithIdSchema>
