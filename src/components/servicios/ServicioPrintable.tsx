import React from "react";
import Image from "next/image";
import { Servicio } from "@/types/servicio";
import { Profile } from "@/stores/auth";

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
            <div className="header">
                <div className="logo">
                    <Image src={logoSrc} alt={profile?.empresa?.nombre ?? "Logo"} width={150} height={150} style={{ objectFit: "contain" }} />
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

            <p>Fecha ingreso: {formatFechaSimple(servicio.fecha_ingreso)}</p>
            {servicio.fecha_entrega && <p>Fecha entrega: {formatFechaSimple(servicio.fecha_entrega)}</p>}
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
