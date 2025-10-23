'use client'

import { EmpleadoFormData, EmpleadoSchema } from "@/schemas/empleado";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface EmpleadoFormProps {
  onSubmit: (data: EmpleadoFormData) => void;
  initialData: EmpleadoFormData;
  isSubmitting?: boolean;
  isCreating?: boolean;
}

export default function EmpleadoForm({
  onSubmit,
  initialData,
  isSubmitting,
  isCreating,
}: EmpleadoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpleadoFormData>({
    // 🔹 Evita el error de ESLint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(EmpleadoSchema),
    defaultValues: {
      rol: "Tecnico", // aseguramos que nunca sea undefined
      ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre"
        {...register("nombre")}
        error={errors.nombre?.message}
      />
      <Input
        label="Email"
        type="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Contraseña"
        type="password"
        {...register("password")}
        error={errors.password?.message}
        placeholder={isCreating ? "Ingrese una contraseña" : "Dejar en blanco para no cambiar"}
      />
      <Select
        label="Rol"
        {...register("rol")}
        options={[
          { label: "Técnico", value: "Tecnico" },
          { label: "Admin", value: "Admin" },
        ]}
        error={errors.rol?.message}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isCreating ? "Crear" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
