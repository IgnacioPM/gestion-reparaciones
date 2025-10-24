import React from "react";
import { Servicio } from "@/types/servicio";
import { Profile } from "@/types/supabase";

interface ServicioPrintableProps {
    servicio: Servicio;
    profile: Profile | null;
    logoSrc: string;
}

const formatFechaSimple = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const ServicioPrintable: React.FC<ServicioPrintableProps> = ({
    servicio,
    profile,
    logoSrc,
}) => {
    return (
        <div className="printable-servicio">
            <style jsx global>{`
                @media print {
                    body > div:not(.printable-servicio) {
                        display: none;
                    }
                    .printable-servicio {
                        display: block !important;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 20px;
                        margin: 5mm;
                    }
                    .header, .footer {
                        text-align: center;
                    }
                    .logo {
                        margin-bottom: 5mm;
                    }
                    .logo img {
                        max-width: 150px;
                        height: auto;
                        display: block;
                        margin: 0 auto;
                    }
                    h1 {
                        font-size: 24px;
                        margin: 6px 0;
                        text-align: center;
                    }
                    h2 {
                        font-size: 22px;
                        margin: 4px 0;
                    }
                    p {
                        margin: 3px 0;
                        word-break: break-word;
                    }
                    hr {
                        border: none;
                        border-top: 1px dashed black;
                        margin: 5px 0;
                    }
                }
                .printable-servicio {
                    display: none; /* Hidden by default, only visible when printing */
                }
            `}</style>
            <div className="header">
                <div className="logo">
                    <img src={logoSrc} alt={profile?.empresa?.nombre ?? "Logo"} />
                </div>
                <h1>{profile?.empresa?.nombre ?? "Control de Reparaciones"}</h1>
                {profile?.empresa?.slogan ? <p>{profile.empresa.slogan}</p> : ""}
                <p>Dir: {profile?.empresa?.direccion ?? ""}</p>
                {profile?.empresa?.telefono ? <p>Tel: {profile.empresa.telefono}</p> : ""}
            </div>

            <hr />

            <h2>Cliente</h2>
            <p>Nombre: {servicio.equipo?.cliente?.nombre ?? ""}</p>
            <p>Tel: {servicio.equipo?.cliente?.telefono ?? ""}</p>
            <p>Correo: {servicio.equipo?.cliente?.correo ?? ""}</p>

            <hr />

            <h2>Equipo</h2>
            <p>Tipo: {servicio.equipo?.tipo ?? ""}</p>
            <p>Marca: {servicio.equipo?.marca ?? ""}</p>
            <p>Modelo: {servicio.equipo?.modelo ?? ""}</p>
            <p>Serie: {servicio.equipo?.serie ?? ""}</p>

            <hr />

            <h2>Detalle</h2>
            <p>Falla: {servicio.descripcion_falla ?? ""}</p>
            <p>Notas: {servicio.nota_trabajo ?? ""}</p>

            <hr />

            <p>Estimado: {servicio.costo_estimado ?? ""}</p>
            <p>Total: {servicio.costo_final ?? ""}</p>

            <hr />

            <div className="footer">
                <p>{profile?.empresa?.pie_pagina ?? "Gracias por su preferencia"}</p>
                <p>Comprobante sin valor fiscal</p>
            </div>
        </div>
    );
};
