'use client'

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuthStore } from "@/stores/auth"
import { toast } from "sonner"
import { Marca } from "@/types/marca"
import { TipoDispositivo } from "@/types/tipo_dispositivo"
import { Plus, Edit, Trash2 } from "lucide-react"
import MarcaEditModal from "./MarcaEditModal"
import Select from "../ui/Select"

interface MarcasTableProps {
    tiposDispositivo: TipoDispositivo[]
}

export default function MarcasTable({ tiposDispositivo }: MarcasTableProps) {
    const { profile } = useAuthStore()
    const [marcas, setMarcas] = useState<any[]>([]) // any to hold tipo name
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedMarca, setSelectedMarca] = useState<Partial<Marca> | null>(null)
    const [modalError, setModalError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [tipoFilter, setTipoFilter] = useState('')

    const fetchMarcas = useCallback(async () => {
        setLoading(true)
        if (!profile?.empresa_id) {
            setLoading(false)
            return
        }
        try {
            let query = supabase
                .from('marcas')
                .select(`
                    *,
                    tipos_dispositivo ( nombre )
                `)
                .eq('empresa_id', profile.empresa_id)

            if (tipoFilter) {
                query = query.eq('id_tipo', tipoFilter)
            }
            
            const { data, error } = await query.order('nombre', { ascending: true })

            if (error) throw error
            setMarcas(data)
        } catch (error) {
            toast.error("Error al cargar las marcas.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [profile, tipoFilter])

    useEffect(() => {
        fetchMarcas()
    }, [fetchMarcas])

    const handleNew = () => {
        setSelectedMarca({ id_tipo: tipoFilter || undefined })
        setModalError(null)
        setIsModalOpen(true)
    }
    
    const handleEdit = (marca: Marca) => {
        setSelectedMarca(marca)
        setModalError(null)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Está seguro de que desea eliminar esta marca? Esta acción no se puede deshacer.")) {
            return
        }

        try {
            const { error } = await supabase.from('marcas').delete().eq('id_marca', id)
            if (error) throw error
            toast.success("Marca eliminada correctamente.")
            fetchMarcas()
        } catch (error) {
            toast.error("Error al eliminar la marca.")
            console.error(error)
        }
    }

    const handleSave = async (formData: { nombre: string, id_tipo: string }) => {
        setIsSubmitting(true)
        setModalError(null)
        try {
            if (!profile?.empresa_id) throw new Error("No se pudo identificar la empresa.")

            if (selectedMarca?.id_marca) {
                // Update
                const { error } = await supabase
                    .from('marcas')
                    .update(formData)
                    .eq('id_marca', selectedMarca.id_marca)
                if (error) throw error
                toast.success("Marca actualizada.")
            } else {
                // Create
                const { error } = await supabase
                    .from('marcas')
                    .insert({ ...formData, empresa_id: profile.empresa_id })
                if (error) throw error
                toast.success("Marca creada.")
            }
            fetchMarcas()
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
                <h3 className="text-lg font-semibold">Marcas</h3>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors w-auto"
                >
                    <Plus className="w-5 h-5" />
                    <span>Agregar Marca</span>
                </button>
            </div>

            <div className="mb-4">
                <Select
                    label="Filtrar por tipo de dispositivo"
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value)}
                >
                    <option value="">Todos los tipos</option>
                    {tiposDispositivo.map((tipo) => (
                        <option key={tipo.id_tipo} value={tipo.id_tipo}>{tipo.nombre}</option>
                    ))}
                </Select>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo de Dispositivo</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={3} className="text-center p-4">Cargando...</td></tr>
                        ) : marcas.length === 0 ? (
                            <tr><td colSpan={3} className="text-center p-4">No hay marcas.</td></tr>
                        ) : (
                            marcas.map((marca) => (
                                <tr key={marca.id_marca}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{marca.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{marca.tipos_dispositivo.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(marca)} className="text-blue-600 hover:text-blue-900"><Edit/></button>
                                        <button onClick={() => handleDelete(marca.id_marca)} className="text-red-600 hover:text-red-900"><Trash2/></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <MarcaEditModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                isSubmitting={isSubmitting}
                error={modalError}
                initialData={selectedMarca}
                tiposDispositivo={tiposDispositivo}
            />
        </div>
    )
}
