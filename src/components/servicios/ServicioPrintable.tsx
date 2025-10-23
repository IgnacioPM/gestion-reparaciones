'use client'

import React from "react";
import Image from "next/image";
import { Servicio } from "@/types/servicio";
import { useAuthStore } from "@/stores/auth";
import { FormattedAmount } from "../ui/FormattedAmount";

interface ServicioPrintableProps {
    servicio: Servicio;
    logoDataUrl: string | null;
}

export const ServicioPrintable: React.FC<ServicioPrintableProps> = ({ servicio, logoDataUrl }) => {
    const { profile } = useAuthStore();

    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <div className="printable-servicio bg-white text-black font-mono text-[11px] w-[58mm] mx-auto p-1 leading-tight">
            {/* ENCABEZADO */}
            <header className="text-center mb-2">
                {logoDataUrl ? (
                    <Image
                        src={logoDataUrl}
                        alt="Logo"
                        width={48}
                        height={48}
                        className="mx-auto object-contain"
                    />
                ) : (
                    <Image
                        src={profile?.empresa?.logo_url || "/icons/logo-CR.svg"}
                        alt="Logo"
                        width={48}
                        height={48}
                        className="mx-auto object-contain"
                    />
                )}

                <h1 className="font-bold uppercase text-[12px] mt-1">
                    {profile?.empresa?.nombre || "Control de Reparaciones"}
                </h1>
                {profile?.empresa?.slogan && <p className="text-[10px]">{profile.empresa.slogan}</p>}
                <p>Dir: {profile?.empresa?.direccion}</p>
                {profile?.empresa?.telefono && <p>Tel: {profile?.empresa?.telefono}</p>}
            </header>

            <hr className="border border-black border-dashed my-1" />

            {/* DATOS FACTURA */}
            <section className="text-left mb-2">
                <p><strong>Fecha:</strong> {formatFecha(servicio.fecha_ingreso)}</p>
                <p><strong>Estado:</strong> {servicio.estado}</p>
            </section>

            <hr className="border border-black border-dashed my-1" />

            {/* CLIENTE */}
            <section className="mb-2">
                <h2 className="font-bold text-center underline">Cliente</h2>
                <p><strong>Nombre:</strong> {servicio.equipo?.cliente?.nombre}</p>
                {servicio.equipo?.cliente?.telefono && (
                    <p><strong>Tel:</strong> {servicio.equipo?.cliente?.telefono}</p>
                )}
            </section>

            <hr className="border border-black border-dashed my-1" />

            {/* EQUIPO */}
            <section className="mb-2">
                <h2 className="font-bold text-center underline">Equipo</h2>
                <p><strong>Tipo:</strong> {servicio.equipo?.tipo}</p>
                <p><strong>Marca:</strong> {servicio.equipo?.marca}</p>
                <p><strong>Modelo:</strong> {servicio.equipo?.modelo}</p>
                {servicio.equipo?.serie && <p><strong>Serie:</strong> {servicio.equipo?.serie}</p>}
            </section>

            <hr className="border border-black border-dashed my-1" />

            {/* SERVICIO */}
            <section className="mb-2">
                <h2 className="font-bold text-center underline">Detalle</h2>
                <p><strong>Falla:</strong> {servicio.descripcion_falla}</p>
                {servicio.nota_trabajo && (
                    <p><strong>Notas:</strong> {servicio.nota_trabajo}</p>
                )}
            </section>

            <hr className="border border-black border-dashed my-1" />

            {/* COSTOS */}
            <section className="text-right mb-1">
                {servicio.costo_estimado !== null && (
                    <p><strong>Estimado:</strong> <FormattedAmount amount={Number(servicio.costo_estimado)} /></p>
                )}
                {servicio.costo_final !== null && (
                    <p><strong>Total:</strong> <FormattedAmount amount={Number(servicio.costo_final)} /></p>
                )}
            </section>

            {/* PIE */}
            <footer className="mt-2 text-center text-[10px]">
                <p>{profile?.empresa?.pie_pagina || 'Gracias por su preferencia'}</p>
                <p>Comprobante sin valor fiscal</p>
                <p className="mt-2 text-[9px]">
                    Generado por {profile?.empresa?.nombre || "Sistema de Reparaciones"}
                </p>
            </footer>
        </div>
    );
};
