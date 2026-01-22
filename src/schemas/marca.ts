import { z } from 'zod'

export const marcaSchema = z.object({
  id_tipo: z.string().uuid({
    message: 'El tipo de dispositivo es requerido'
  }),
  nombre: z.string().min(1, {
    message: 'El nombre es requerido'
  }).max(80, {
    message: 'El nombre no puede tener más de 80 caracteres'
  })
})
