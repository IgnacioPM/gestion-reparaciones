"use client";

import React, { useState } from "react";
import { Servicio } from "@/types/servicio";
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
    servicio: Servicio;
    onSave: (data: Partial<Servicio>) => void;
}

const estados = ["Recibido", "En revisión", "En reparacion", "Listo", "Entregado", "Anulado"];

export function ServicioEditModal({ isOpen, onClose, servicio, onSave }: ServicioEditModalProps) {
    const [estado, setEstado] = useState<Servicio["estado"]>(servicio.estado || "Recibido");
    const [costoEstimado, setCostoEstimado] = useState(servicio.costo_estimado !== undefined && servicio.costo_estimado !== null ? String(servicio.costo_estimado) : "");
    const [costoFinal, setCostoFinal] = useState(
        servicio.costo_final !== undefined && servicio.costo_final !== null
            ? String(servicio.costo_final)
            : (servicio.costo_estimado !== undefined && servicio.costo_estimado !== null
                ? String(servicio.costo_estimado)
                : "")
    );
    const [notaTrabajo, setNotaTrabajo] = useState(servicio.nota_trabajo ?? "");

    // Inicializar plugins solo una vez
    // Extender dayjs con los plugins solo una vez
    if (!(dayjs as unknown as { _hasTimezonePlugin?: boolean })._hasTimezonePlugin) {
        dayjs.extend(utc);
        dayjs.extend(timezone);
        (dayjs as unknown as { _hasTimezonePlugin?: boolean })._hasTimezonePlugin = true;
    }

    // Si el estado cambia a "Entregado", la fecha_entrega se actualizará al guardar
    const handleSave = () => {
        const data: Partial<Servicio> = {
            estado,
            costo_final: costoFinal === "" ? null : Number(costoFinal),
            nota_trabajo: notaTrabajo,
        };
        if (estado === "Entregado") {
            // Guardar la fecha en zona horaria America/Costa_Rica, en formato ISO completo (con zona horaria)
            const crDate = dayjs().tz("America/Costa_Rica");
            data.fecha_entrega = crDate.toISOString();
        } else if (estado === "En revisión") {
            data.costo_estimado = costoEstimado === "" ? null : Number(costoEstimado);
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
                                value={estado ?? ""}
                                onChange={e => setEstado(e.target.value as Servicio["estado"])}
                                title="Seleccionar estado"
                                className="w-full"
                            >
                                {estados.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </Select>
                        }
                    />
                    {estado === "En revisión" && (
                        <InfoRow
                            label="Costo estimado"
                            value={
                                <>
                                    <Input
                                        label=""
                                        type="number"
                                        value={costoEstimado}
                                        onChange={e => setCostoEstimado(e.target.value)}
                                        min={0}
                                        step={0.01}
                                        placeholder="Ingrese el costo estimado"
                                        className="w-full"
                                    />
                                    {costoEstimado !== "" && (
                                        <div className="mt-1 text-sm text-gray-500">
                                            <FormattedAmount amount={Number(costoEstimado)} />
                                        </div>
                                    )}
                                </>
                            }
                        />
                    )}
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
                <div className="flex flex-col gap-2 mt-6">
                    {estado === "En revisión" && servicio.equipo?.cliente?.telefono && (
                        <Button
                            type="button"
                            color="primary"
                            className="mb-2"
                            onClick={() => {
                                const telefono = servicio.equipo?.cliente?.telefono?.replace(/\D/g, "") || "";
                                const clienteNombre = servicio.equipo?.cliente?.nombre || "Estimado cliente";
                                const equipoInfo = `${servicio.equipo?.tipo || ""} ${servicio.equipo?.marca || ""} ${servicio.equipo?.modelo || ""}`.trim();
                                const notas = notaTrabajo?.trim() || "No se registraron observaciones adicionales.";
                                const mensaje = `Hola ${clienteNombre},\n\nHemos revisado su equipo *${equipoInfo || "dispositivo"}*.\n\n📋 Estado: En revisión\n📝 Notas de diagnóstico: ${notas}\n💵 Costo estimado: ₡${costoEstimado || servicio.costo_estimado || "-"}\n\nNos confirma si desea que procedamos con la reparación.\n\nMuchas gracias por confiar en nuestro servicio.`;
                                const link = `https://wa.me/506${telefono}?text=${encodeURIComponent(mensaje)}`;
                                window.open(link, "_blank");
                            }}
                        >
                            Notificar costo estimado
                        </Button>
                    )}

                    {estado === "Listo" && servicio.equipo?.cliente?.telefono && (
                        <Button
                            type="button"
                            color="primary"
                            className="mb-2"
                            onClick={() => {
                                const telefono = servicio.equipo?.cliente?.telefono?.replace(/\D/g, "") || "";
                                const clienteNombre = servicio.equipo?.cliente?.nombre || "Estimado cliente";
                                const equipoInfo = `${servicio.equipo?.tipo || ""} ${servicio.equipo?.marca || ""} ${servicio.equipo?.modelo || ""}`.trim();
                                const mensaje = `Hola ${clienteNombre},\n\nSu equipo *${equipoInfo || "dispositivo"}* ya está listo para ser retirado.\n\n📋 Estado: Listo para entrega\n💵 Costo final: ₡${costoFinal || servicio.costo_final || "-"}\n\nLe agradecemos mucho por confiar en nuestro servicio y quedamos atentos a cualquier consulta adicional.`;
                                const link = `https://wa.me/506${telefono}?text=${encodeURIComponent(mensaje)}`;
                                window.open(link, "_blank");
                            }}
                        >
                            Notificar equipo listo por WhatsApp
                        </Button>
                    )}

                    {estado === "Entregado" && servicio.equipo?.cliente?.telefono && (
                        <Button
                            type="button"
                            color="primary"
                            className="mb-2"
                            onClick={() => {
                                const telefono = servicio.equipo?.cliente?.telefono?.replace(/\D/g, "") || "";
                                const clienteNombre = servicio.equipo?.cliente?.nombre || "Estimado cliente";
                                const equipoInfo = `${servicio.equipo?.tipo || ""} ${servicio.equipo?.marca || ""} ${servicio.equipo?.modelo || ""}`.trim();
                                const notas = notaTrabajo?.trim() || "No se registraron observaciones adicionales.";
                                const costo = costoFinal || servicio.costo_final || "-";
                                const mensaje = `Hola ${clienteNombre},\n\nLe confirmamos que su equipo *${equipoInfo || "dispositivo"}* ha sido entregado exitosamente.\n\n📋 Estado final: Entregado\n📝 Trabajo realizado: ${notas}\n💵 Costo total cancelado: ₡${costo}\n\n✅ Muchas gracias por confiar en nuestro servicio.\n🤝 Su satisfacción es muy importante para nosotros.\n\n📲 Recuerde que puede contactarnos nuevamente para futuras reparaciones o mantenimientos. ¡Con gusto le atenderemos!`;
                                const link = `https://wa.me/506${telefono}?text=${encodeURIComponent(mensaje)}`;
                                window.open(link, "_blank");
                            }}
                        >
                            Enviar confirmación de entrega
                        </Button>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" color="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleSave}>
                            Guardar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
