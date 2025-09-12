"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { FormattedAmount } from "@/components/ui/FormattedAmount";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { InfoBlock } from "@/components/ui/InfoBlock";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { InfoRow } from "@/components/ui/InfoRow";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

interface ServicioEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    servicio: any;
    onSave: (data: Partial<any>) => void;
}

const estados = ["Recibido", "En reparacion", "Listo", "Entregado"];

export function ServicioEditModal({ isOpen, onClose, servicio, onSave }: ServicioEditModalProps) {
    const [estado, setEstado] = useState(servicio.estado || "Recibido");
    const [costoFinal, setCostoFinal] = useState(servicio.costo_final ?? "");
    const [notaTrabajo, setNotaTrabajo] = useState(servicio.nota_trabajo ?? "");

    // Inicializar plugins solo una vez
    // Extender dayjs con los plugins solo una vez
    if (!(dayjs as any)._hasTimezonePlugin) {
        dayjs.extend(utc);
        dayjs.extend(timezone);
        (dayjs as any)._hasTimezonePlugin = true;
    }

    // Si el estado cambia a "Entregado", la fecha_entrega se actualizará al guardar
    const handleSave = () => {
        const data: any = {
            estado,
            costo_final: costoFinal === "" ? null : Number(costoFinal),
            nota_trabajo: notaTrabajo,
        };
        if (estado === "Entregado") {
            // Guardar la fecha en zona horaria America/Costa_Rica, en formato ISO completo (con zona horaria)
            const crDate = dayjs().tz("America/Costa_Rica");
            data.fecha_entrega = crDate.toISOString();
        }
        onSave(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                    title="Cerrar"
                >
                    ×
                </button>
                <SectionTitle className="mb-4">Editar Servicio</SectionTitle>
                <InfoBlock title={null} className="space-y-4">
                    <InfoRow
                        label="Estado"
                        value={
                            <Select
                                value={estado}
                                onChange={e => setEstado(e.target.value)}
                                title="Seleccionar estado"
                                className="w-full"
                            >
                                {estados.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </Select>
                        }
                    />
                    <InfoRow
                        label="Costo final"
                        value={
                            <>
                                <Input
                                    label=""
                                    type="number"
                                    value={costoFinal}
                                    onChange={e => setCostoFinal(e.target.value)}
                                    min={0}
                                    step={0.01}
                                    placeholder="Ingrese el costo final"
                                    className="w-full"
                                />
                                {costoFinal !== "" && <div className="mt-1 text-sm text-gray-500"><FormattedAmount amount={Number(costoFinal)} /></div>}
                            </>
                        }
                    />
                    <InfoRow
                        label="Notas de trabajo"
                        value={
                            <Textarea
                                value={notaTrabajo}
                                onChange={e => setNotaTrabajo(e.target.value)}
                                rows={3}
                                placeholder="Ingrese notas de trabajo"
                                title="Notas de trabajo"
                                className="w-full"
                            />
                        }
                    />
                </InfoBlock>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" color="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        Guardar
                    </Button>
                </div>
            </div>
        </div>
    );
}
