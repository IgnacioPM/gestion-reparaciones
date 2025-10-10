"use client";
// app/servicios/[id]/page.tsx
import { supabase } from "@/lib/supabaseClient"
import Navbar from "@/components/ui/Navbar"
import "@/styles/print.css"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { FormattedAmount } from "@/components/ui/FormattedAmount"
import { SectionTitle } from "@/components/ui/SectionTitle"
import { InfoBlock } from "@/components/ui/InfoBlock"
import { InfoRow } from "@/components/ui/InfoRow"
import { ServicioEditModal } from "@/components/servicios/ServicioEditModal"

import React from "react"
import { ServicioPrintable } from "@/components/servicios/ServicioPrintable"

import { Servicio } from "@/types/servicio"

function getBadgeColor(estado: string | null) {
    switch (estado) {
        case "Recibido": return "bg-yellow-100 text-yellow-800"
        case "En revisión": return "bg-orange-100 text-orange-800"
        case "En reparacion": return "bg-blue-100 text-blue-800"
        case "Listo": return "bg-green-100 text-green-800"
        case "Entregado": return "bg-gray-100 text-gray-800"
        case "Anulado": return "bg-red-100 text-red-800"
        default: return "bg-gray-100 text-gray-800"
    }
}

function formatFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })
}

// 👇 hacemos la page asíncrona y sacamos `params` con await
function ServicioDetallePageWrapper({ params }: { params: Promise<{ id: string }> }) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [servicio, setServicio] = React.useState<Servicio | null>(null);
    const [error, setError] = React.useState<{ message?: string } | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [id, setId] = React.useState<string>("");

    React.useEffect(() => {
        (async () => {
            const { id } = await params;
            setId(id);
            const { data, error } = await supabase
                .from("servicios")
                .select(`
                    id_reparacion,
                    fecha_ingreso,
                    descripcion_falla,
                    estado,
                    costo_estimado,
                    costo_final,
                    nota_trabajo,
                    fecha_entrega,
                    equipo:equipo_id (
                        tipo,
                        marca,
                        modelo,
                        serie,
                        cliente:cliente_id (
                            nombre,
                            telefono,
                            correo
                        )
                    )
                `)
                .eq("id_reparacion", id)
                .single();
            if (data) {
                // Si equipo y cliente vienen como array, tomar el primero
                const equipoRaw = Array.isArray(data.equipo) ? data.equipo[0] : data.equipo;
                let clienteRaw = equipoRaw?.cliente as { nombre?: string; telefono?: string; correo?: string } | { nombre?: string; telefono?: string; correo?: string }[] | undefined;
                if (Array.isArray(clienteRaw)) {
                    clienteRaw = clienteRaw[0];
                }
                const servicioNormalizado: Servicio = {
                    id_reparacion: data.id_reparacion ?? "",
                    equipo_id: equipoRaw?.serie ?? "", // Ajusta si tienes el id correcto
                    fecha_ingreso: data.fecha_ingreso ?? "",
                    descripcion_falla: data.descripcion_falla ?? null,
                    estado: data.estado ?? "Recibido",
                    costo_estimado: data.costo_estimado ?? null,
                    costo_final: data.costo_final ?? null,
                    nota_trabajo: data.nota_trabajo ?? null,
                    fecha_entrega: data.fecha_entrega ?? null,
                    equipo: equipoRaw ? {
                        tipo: equipoRaw.tipo ?? "",
                        marca: equipoRaw.marca ?? "",
                        modelo: equipoRaw.modelo ?? "",
                        serie: equipoRaw.serie ?? "",
                        cliente: clienteRaw && typeof clienteRaw === 'object' ? {
                            nombre: clienteRaw.nombre ?? "",
                            telefono: clienteRaw.telefono ?? "",
                            correo: clienteRaw.correo ?? ""
                        } : { nombre: "", telefono: "", correo: "" }
                    } : undefined
                };
                setServicio(servicioNormalizado);
            } else {
                setServicio(null);
            }
            setError(error);
            setLoading(false);
        })();
    }, [params, isModalOpen]);

    const handleSave = async (data: Partial<Servicio>) => {
        if (!id) return;
        await supabase.from("servicios").update(data).eq("id_reparacion", id);
        setIsModalOpen(false);
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center"><span className="text-gray-600 dark:text-gray-300">Cargando...</span></div>;
    }
    if (error || !servicio) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <Navbar />
                <div className="container mx-auto px-4 py-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Error al cargar el servicio
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{error?.message ?? "Servicio no encontrado"}</p>
                    <Link
                        href="/servicios"
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        <span>Volver a servicios</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex w-full">
                        <Link
                            href="/"
                            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            <span>Ir al inicio</span>
                        </Link>
                        {servicio.estado !== "Entregado" && (
                            <button
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors ml-auto"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Edit className="h-5 w-5" />
                                <span>Editar</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Detalles */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {servicio.equipo?.tipo ?? "Dispositivo"}
                            </h1>
                        </div>
                        <span
                            className={`px-3 py-1 rounded text-sm font-medium border ${getBadgeColor(servicio.estado ?? "Recibido")} border-opacity-40 shadow-sm select-none`}
                            style={{ letterSpacing: "0.04em" }}
                        >
                            {servicio.estado ?? "Recibido"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                        <div className="space-y-6">
                            <InfoBlock title={<SectionTitle>Cliente</SectionTitle>}>
                                <InfoRow label="Nombre" value={servicio.equipo?.cliente?.nombre} />
                                <InfoRow label="Teléfono" value={servicio.equipo?.cliente?.telefono} />
                                <InfoRow label="Correo" value={servicio.equipo?.cliente?.correo} />
                            </InfoBlock>
                            <InfoBlock title={<SectionTitle>Equipo</SectionTitle>}>
                                <InfoRow label="Tipo" value={servicio.equipo?.tipo} />
                                <InfoRow label="Marca" value={servicio.equipo?.marca} />
                                <InfoRow label="Modelo" value={servicio.equipo?.modelo} />
                                <InfoRow label="Serie" value={servicio.equipo?.serie} />
                            </InfoBlock>
                        </div>
                        <div className="space-y-6">
                            <InfoBlock title={<SectionTitle>Servicio</SectionTitle>}>
                                <InfoRow label="Fecha ingreso" value={formatFecha(servicio.fecha_ingreso)} />
                                {servicio.fecha_entrega && (
                                    <InfoRow label="Fecha entrega" value={formatFecha(servicio.fecha_entrega)} />
                                )}
                                {servicio.descripcion_falla && (
                                    <InfoRow label="Falla" value={servicio.descripcion_falla} />
                                )}
                                {servicio.nota_trabajo && (
                                    <InfoRow label="Notas" value={servicio.nota_trabajo} />
                                )}
                                {servicio.costo_estimado !== null && (
                                    <InfoRow label="Costo estimado" value={<FormattedAmount amount={Number(servicio.costo_estimado)} />} />
                                )}
                                {servicio.costo_final !== null && (
                                    <InfoRow label="Costo final" value={<FormattedAmount amount={Number(servicio.costo_final)} />} />
                                )}
                            </InfoBlock>
                        </div>
                    </div>

                    {/* Printable Service Details & Print Button */}
                    {servicio && (
                        <div>
                            <div className="flex justify-end mr-4 mb-4 print:hidden">
                                <button
                                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                                    onClick={() => window.print()}
                                >
                                    Imprimir
                                </button>
                            </div>
                            <div className="printable-servicio print-only" id="printable-servicio">
                                <ServicioPrintable servicio={servicio} />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ServicioEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                servicio={servicio}
                onSave={handleSave}
            />
        </div>
    );
}

export default ServicioDetallePageWrapper;
