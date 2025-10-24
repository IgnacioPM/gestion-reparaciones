'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { Servicio, Cliente } from "@/types/servicio";
import { useAuthStore } from "@/stores/auth";
import { ServicioPrintable } from "@/components/servicios/ServicioPrintable";

interface PageProps {
    params: { id: string };
}

function PrintServicioPage({ params }: PageProps) {
    const { profile } = useAuthStore();
    const [servicio, setServicio] = useState<Servicio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fetchServicio = async () => {
            const { id } = params;
            if (!id) {
                setError("ID de servicio no proporcionado.");
                setLoading(false);
                return;
            }

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

            if (error) {
                console.error("Error fetching servicio for print:", error);
                setError(error.message);
                setLoading(false);
                return;
            }

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
                        console.error("Error al cargar logo para impresión:", err);
                    }
                }
            } else {
                setServicio(null);
            }
            setLoading(false);
        };

        fetchServicio();
    }, [params, profile]);

    useEffect(() => {
        if (!loading && servicio) {
            // Give a small delay to ensure content is rendered before printing
            const timer = setTimeout(() => {
                window.print();
                // Optionally close the window after printing
                // window.close();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, servicio]);

    if (loading) {
        return <div>Cargando comprobante para imprimir...</div>;
    }

    if (error || !servicio) {
        return <div>Error al cargar el comprobante: {error || "Servicio no encontrado"}</div>;
    }

    return (
        <div className="print-only-container">
            <ServicioPrintable
                servicio={servicio}
                profile={profile}
                logoSrc={logoDataUrl ?? profile?.empresa?.logo_url ?? "/icons/logo-CR.svg"}
            />
        </div>
    );
}

export default PrintServicioPage;
