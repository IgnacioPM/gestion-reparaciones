import React from "react";
import { Servicio } from "@/types/servicio";
import { FormattedAmount } from "../ui/FormattedAmount";

interface ServicioPrintableProps {
    servicio: Servicio;
}

export const ServicioPrintable: React.FC<ServicioPrintableProps> = ({ servicio }) => {
    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="p-6 text-gray-900 bg-white w-full font-sans">
            {/* Encabezado tipo factura */}
            <header className="mb-6 border-b pb-2">
                <h1 className="text-3xl font-bold">Detalle de Servicio</h1>
                <p className="text-gray-600">Estado: {servicio.estado}</p>
            </header>

            {/* Cliente */}
            <section className="mb-6">
                <h2 className="font-semibold text-lg mb-2 border-b pb-1">Cliente</h2>
                <p>Nombre: {servicio.equipo?.cliente?.nombre}</p>
                <p>Teléfono: {servicio.equipo?.cliente?.telefono}</p>
                <p>Correo: {servicio.equipo?.cliente?.correo}</p>
            </section>

            {/* Equipo */}
            <section className="mb-6">
                <h2 className="font-semibold text-lg mb-2 border-b pb-1">Equipo</h2>
                <p>Tipo: {servicio.equipo?.tipo}</p>
                <p>Marca: {servicio.equipo?.marca}</p>
                <p>Modelo: {servicio.equipo?.modelo}</p>
                <p>Serie: {servicio.equipo?.serie}</p>
            </section>

            {/* Servicio */}
            <section className="mb-6">
                <h2 className="font-semibold text-lg mb-2 border-b pb-1">Servicio</h2>
                <p>Fecha ingreso: {formatFecha(servicio.fecha_ingreso)}</p>
                {servicio.fecha_entrega && <p>Fecha entrega: {formatFecha(servicio.fecha_entrega)}</p>}
                {servicio.descripcion_falla && <p>Falla: {servicio.descripcion_falla}</p>}
                {servicio.nota_trabajo && <p>Notas de trabajo: {servicio.nota_trabajo}</p>}
                {servicio.costo_estimado !== null && (
                    <p>Costo estimado: <FormattedAmount amount={Number(servicio.costo_estimado)} /></p>
                )}
                {servicio.costo_final !== null && (
                    <p>Costo final: <FormattedAmount amount={Number(servicio.costo_final)} /></p>
                )}
            </section>

            <footer className="mt-6 border-t pt-2 text-gray-600 text-sm">
                <p>Gracias por confiar en nuestro servicio.</p>
            </footer>
        </div>
    );
};
