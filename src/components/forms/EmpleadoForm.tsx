'use client'

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmpleadoSchema } from '@/schemas/empleado';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

interface EmpleadoFormProps {
  onSubmit: (data: z.input<typeof EmpleadoSchema>) => void;
  initialData?: z.input<typeof EmpleadoSchema>;
  isSubmitting?: boolean;
  isCreating?: boolean;
}

export default function EmpleadoForm({
  onSubmit,
  initialData,
  isSubmitting,
  isCreating,
}: EmpleadoFormProps) {

  const defaultValues: z.input<typeof EmpleadoSchema> = {
    nombre: '',
    email: '',
    rol: 'Tecnico', // asegura que siempre haya un valor
    password: undefined,
    ...initialData,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof EmpleadoSchema>>({
    resolver: zodResolver(EmpleadoSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre"
        {...register('nombre')}
        error={errors.nombre?.message}
      />
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      {isCreating && (
        <Input
          label="Contraseña"
          type="password"
          {...register('password')}
          error={errors.password?.message}
        />
      )}
      <Select
        label="Rol"
        {...register('rol')}
        error={errors.rol?.message}
      >
        <option value="Tecnico">Técnico</option>
        <option value="Admin">Administrador</option>
      </Select>

      {errors.root && <FormError message={errors.root.message} />}

      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
