import { z } from 'zod'

export const tipoDispositivoSchema = z.object({
  nombre: z.string().min(1, {
    message: 'El nombre es requerido'
  }).max(50, {
    message: 'El nombre no puede tener más de 50 caracteres'
  })
})
