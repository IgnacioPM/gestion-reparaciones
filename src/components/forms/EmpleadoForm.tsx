'use client'

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

export const EmpleadoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  rol: z.enum(['Tecnico', 'Admin']).default('Tecnico'),
  password: z.string().optional(),
});

export type EmpleadoFormData = z.infer<typeof EmpleadoSchema>;

interface EmpleadoFormProps {
  onSubmit: (data: EmpleadoFormData) => void;
  initialData?: Partial<EmpleadoFormData>;
  isSubmitting?: boolean;
  isCreating?: boolean;
}

export default function EmpleadoForm({ onSubmit, initialData, isSubmitting, isCreating }: EmpleadoFormProps) {
  const defaultValues: EmpleadoFormData = {
    rol: 'Tecnico',
    nombre: '',
    email: '',
    password: undefined,
    ...initialData,
  };

  const { register, handleSubmit, formState: { errors } } = useForm<EmpleadoFormData>({
    resolver: zodResolver(EmpleadoSchema) as any, // ✅ casteamos para evitar conflicto de tipos
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nombre" {...register('nombre')} error={errors.nombre?.message} />
      <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
      {isCreating && (
        <Input label="Contraseña" type="password" {...register('password')} error={errors.password?.message} />
      )}
      <Select label="Rol" {...register('rol')} error={errors.rol?.message}>
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
