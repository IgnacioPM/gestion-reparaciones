import { z } from 'zod'

export const ObservacionRapidaSchema = z.object({
  id_observacion: z.string().uuid({
    message: 'El id de la observación no es un uuid válido'
  }),
  empresa_id: z.string().uuid({
    message: 'El id de la empresa no es un uuid válido'
  }),
  id_tipo: z.string().uuid({
    message: 'El id del tipo no es un uuid válido'
  }),
  texto: z.string().min(1, {
    message: 'El texto es requerido'
  }).max(120, {
    message: 'El texto debe tener como máximo 120 caracteres'
  }),
  created_at: z.string().nullable()
})
