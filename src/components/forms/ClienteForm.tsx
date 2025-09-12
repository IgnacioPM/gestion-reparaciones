"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import Input from "@/components/ui/Input"

export interface Cliente {
    id_cliente: string
    nombre: string
    telefono: string | null
    correo: string | null
}

interface ClienteFormProps {
    onClienteChange: (cliente: Cliente | null) => void
}

export default function ClienteForm({ onClienteChange }: ClienteFormProps) {
    const [nombre, setNombre] = useState("")
    const [telefono, setTelefono] = useState("")
    const [correo, setCorreo] = useState("")
    const [sugerencias, setSugerencias] = useState<Cliente[]>([])
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
    const [busquedaActiva, setBusquedaActiva] = useState(false)

    // Manejar cambios en los campos
    const handleInputChange = (field: string, value: string) => {
        switch (field) {
            case 'nombre':
                setNombre(value)
                // Solo activar búsqueda si no hay cliente seleccionado o el nombre es diferente
                if (!clienteSeleccionado || value !== clienteSeleccionado.nombre) {
                    setBusquedaActiva(true)
                    setClienteSeleccionado(null)
                }
                break
            case 'telefono':
                setTelefono(value)
                break
            case 'correo':
                setCorreo(value)
                break
        }

        if (clienteSeleccionado && field === 'nombre' && value !== clienteSeleccionado.nombre) {
            setClienteSeleccionado(null)
        }

        // Validar y actualizar cliente solo si no hay uno seleccionado
        if (!clienteSeleccionado) {
            const nombreTrim = field === 'nombre' ? value.trim() : nombre.trim()
            const telefonoTrim = field === 'telefono' ? value.trim() : telefono.trim()
            const correoTrim = field === 'correo' ? value.trim() : correo.trim()

            if (nombreTrim && telefonoTrim) {
                const nuevoCliente: Cliente = {
                    id_cliente: "nuevo",
                    nombre: nombreTrim,
                    telefono: telefonoTrim,
                    correo: correoTrim || null
                }
                onClienteChange(nuevoCliente)
            } else {
                onClienteChange(null)
            }
        }
    }

    // Buscar clientes por nombre
    useEffect(() => {
        const fetchClientes = async () => {
            if (!busquedaActiva || nombre.length < 2 || clienteSeleccionado) {
                setSugerencias([])
                return
            }
            const { data } = await supabase
                .from("clientes")
                .select("id_cliente, nombre, telefono, correo")
                .ilike("nombre", `%${nombre}%`)
                .limit(5)
            setSugerencias(data || [])
        }
        fetchClientes()
    }, [nombre, busquedaActiva, clienteSeleccionado])

    const handleSelectCliente = (cliente: Cliente) => {
        setClienteSeleccionado(cliente)
        setNombre(cliente.nombre)
        setTelefono(cliente.telefono || "")
        setCorreo(cliente.correo || "")
        setSugerencias([])
        setBusquedaActiva(false)
        onClienteChange(cliente)
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Input
                    label="Nombre del cliente"
                    type="text"
                    value={nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                />
                {sugerencias.length > 0 && (
                    <ul className="absolute z-10 w-full border rounded mt-1 bg-white dark:bg-gray-800 shadow">
                        {sugerencias.map((c) => (
                            <li
                                key={c.id_cliente}
                                onClick={() => handleSelectCliente(c)}
                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            >
                                {c.nombre} – {c.telefono}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Input
                label="Teléfono"
                type="text"
                value={telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                required
            />

            <Input
                label="Correo (opcional)"
                type="email"
                value={correo}
                onChange={(e) => handleInputChange('correo', e.target.value)}
            />
        </div>
    )
}