'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import Navbar from '@/components/ui/Navbar'
import SectionTitle from '@/components/ui/SectionTitle'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TiposDispositivosTable from '@/components/reparaciones/TiposDispositivosTable'
import MarcasTable from '@/components/reparaciones/MarcasTable'
import { TipoDispositivo } from '@/types/tipo_dispositivo'
import { toast } from 'sonner'

export default function DispositivosAdminPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'tipos' | 'marcas'>('tipos')
  const [tiposDispositivo, setTiposDispositivo] = useState<TipoDispositivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTipos = async () => {
        if (!profile?.empresa_id) {
            setLoading(false)
            return
        }
        try {
            const { data, error } = await supabase
                .from('tipos_dispositivo')
                .select('*')
                .eq('empresa_id', profile.empresa_id)
                .order('nombre', { ascending: true })

            if (error) throw error
            setTiposDispositivo(data)
        } catch (error) {
            toast.error("Error al cargar los tipos de dispositivo.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }
    fetchTipos()
  }, [profile])


  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <SectionTitle>Administrar Dispositivos y Marcas</SectionTitle>
          <button
            onClick={() => router.push('/administrar')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Regresar
          </button>
        </div>

        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('tipos')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'tipos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                }`}
            >
              Tipos de Dispositivo
            </button>
            <button
              onClick={() => setActiveTab('marcas')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'marcas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                }`}
            >
              Marcas
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'tipos' && (
            <TiposDispositivosTable />
          )}

          {activeTab === 'marcas' && (
            loading ? <p>Cargando...</p> : <MarcasTable tiposDispositivo={tiposDispositivo} />
          )}
        </div>
      </main>
    </>
  )
}
