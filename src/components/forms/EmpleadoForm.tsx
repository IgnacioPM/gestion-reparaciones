'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmpleadoSchema, EmpleadoFormData } from "@/schemas/empleado";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface EmpleadoFormProps {
  initialData: EmpleadoFormData;
  onSubmit: (data: EmpleadoFormData) => void;
  isSubmitting?: boolean;
  isCreating?: boolean;
}

export default function EmpleadoForm({
  initialData,
  onSubmit,
  isSubmitting,
  isCreating,
}: EmpleadoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpleadoFormData>({
    resolver: zodResolver(EmpleadoSchema),
    defaultValues: {
      ...initialData,
      rol: initialData.rol || "Tecnico", // aseguramos que nunca sea undefined
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
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Password"
        type="password"
        {...register("password")}
        error={errors.password?.message}
      />
      <select {...register("rol")} className="w-full p-2 border rounded">
        <option value="Tecnico">Tecnico</option>
        <option value="Admin">Admin</option>
      </select>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isCreating ? "Crear" : "Actualizar"}
        </Button>
      </div>
    </form>
  );
}
