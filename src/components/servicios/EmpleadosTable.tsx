'use client'

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import EmpleadoEditModal from "@/components/servicios/EmpleadoEditModal";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { EmpleadoFormData } from "@/schemas/empleado";

import { Empleado } from "@/types/empleado";

export default function EmpleadosTable() {
    const { profile } = useAuthStore();
    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalEmpleados, setTotalEmpleados] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmpleado, setSelectedEmpleado] = useState<Partial<Empleado> | null>(null);
    const itemsPerPage = 10

    const fetchEmpleados = useCallback(async () => {
        setLoading(true)
        try {
            const from = (currentPage - 1) * itemsPerPage
            const to = from + itemsPerPage - 1

            const empresaId = profile?.empresa_id;
            if (!empresaId) {
                setEmpleados([]);
                setTotalEmpleados(0);
                setTotalPages(1);
                setLoading(false);
                return;
            }

            let query = supabase
                .from('usuarios')
                .select('id_usuario, nombre, email, rol', { count: 'exact' })
                .eq('empresa_id', empresaId);

            if (searchQuery.trim() !== "") {
                const q = `%${searchQuery.trim()}%`
                query = query.or(`nombre.ilike.${q},email.ilike.${q}`)
            }

            const { data, error, count } = await query
                .order('nombre', { ascending: true })
                .range(from, to)

            if (error) throw error

            if (data && count !== null) {
                setEmpleados(data)
                setTotalEmpleados(count)
                setTotalPages(Math.ceil(count / itemsPerPage))
            }
        } catch (error) {
            console.error('Error al cargar empleados:', error)
        } finally {
            setLoading(false)
        }
    }, [currentPage, profile, searchQuery])

    const handleNewEmpleado = () => {
        setSelectedEmpleado({});
        setIsModalOpen(true);
    }

    const handleViewEmpleado = (empleado: Empleado) => {
        setSelectedEmpleado(empleado);
        setIsModalOpen(true);
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmpleado(null);
    }

    const handleSaveEmpleado = async (data: EmpleadoFormData, id_usuario: string | null) => {
        setIsSubmitting(true);
        try {
            const dataToSave = { ...data, rol: data.rol || 'Tecnico' };

            if (id_usuario) {
                // Update
                const { error } = await supabase
                    .from('usuarios')
                    .update(dataToSave)
                    .eq('id_usuario', id_usuario);
                if (error) throw error;
                toast.success("Empleado actualizado correctamente");
            } else {
                // Create
                if (!data.password) {
                    throw new Error("La contraseña es obligatoria para crear un nuevo usuario.");
                }

                // 1. Create Supabase auth user
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error("No se pudo crear el usuario en Supabase Auth.");

                const auth_uid = authData.user.id;

                // 2. Create user in public.usuarios
                const empresaId = profile?.empresa_id;
                if (!empresaId) throw new Error("No se pudo identificar la empresa del usuario.");

                const { error: dbError } = await supabase
                    .from('usuarios')
                    .insert([{ ...dataToSave, empresa_id: empresaId, auth_uid: auth_uid }]);
                
                if (dbError) throw dbError;

                toast.success("Empleado creado correctamente. Se ha enviado un correo de confirmación.");
            }
            fetchEmpleados(); // Refresh table
            handleCloseModal();
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message || "Ocurrió un error");
            } else {
                toast.error("Ocurrió un error desconocido");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (profile) {
            fetchEmpleados()
        }
    }, [profile, fetchEmpleados])

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-end sm:justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empleados</h1>
                <button
                    onClick={handleNewEmpleado}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors ml-auto"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Empleado</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-grow relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                        placeholder="Buscar por nombre o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            Array(5).fill(0).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div></td>
                                </tr>
                            ))
                        ) : empleados.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    No hay empleados registrados
                                </td>
                            </tr>
                        ) : (
                            empleados.map((empleado) => (
                                <tr
                                    key={empleado.id_usuario}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    onClick={() => handleViewEmpleado(empleado)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{empleado.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{empleado.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{empleado.rol}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    {totalEmpleados > 0 ? (
                        <>
                            Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalEmpleados)}</span> de <span className="font-medium">{totalEmpleados}</span> resultados
                        </>
                    ) : (
                        "No hay resultados"
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        title="Página anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        title="Página siguiente"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <EmpleadoEditModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                empleado={selectedEmpleado}
                onSave={handleSaveEmpleado}
                isSubmitting={isSubmitting}
            />
        </div>
    )
}