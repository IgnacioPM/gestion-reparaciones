'use client'

import React, { useState, useEffect } from "react";
import { MensajeWhatsapp } from "@/types/mensaje_whatsapp";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SectionTitle from "@/components/ui/SectionTitle";
import { InfoRow } from "@/components/ui/InfoRow";
import Textarea from "@/components/ui/Textarea";

interface MensajeWhatsappEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    mensaje: MensajeWhatsapp;
    onSave: (data: Partial<MensajeWhatsapp>) => void;
    isSubmitting: boolean;
}

export default function MensajeWhatsappEditModal({ isOpen, onClose, mensaje, onSave, isSubmitting }: MensajeWhatsappEditModalProps) {
    const [asunto, setAsunto] = useState(mensaje.asunto ?? "");
    const [plantilla, setPlantilla] = useState(mensaje.plantilla ?? "");

    useEffect(() => {
        setAsunto(mensaje.asunto ?? "");
        setPlantilla(mensaje.plantilla ?? "");
    }, [mensaje]);

    const handleSave = () => {
        onSave({ asunto, plantilla });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                    title="Cerrar"
                >
                    ×
                </button>
                <SectionTitle className="mb-4">Editar Mensaje de WhatsApp</SectionTitle>
                <div className="space-y-4">
                    <InfoRow
                        label="Tipo"
                        value={<Input type="text" value={mensaje.tipo} disabled className="w-full bg-gray-100 dark:bg-gray-700" />}
                    />
                    <InfoRow
                        label="Asunto"
                        value={<Input type="text" value={asunto} onChange={e => setAsunto(e.target.value)} className="w-full" />}
                    />
                    <InfoRow
                        label="Plantilla"
                        value={<Textarea value={plantilla} onChange={e => setPlantilla(e.target.value)} rows={8} className="w-full" />}
                    />
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p className="font-bold">Variables disponibles:</p>
                        <ul className="list-disc list-inside">
                            <li>`{'{cliente}'}`: Nombre del cliente</li>
                            <li>`{'{equipo}'}`: Información del equipo</li>
                            <li>`{'{problema}'}`: Problema reportado</li>
                            <li>`{'{costo_estimado}'}`: Costo estimado de la reparación</li>
                            <li>`{'{costo_final}'}`: Costo final de la reparación</li>
                        </ul>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" color="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Guardar"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
