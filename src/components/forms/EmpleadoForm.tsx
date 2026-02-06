import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { EmpleadoFormData, EmpleadoSchema } from '@/schemas/empleado'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface EmpleadoFormProps {
  onSubmit: (data: EmpleadoFormData) => void
  initialData?: Partial<EmpleadoFormData>
  isSubmitting?: boolean
  isCreating?: boolean
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
    resolver: zodResolver(EmpleadoSchema),
    defaultValues: initialData,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <Input label='Nombre' {...register('nombre')} error={errors.nombre?.message} />
      <Input
        label='Email'
        {...register('email')}
        error={errors.email?.message}
        disabled={!isCreating}
      />
      {isCreating && (
        <Input
          label='Password'
          type='password'
          {...register('password')}
          error={errors.password?.message}
        />
      )}
      <Select label='Rol' {...register('rol')} error={errors.rol?.message}>
        <option value='Tecnico'>Técnico</option>
        <option value='Admin'>Administrador</option>
      </Select>
      <Input
        label='Descuento Máximo (%)'
        type='number'
        inputMode='decimal'
        min={0}
        max={100}
        step={0.01}
        {...register('descuento_maximo', { valueAsNumber: true })}
        error={errors.descuento_maximo?.message}
      />
      <div className='flex justify-end'>
        <Button type='submit' disabled={isSubmitting}>
          {isCreating ? 'Crear' : 'Actualizar'}
        </Button>
      </div>
    </form>
  )
}
