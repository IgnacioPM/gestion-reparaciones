export function translateSupabaseError(error: unknown): string {
    // 1. Asegurarse de que el error sea un objeto no nulo
    if (typeof error !== 'object' || error === null) {
        return "Ocurrió un error inesperado.";
    }

    // 2. Crear un objeto simple para registrar y procesar
    const errorDetails: { message?: string; code?: string; details?: string } = {};
    if ('message' in error && typeof (error as any).message === 'string') {
        errorDetails.message = (error as any).message;
    }
    if ('code' in error && typeof (error as any).code === 'string') {
        errorDetails.code = (error as any).code;
    }
    if ('details' in error && typeof (error as any).details === 'string') {
        errorDetails.details = (error as any).details;
    }

    // 3. Registrar los detalles extraídos. Esto no se mostrará como `{}`.
    console.error("Supabase error details:", errorDetails);

    // 4. Usar los detalles extraídos para la lógica
    if (errorDetails.code === "23505") {
        if (errorDetails.details?.includes("clientes_telefono_key")) {
            return "El número de teléfono ya está registrado para otro cliente.";
        }
        if (errorDetails.details?.includes("clientes_correo_key")) {
            return "La dirección de correo electrónico ya está registrada para otro cliente.";
        }
        return "Ya existe un registro con uno de los valores únicos (por ejemplo, email o teléfono).";
    }

    if (errorDetails.message?.includes("foreign key constraint")) {
        return "No se puede realizar la operación debido a que hay registros relacionados.";
    }

    // 5. Devolver el mensaje
    return errorDetails.message || "Error en la base de datos. Por favor, intente de nuevo.";
}
