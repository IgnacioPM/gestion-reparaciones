'use client';

import React, { useRef } from "react";
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
    const printRef = useRef<HTMLDivElement>(null);

    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <button
                onClick={handlePrint}
                className="fixed top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded text-sm z-50 print:hidden"
            >
                🖨 Imprimir
            </button>

            <div ref={printRef} className="print-only hidden">
                <div className="printable-servicio">
                    <header>
                        <div className="logo-container">
                            <Image
                                src={logoDataUrl || profile?.empresa?.logo_url || "/icons/logo-CR.svg"}
                                alt="Logo"
                                width={120}
                                height={120}
                                className="mx-auto object-contain"
                            />
                        </div>
                        <h1>{profile?.empresa?.nombre || "Control de Reparaciones"}</h1>
                        {profile?.empresa?.slogan && <p>{profile.empresa.slogan}</p>}
                        <p>Dir: {profile?.empresa?.direccion}</p>
                        {profile?.empresa?.telefono && <p>Tel: {profile.empresa.telefono}</p>}
                    </header>

                    <hr />

                    <section>
                        <p><strong>Fecha:</strong> {formatFecha(servicio.fecha_ingreso)}</p>
                        <p><strong>Estado:</strong> {servicio.estado}</p>
                    </section>

                    <hr />

                    <section>
                        <h2>Cliente</h2>
                        <p><strong>Nombre:</strong> {servicio.equipo?.cliente?.nombre}</p>
                        {servicio.equipo?.cliente?.telefono && (
                            <p><strong>Tel:</strong> {servicio.equipo?.cliente?.telefono}</p>
                        )}
                    </section>

                    <hr />

                    <section>
                        <h2>Equipo</h2>
                        <p><strong>Tipo:</strong> {servicio.equipo?.tipo}</p>
                        <p><strong>Marca:</strong> {servicio.equipo?.marca}</p>
                        <p><strong>Modelo:</strong> {servicio.equipo?.modelo}</p>
                        {servicio.equipo?.serie && <p><strong>Serie:</strong> {servicio.equipo?.serie}</p>}
                    </section>

                    <hr />

                    <section>
                        <h2>Detalle</h2>
                        <p><strong>Falla:</strong> {servicio.descripcion_falla}</p>
                        {servicio.nota_trabajo && <p><strong>Notas:</strong> {servicio.nota_trabajo}</p>}
                    </section>

                    <hr />

                    <section className="text-right">
                        {servicio.costo_estimado !== null && (
                            <p><strong>Estimado:</strong> <FormattedAmount amount={Number(servicio.costo_estimado)} /></p>
                        )}
                        {servicio.costo_final !== null && (
                            <p><strong>Total:</strong> <FormattedAmount amount={Number(servicio.costo_final)} /></p>
                        )}
                    </section>

                    <footer>
                        <p>{profile?.empresa?.pie_pagina || "Gracias por su preferencia"}</p>
                        <p>Comprobante sin valor fiscal</p>
                        <p className="firma">Generado por {profile?.empresa?.nombre || "Sistema de Reparaciones"}</p>
                    </footer>
                </div>
            </div>
        </>
    );
};
