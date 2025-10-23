'use client'

import { EmpleadoFormData } from "@/schemas/empleado";
import EmpleadoForm from "@/components/forms/EmpleadoForm";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";

interface Empleado {
    id_usuario: string;
    nombre: string;
    email: string;
    rol: string | null;
}

interface EmpleadoEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    empleado: Partial<Empleado> | null; // Partial para nuevo empleado
    onSave: (data: EmpleadoFormData, id_usuario: string | null) => void;
    isSubmitting?: boolean;
}

export default function EmpleadoEditModal({
    isOpen,
    onClose,
    empleado,
    onSave,
    isSubmitting,
}: EmpleadoEditModalProps) {
    if (!isOpen) return null;

    const initialData: EmpleadoFormData = {
        nombre: empleado?.nombre || '',
        email: empleado?.email || '',
        rol: empleado?.rol === 'Admin' ? 'Admin' : 'Tecnico', // nunca undefined
    };

    const handleSubmit = (data: EmpleadoFormData) => {
        onSave(data, empleado?.id_usuario || null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl"
                    onClick={onClose}
                    title="Cerrar"
                >
                    &times;
                </button>
                <SectionTitle className="mb-4">
                    {empleado?.id_usuario ? "Editar Empleado" : "Nuevo Empleado"}
                </SectionTitle>

                <EmpleadoForm
                    onSubmit={handleSubmit}
                    initialData={initialData}
                    isSubmitting={isSubmitting}
                    isCreating={!empleado?.id_usuario}
                />

                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" color="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    );
}
