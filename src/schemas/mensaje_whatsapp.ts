import { z } from "zod";

export const mensajeWhatsappSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid(),
  tipo: z.enum(["recibido", "revision", "listo", "entregado"]),
  asunto: z.string().nullable().optional(),
  plantilla: z.string().min(1, "La plantilla no puede estar vacía"),
  activo: z.boolean().default(true).nullable(),
  creado_en: z.string().optional(),
  actualizado_en: z.string().optional(),
});
