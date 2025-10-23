import { z } from 'zod';

export const EmpleadoSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('El correo electrónico no es válido'),
  rol: z.enum(['Admin', 'Tecnico']).default('Tecnico'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
});

export type EmpleadoFormData = z.infer<typeof EmpleadoSchema>;
