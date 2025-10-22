'use client'

import { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabaseClient'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import { toast } from 'sonner'
import Navbar from '@/components/ui/Navbar'
import SectionTitle from '@/components/ui/SectionTitle'
import { EmpresaFormData } from '@/schemas/empresa'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

// Definimos el tipo para los datos de la empresa, extendiendo el schema
interface Empresa extends EmpresaFormData {
    id: string;
    logo_url?: string | null;
}

export default function EditarEmpresaPage() {
    const router = useRouter()
    const { profile } = useAuthStore()
    const [empresa, setEmpresa] = useState<Empresa | null>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const fetchEmpresa = async () => {
            if (!profile?.empresa_id) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', profile.empresa_id)
                .single()

            if (error) {
                console.error('Error fetching empresa:', error)
                toast.error('Error al cargar datos de la empresa')
            } else if (data) {
                setEmpresa(data)
            }
            setLoading(false)
        }

        fetchEmpresa()
    }, [profile])

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (empresa) {
            setEmpresa({ ...empresa, [name]: value })
        }
    }

    const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Debes seleccionar una imagen para subir.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile?.empresa_id}-${Date.now()}.${fileExt}`
            const filePath = `logos/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: publicUrlData } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath)

            const logoUrl = publicUrlData.publicUrl

            const { error: updateError } = await supabase
                .from('empresas')
                .update({ logo_url: logoUrl })
                .eq('id', profile?.empresa_id)

            if (updateError) throw updateError

            if (empresa) {
                setEmpresa({ ...empresa, logo_url: logoUrl })
            }
            toast.success('Logo actualizado correctamente')
        } catch (error: any) {
            console.error('Error uploading logo:', error)
            toast.error(error.message || 'Error al subir el logo')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!empresa) return

        try {
            setLoading(true)
            const { error } = await supabase
                .from('empresas')
                .update({
                    nombre: empresa.nombre,
                    telefono: empresa.telefono,
                    direccion: empresa.direccion,
                    correo: empresa.correo,
                    sitio_web: empresa.sitio_web,
                })
                .eq('id', profile?.empresa_id)

            if (error) throw error
            toast.success('Datos actualizados correctamente')
        } catch (error) {
            console.error('Error updating empresa:', error)
            toast.error('Error al guardar los cambios')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Navbar />
            <main className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <SectionTitle>Datos de la Empresa</SectionTitle>
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Regresar al inicio
                    </button>
                </div>

                {loading && <p className="text-center mt-10">Cargando...</p>}

                {!loading && !empresa && (
                    <p className="text-center mt-10">No se encontraron datos de la empresa.</p>
                )}

                {empresa && (
                    <div className="max-w-2xl mx-auto mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                id="nombre"
                                name="nombre"
                                label="Nombre"
                                value={empresa.nombre || ''}
                                onChange={handleInputChange}
                            />

                            <Input
                                id="telefono"
                                name="telefono"
                                label="Teléfono"
                                value={empresa.telefono || ''}
                                onChange={handleInputChange}
                            />

                            <Textarea
                                id="direccion"
                                name="direccion"
                                label="Dirección"
                                rows={2}
                                value={empresa.direccion || ''}
                                onChange={handleInputChange}
                            />

                            <Input
                                id="correo"
                                name="correo"
                                label="Correo"
                                type="email"
                                value={empresa.correo || ''}
                                onChange={handleInputChange}
                            />

                            <Input
                                id="sitio_web"
                                name="sitio_web"
                                label="Sitio Web"
                                value={empresa.sitio_web || ''}
                                onChange={handleInputChange}
                            />

                            {empresa.logo_url && (
                                <div className="flex flex-col items-center mt-4">
                                    <img
                                        src={empresa.logo_url}
                                        alt="Logo"
                                        className="w-32 h-32 object-contain border rounded-md mb-2"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="logo" className="block text-sm font-medium mb-1">Logo</label>
                                <input
                                    id="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    disabled={uploading}
                                />
                            </div>

                            <Button type="submit" disabled={loading || uploading} className="w-full mt-4">
                                {uploading ? 'Subiendo...' : loading ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </form>
                    </div>
                )}
            </main>
        </>
    )
}
