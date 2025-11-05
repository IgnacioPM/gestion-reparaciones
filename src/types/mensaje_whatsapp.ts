export interface MensajeWhatsapp {
  id: string;
  empresa_id: string;
  tipo: "recibido" | "revision" | "listo" | "entregado";
  asunto: string | null;
  plantilla: string;
  activo: boolean | null;
  creado_en: string | null;
  actualizado_en: string | null;
}
