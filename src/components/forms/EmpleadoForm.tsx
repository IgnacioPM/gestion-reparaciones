'use client'

import { z } from 'zod';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmpleadoSchema, EmpleadoFormData } from "@/schemas/empleado";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface EmpleadoFormProps {
  initialData?: z.input<typeof EmpleadoSchema>;
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
  } = useForm<z.input<typeof EmpleadoSchema>>({
    resolver: zodResolver(EmpleadoSchema),
    defaultValues: initialData,
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
      {isCreating && (
        <Input
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />
      )}
      <Select
        label="Rol"
        {...register("rol")}
        error={errors.rol?.message}
      >
        <option value="Tecnico">Técnico</option>
        <option value="Admin">Administrador</option>
      </Select>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isCreating ? "Crear" : "Actualizar"}
        </Button>
      </div>
    </form>
  );
}
