'use client';
// app/servicios/[id]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/ui/Navbar";
import "@/styles/print.css";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { FormattedAmount } from "@/components/ui/FormattedAmount";
import SectionTitle from "@/components/ui/SectionTitle";
import { InfoBlock } from "@/components/ui/InfoBlock";
import { InfoRow } from "@/components/ui/InfoRow";
import { ServicioEditModal } from "@/components/servicios/ServicioEditModal";
import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Servicio, Cliente, Equipo } from "@/types/servicio";
import { useAuthStore } from "@/stores/auth";

// ------------------- Hook interno para imprimir ticket -------------------
function useServicioPrintable(servicio: Servicio | null, logoDataUrl?: string) {
    const { profile } = useAuthStore();

    const printTicket = useCallback(() => {
        if (!servicio) return;

        const logoSrc = logoDataUrl ?? profile?.empresa?.logo_url ?? "/icons/logo-CR.svg";

        const ticketContent = `
      <html>
        <head>
          <title>Comprobante</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 20px; margin: 5mm; }
            .header, .footer { text-align: center; }
            .logo { margin-bottom: 5mm; }
            .logo img { max-width: 150px; height: auto; display:block; margin:0 auto; }
            h1 { font-size: 24px; margin: 6px 0; text-align: center; }
            h2 { font-size: 22px; margin: 4px 0; }
            p { margin: 3px 0; word-break: break-word; }
            hr { border: none; border-top: 1px dashed black; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="printable-servicio">
            <div class="header">
              <div class="logo">
                <img src="${logoSrc}" alt="${profile?.empresa?.nombre ?? 'Logo'}" />
              </div>
              <h1>${profile?.empresa?.nombre ?? "Control de Reparaciones"}</h1>
              ${profile?.empresa?.slogan ?? "" ? `<p>${profile.empresa.slogan}</p>` : ""}
              <p>Dir: ${profile?.empresa?.direccion ?? ""}</p>
              ${profile?.empresa?.telefono ? `<p>Tel: ${profile.empresa.telefono}</p>` : ""}
            </div>

            <hr/>

            <h2>Cliente</h2>
            <p>Nombre: ${servicio.equipo?.cliente?.nombre ?? ""}</p>
            <p>Tel: ${servicio.equipo?.cliente?.telefono ?? ""}</p>
            <p>Correo: ${servicio.equipo?.cliente?.correo ?? ""}</p>

            <hr/>

            <h2>Equipo</h2>
            <p>Tipo: ${servicio.equipo?.tipo ?? ""}</p>
            <p>Marca: ${servicio.equipo?.marca ?? ""}</p>
            <p>Modelo: ${servicio.equipo?.modelo ?? ""}</p>
            <p>Serie: ${servicio.equipo?.serie ?? ""}</p>

            <hr/>

            <h2>Detalle</h2>
            <p>Falla: ${servicio.descripcion_falla ?? ""}</p>
            <p>Notas: ${servicio.nota_trabajo ?? ""}</p>

            <hr/>

            <p>Estimado: ${servicio.costo_estimado ?? ""}</p>
            <p>Total: ${servicio.costo_final ?? ""}</p>

            <hr/>

            <div class="footer">
              <p>${profile?.empresa?.pie_pagina ?? "Gracias por su preferencia"}</p>
              <p>Comprobante sin valor fiscal</p>
            </div>
          </div>
        </body>
      </html>
    `;

        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (!printWindow) return;
        printWindow.document.open();
        printWindow.document.write(ticketContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, [servicio, profile, logoDataUrl]);

    return { printTicket };
}

// ------------------- Funciones auxiliares -------------------
function getBadgeColor(estado: string | null) {
    switch (estado) {
        case "Recibido": return "bg-yellow-100 text-yellow-800";
        case "En revisión": return "bg-orange-100 text-orange-800";
        case "En reparacion": return "bg-blue-100 text-blue-800";
        case "Listo": return "bg-green-100 text-green-800";
        case "Entregado": return "bg-gray-100 text-gray-800";
        case "Anulado": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
    }
}

function formatFechaSimple(fecha: string) {
    return new Date(fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ------------------- Página -------------------
function ServicioDetallePageWrapper({ params }: { params: Promise<{ id: string }> }) {
    const { profile } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [servicio, setServicio] = useState<Servicio | null>(null);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [id, setId] = useState<string>("");
    const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
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
                const equipoRaw = Array.isArray(data.equipo) ? data.equipo[0] : data.equipo;
                const clienteRaw: Cliente | undefined = equipoRaw?.cliente
                    ? Array.isArray(equipoRaw.cliente)
                        ? equipoRaw.cliente[0]
                        : equipoRaw.cliente
                    : undefined;

                const servicioNormalizado: Servicio = {
                    id_reparacion: data.id_reparacion ?? "",
                    equipo_id: equipoRaw?.serie ?? "",
                    fecha_ingreso: data.fecha_ingreso ?? "",
                    descripcion_falla: data.descripcion_falla ?? null,
                    estado: data.estado ?? "Recibido",
                    costo_estimado: data.costo_estimado ?? null,
                    costo_final: data.costo_final ?? null,
                    nota_trabajo: data.nota_trabajo ?? null,
                    fecha_entrega: data.fecha_entrega ?? null,
                    equipo: equipoRaw
                        ? {
                            tipo: equipoRaw.tipo ?? "",
                            marca: equipoRaw.marca ?? "",
                            modelo: equipoRaw.modelo ?? "",
                            serie: equipoRaw.serie ?? "",
                            cliente: clienteRaw ?? { nombre: "", telefono: "", correo: "" },
                        }
                        : undefined,
                };

                setServicio(servicioNormalizado);

                // Convertir logo a Data URL
                if (profile?.empresa?.logo_url) {
                    try {
                        const response = await fetch(profile.empresa.logo_url);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        reader.onloadend = () => setLogoDataUrl(reader.result as string);
                        reader.readAsDataURL(blob);
                    } catch (err) {
                        console.error("Error al cargar logo:", err);
                    }
                }
            } else {
                setServicio(null);
            }

            setError(error);
            setLoading(false);
        })();
    }, [params, profile]);

    const handleSave = async (data: Partial<Servicio>) => {
        if (!id) return;
        await supabase.from("servicios").update(data).eq("id_reparacion", id);
        setIsModalOpen(false);
    };

    const { printTicket } = useServicioPrintable(servicio, logoDataUrl);

    if (loading)
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300">Cargando...</span>
            </div>
        );

    if (error || !servicio)
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

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar />
            <main className="container mx-auto px-4 py-8">

                {/* Preload logo para impresión */}
                {profile?.empresa?.logo_url && (
                    <Image src={profile.empresa.logo_url} alt="" width={0} height={0} className="w-0 h-0 opacity-0 absolute print:hidden" />
                )}

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
                                <InfoRow label="Fecha ingreso" value={formatFechaSimple(servicio.fecha_ingreso)} />
                                {servicio.fecha_entrega && (
                                    <InfoRow label="Fecha entrega" value={formatFechaSimple(servicio.fecha_entrega)} />
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

                    {/* Botón de impresión */}
                    <div className="flex justify-end mr-4 mb-4">
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                            onClick={() => printTicket()}
                        >
                            Imprimir
                        </button>
                    </div>
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
