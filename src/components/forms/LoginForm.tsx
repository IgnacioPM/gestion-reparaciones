'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/schemas/auth'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginForm() {
  const router = useRouter()
  const { login, loading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      await login(data.email, data.password)
      router.push('/') // Redirige al dashboard
    } catch (e: unknown) {  // 👈 Aquí está el cambio
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('Ocurrió un error inesperado')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Campo de Email */}
      <div className="space-y-1">
        <Input
          id="email"
          type="email"
          label="Email"
          error={errors.email?.message}
          {...register('email')}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>

      {/* Campo de Contraseña */}
      <div className="space-y-1">
        <Input
          id="password"
          type="password"
          label="Contraseña"
          error={errors.password?.message}
          {...register('password')}
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
      </div>

      {/* Mensaje de Error General */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Botón de Submit */}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  )
}
