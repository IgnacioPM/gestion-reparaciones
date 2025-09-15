"use client"

import { useState } from "react"
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
// Inicializar plugins dayjs solo una vez
if (!(dayjs)._hasTimezonePlugin) {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    (dayjs)._hasTimezonePlugin = true;
}
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft, Edit } from "lucide-react"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import FormError from "@/components/ui/FormError"
import ClienteForm, { Cliente } from "@/components/forms/ClienteForm"
import { servicioSchema, type ServicioFormData } from "@/schemas/servicio"
import { useRouter } from "next/navigation"

export default function NuevoServicioPage() {
    const router = useRouter()
    const [cliente, setCliente] = useState<Cliente | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        reset
    } = useForm<ServicioFormData>({
        resolver: zodResolver(servicioSchema)
    })

    const onSubmit = async (data: ServicioFormData) => {
        if (!cliente) {
            setError("root", {
                message: "Debe seleccionar o ingresar los datos del cliente"
            })
            return
        }

        setIsSubmitting(true)

        try {
            let clienteId = cliente.id_cliente;

            // Si es un cliente nuevo, verificamos si ya existe
            if (clienteId === "nuevo") {
                // Primero buscamos si existe un cliente con el mismo teléfono o correo
                const { data: clienteExistente } = await supabase
                    .from("clientes")
                    .select("id_cliente")
                    .or(`telefono.eq.${cliente.telefono},correo.eq.${cliente.correo}`)
                    .maybeSingle();

                if (clienteExistente) {
                    // Si el cliente ya existe, usamos su ID
                    clienteId = clienteExistente.id_cliente;
                } else {
                    // Si no existe, creamos uno nuevo
                    const { data: nuevoCliente, error: errorCliente } = await supabase
                        .from("clientes")
                        .insert({
                            nombre: cliente.nombre,
                            telefono: cliente.telefono,
                            correo: cliente.correo
                        })
                        .select('id_cliente')
                        .single();

                    if (errorCliente) {
                        throw errorCliente;
                    }

                    clienteId = nuevoCliente.id_cliente;
                }
            }

            // Primero crear el equipo
            const { data: nuevoEquipo, error: errorEquipo } = await supabase
                .from("equipos")
                .insert({
                    cliente_id: clienteId,
                    tipo: data.tipo_dispositivo,
                    marca: data.marca,
                    modelo: data.modelo,
                    serie: data.numero_serie || null
                })
                .select('id_equipo')
                .single()

            if (errorEquipo) {
                throw errorEquipo
            }

            // Luego crear el servicio
            // Usar la hora local de Costa Rica para fecha_ingreso
            const fechaIngresoCR = dayjs().tz("America/Costa_Rica").toISOString();

            // Si quieres permitir capturar fecha_entrega desde el formulario, aquí puedes agregar el campo y lógica
            // Por ahora, se envía como null (puedes ajustar si lo agregas al formulario)
            const fechaEntrega = null;

            const { error: errorServicio } = await supabase
                .from("servicios")
                .insert({
                    equipo_id: nuevoEquipo.id_equipo,
                    fecha_ingreso: fechaIngresoCR,
                    descripcion_falla: data.problema,
                    estado: "Recibido", // Si quieres permitir crear como 'Anulado', aquí puedes cambiarlo
                    nota_trabajo: data.observaciones || null,
                    costo_estimado: data.costo_estimado || null,
                    fecha_entrega: fechaEntrega
                })

            if (errorServicio) {
                throw errorServicio
            }

            // Generar link de WhatsApp con +506 y mensaje
            if (cliente.telefono) {
                const telefonoLimpio = cliente.telefono.replace(/\D/g, "");

                // Mensaje con iconos más acordes y salto de línea después de los :
                let mensaje = `🙋‍♂ Hola ${cliente.nombre},\n\n`;
                mensaje += `✅ *Hemos recibido su equipo.*\n`;
                mensaje += `\n💻 Dispositivo:\n${data.tipo_dispositivo || ""} ${data.marca || ""} ${data.modelo || ""}`;
                mensaje += `\n❗ Problema reportado:\n${data.problema || ""}`;
                mensaje += `\n💰 Costo estimado:\n${data.costo_estimado ? `₡${data.costo_estimado}` : "Pendiente"}`;
                mensaje += `\n📅 Fecha de ingreso:\n${dayjs(fechaIngresoCR).tz("America/Costa_Rica").format("DD/MM/YYYY HH:mm")}`;
                mensaje += `\n\nNos comunicaremos con usted cuando el diagnóstico esté listo.\n¡Gracias por confiar en nosotros!`;

                const linkWhatsApp = `https://wa.me/506${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;

                window.open(linkWhatsApp, "_blank");
                console.log("Link WhatsApp:", linkWhatsApp);
            }

            // Redireccionar a la página principal
            reset()
            router.push("/")
        } catch (error) {
            console.error("Error al registrar servicio:", error)
            let errorMessage = "Error al registrar el servicio"
            if (error instanceof Error) {
                errorMessage = error.message
            } else if (typeof error === 'object' && error !== null) {
                // Para errores de Supabase
                errorMessage = (error as any).message || (error as any).details || errorMessage
            }
            setError("root", {
                message: errorMessage
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClienteChange = (selectedCliente: Cliente | null) => {
        setCliente(selectedCliente)
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Servicio</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-4 sm:mt-0 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        <span>Volver al inicio</span>
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="mb-8">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información del Cliente</h2>
                        <ClienteForm onClienteChange={handleClienteChange} />
                    </div>

                    <hr className="my-8 border-gray-200 dark:border-gray-700" />

                    <div>
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información del Dispositivo</h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Tipo de dispositivo"
                                    type="text"
                                    {...register("tipo_dispositivo")}
                                    error={errors.tipo_dispositivo?.message}
                                />
                                <Input
                                    label="Marca"
                                    type="text"
                                    {...register("marca")}
                                    error={errors.marca?.message}
                                />
                                <Input
                                    label="Modelo"
                                    type="text"
                                    {...register("modelo")}
                                    error={errors.modelo?.message}
                                />
                                <Input
                                    label="Número de serie (opcional)"
                                    type="text"
                                    {...register("numero_serie")}
                                    error={errors.numero_serie?.message}
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Descripción del problema
                                    </label>
                                    <textarea
                                        {...register("problema")}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100
                                        shadow-sm focus:border-blue-500 dark:focus:border-blue-400 
                                        focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="Describa el problema del dispositivo"
                                    ></textarea>
                                    {errors.problema && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {errors.problema.message}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Input
                                            label="Costo estimado"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="999999.99"
                                            {...register("costo_estimado")}
                                            error={errors.costo_estimado?.message}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Observaciones (opcional)
                                    </label>
                                    <textarea
                                        {...register("observaciones")}
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100
                                        shadow-sm focus:border-blue-500 dark:focus:border-blue-400 
                                        focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="Observaciones adicionales"
                                    ></textarea>
                                    {errors.observaciones && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {errors.observaciones.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {errors.root && <FormError message={errors.root.message} />}

                            <div className="flex justify-end mt-6">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto"
                                >
                                    {isSubmitting ? "Registrando..." : "Registrar Servicio"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
