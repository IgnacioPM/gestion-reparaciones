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
        <div className="print-only">
            <div className="printable-servicio">
                {/* ENCABEZADO */}
                <header className="text-center mb-2">
                    <div className="logo-container">
                        <Image
                            src={logoDataUrl || profile?.empresa?.logo_url || "/icons/logo-CR.svg"}
                            alt="Logo"
                            width={90}
                            height={90}
                            className="mx-auto object-contain"
                        />
                    </div>
                    <h1>{profile?.empresa?.nombre || "Control de Reparaciones"}</h1>
                    {profile?.empresa?.slogan && <p>{profile.empresa.slogan}</p>}
                    <p>Dir: {profile?.empresa?.direccion}</p>
                    {profile?.empresa?.telefono && <p>Tel: {profile?.empresa?.telefono}</p>}
                </header>

                <hr />

                {/* DATOS FACTURA */}
                <section>
                    <p><strong>Fecha:</strong> {formatFecha(servicio.fecha_ingreso)}</p>
                    <p><strong>Estado:</strong> {servicio.estado}</p>
                </section>

                <hr />

                {/* CLIENTE */}
                <section>
                    <h2>Cliente</h2>
                    <p><strong>Nombre:</strong> {servicio.equipo?.cliente?.nombre}</p>
                    {servicio.equipo?.cliente?.telefono && (
                        <p><strong>Tel:</strong> {servicio.equipo?.cliente?.telefono}</p>
                    )}
                </section>

                <hr />

                {/* EQUIPO */}
                <section>
                    <h2>Equipo</h2>
                    <p><strong>Tipo:</strong> {servicio.equipo?.tipo}</p>
                    <p><strong>Marca:</strong> {servicio.equipo?.marca}</p>
                    <p><strong>Modelo:</strong> {servicio.equipo?.modelo}</p>
                    {servicio.equipo?.serie && <p><strong>Serie:</strong> {servicio.equipo?.serie}</p>}
                </section>

                <hr />

                {/* SERVICIO */}
                <section>
                    <h2>Detalle</h2>
                    <p><strong>Falla:</strong> {servicio.descripcion_falla}</p>
                    {servicio.nota_trabajo && (
                        <p><strong>Notas:</strong> {servicio.nota_trabajo}</p>
                    )}
                </section>

                <hr />

                {/* COSTOS */}
                <section className="text-right">
                    {servicio.costo_estimado !== null && (
                        <p><strong>Estimado:</strong> <FormattedAmount amount={Number(servicio.costo_estimado)} /></p>
                    )}
                    {servicio.costo_final !== null && (
                        <p><strong>Total:</strong> <FormattedAmount amount={Number(servicio.costo_final)} /></p>
                    )}
                </section>

                {/* PIE */}
                <footer>
                    <p>{profile?.empresa?.pie_pagina || "Gracias por su preferencia"}</p>
                    <p>Comprobante sin valor fiscal</p>
                    <p className="firma">Generado por {profile?.empresa?.nombre || "Sistema de Reparaciones"}</p>
                </footer>
            </div>
        </div>
    );
};
