'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginData } from '@/schemas/auth' // Asumo que usas Zod
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
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    setError(null)
    try {
      await login(data.email, data.password)
      // Si el login es exitoso, el AuthProvider o un layout se encargará de redirigir
      router.push('/') // Redirige al dashboard
    } catch (e: any) {
      // Aquí puedes usar tu mapeo de errores de 'auth-errors.ts'
      setError(e.message || 'Ocurrió un error inesperado')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Campo de Email */}
      <div className="space-y-1">
        <label htmlFor="email">Email</label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>

      {/* Campo de Contraseña */}
      <div className="space-y-1">
        <label htmlFor="password">Contraseña</label>
        <Input id="password" type="password" {...register('password')} />
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