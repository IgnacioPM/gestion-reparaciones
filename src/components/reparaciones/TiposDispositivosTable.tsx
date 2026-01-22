'use client'

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuthStore } from "@/stores/auth"
import { toast } from "sonner"
import { TipoDispositivo } from "@/types/tipo_dispositivo"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import TipoDispositivoEditModal from "./TipoDispositivoEditModal"
import { TipoDispositivoFormData } from "./TipoDispositivoEditModal" // Import the interface

export default function TiposDispositivosTable() {
    const { profile } = useAuthStore()
    const [tipos, setTipos] = useState<TipoDispositivo[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedTipo, setSelectedTipo] = useState<Partial<TipoDispositivo> | null>(null)
    const [modalError, setModalError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchTipos = useCallback(async () => {
        setLoading(true)
        if (!profile?.empresa_id) {
            setLoading(false)
            return
        }
        try {
            const { data, error } = await supabase
                .from('tipos_dispositivo')
                .select('*')
                .eq('empresa_id', profile.empresa_id)
                .order('nombre', { ascending: true })

            if (error) throw error
            setTipos(data)
        } catch (error) {
            toast.error("Error al cargar los tipos de dispositivo.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [profile])

    useEffect(() => {
        fetchTipos()
    }, [fetchTipos])

    const handleNew = () => {
        setSelectedTipo({})
        setModalError(null)
        setIsModalOpen(true)
    }
    
    const handleEdit = (tipo: TipoDispositivo) => {
        setSelectedTipo(tipo)
        setModalError(null)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Está seguro de que desea eliminar este tipo de dispositivo? Esta acción no se puede deshacer.")) {
            return
        }

        try {
            const { error } = await supabase.from('tipos_dispositivo').delete().eq('id_tipo', id)
            if (error) throw error
            toast.success("Tipo de dispositivo eliminado correctamente.")
            fetchTipos()
        } catch (error) {
            toast.error("Error al eliminar el tipo de dispositivo.")
            console.error(error)
        }
    }

    const handleSave = async (formData: TipoDispositivoFormData) => { // Use TipoDispositivoFormData here
        setIsSubmitting(true)
        setModalError(null)
        try {
            if (!profile?.empresa_id) throw new Error("No se pudo identificar la empresa.")

            if (selectedTipo?.id_tipo) {
                // Update
                const { error } = await supabase
                    .from('tipos_dispositivo')
                    .update({ nombre: formData.nombre, predeterminado: formData.predeterminado })
                    .eq('id_tipo', selectedTipo.id_tipo)
                if (error) throw error
                toast.success("Tipo de dispositivo actualizado.")
            } else {
                // Create
                const { error } = await supabase
                    .from('tipos_dispositivo')
                    .insert({ nombre: formData.nombre, empresa_id: profile.empresa_id, predeterminado: formData.predeterminado })
                if (error) throw error
                toast.success("Tipo de dispositivo creado.")
            }
            fetchTipos()
            setIsModalOpen(false)
        } catch (error: any) {
            setModalError(error.message)
            toast.error(error.message || "Ocurrió un error.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Tipos de Dispositivo</h3>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors w-auto"
                >
                    <Plus className="w-5 h-5" />
                    <span>Agregar Tipo</span>
                </button>
            </div>
                        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Predeterminado</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {loading ? (
                                        <tr><td colSpan={3} className="text-center p-4">Cargando...</td></tr>
                                    ) : tipos.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center p-4">No hay tipos de dispositivo.</td></tr>
                                    ) : (
                                        tipos.map((tipo) => (
                                            <tr key={tipo.id_tipo}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tipo.nombre}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {tipo.predeterminado && (
                                                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 13.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    <button onClick={() => handleEdit(tipo)} className="text-blue-600 hover:text-blue-900"><Edit/></button>
                                                    <button onClick={() => handleDelete(tipo.id_tipo)} className="text-red-600 hover:text-red-900"><Trash2/></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <TipoDispositivoEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} isSubmitting={isSubmitting} error={modalError} initialData={selectedTipo} />
                    </div>
                )
            }
