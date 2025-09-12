"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/lib/supabaseClient"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import FormError from "@/components/ui/FormError"
import { useAuthStore } from "@/stores/auth"
import { translateAuthError } from "@/utils/auth-errors"
import { loginSchema, type LoginFormData } from "@/schemas/auth"

export default function LoginForm() {
    const router = useRouter()
    const setUser = useAuthStore((state) => state.setUser)
    const setLoading = useAuthStore((state) => state.setLoading)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError: setFormError,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true)

        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            })

            if (error) {
                setFormError('root', {
                    message: translateAuthError(error.message)
                })
                return
            }

            if (authData.user) {
                setUser(authData.user)
                router.push('/')
            }
        } catch (error) {
            setFormError('root', {
                message: 'Error al iniciar sesión'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormError message={errors.root?.message} />
            <div className="space-y-1">
                <Input
                    type="email"
                    label="Email"
                    {...register('email')}
                />
                {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
            </div>
            <div className="space-y-1">
                <Input
                    type="password"
                    label="Contraseña"
                    {...register('password')}
                />
                {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
            </div>
            <Button type="submit">Ingresar</Button>
        </form>
    )
}
