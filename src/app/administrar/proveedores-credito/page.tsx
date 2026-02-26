'use client'

import Navbar from '@/components/ui/Navbar'
import { supabase } from '@/lib/supabaseClient'
import { Proveedor } from '@/schemas/proveedor'
import { useAuthStore } from '@/stores/auth'
import { ProveedorCredito } from '@/types/compra'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ProveedorConCredito extends Proveedor {
  credito: ProveedorCredito | null
}

export default function ProveedoresCreditoPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [proveedores, setProveedores] = useState<ProveedorConCredito[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchProveedoresConCredito = async () => {
      if (!profile?.empresa_id) return

      try {
        const { data: proveedoresData, error: provError } = await supabase
          .from('proveedores')
          .select(
            `
            *,
            credito:proveedores_credito (
              credito_inicial,
              saldo_actual,
              updated_at
            )
          `
          )
          .eq('empresa_id', profile.empresa_id)
          .eq('activo', true)

        if (provError) throw provError

        const mapped = (proveedoresData || []).map((p: any) => ({
          ...p,
          credito: p.credito?.[0] || null,
        }))

        setProveedores(mapped)
      } catch (err) {
        console.error('Error fetching proveedores:', err)
        toast.error('Error al cargar proveedores')
      } finally {
        setLoading(false)
      }
    }

    fetchProveedoresConCredito()
  }, [profile?.empresa_id])

  const filteredProveedores = proveedores.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold dark:text-white'>Crédito de Proveedores</h1>
          <Link href='/administrar'>
            <button className='flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'>
              <ArrowLeft className='h-5 w-5' /> Volver
            </button>
          </Link>
        </div>

        <div className='mb-6'>
          <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
              <thead className='bg-gray-50 dark:bg-gray-700'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Proveedor</th>
                  <th className='px-6 py-3 text-right text-xs font-medium uppercase'>
                    Saldo Inicial
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium uppercase'>
                    Saldo Actual
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className='px-6 py-4 text-sm text-gray-600 dark:text-gray-400'>
                      Cargando proveedores...
                    </td>
                  </tr>
                ) : filteredProveedores.length === 0 ? (
                  <tr>
                    <td colSpan={3} className='px-6 py-4 text-sm text-gray-600 dark:text-gray-400'>
                      No hay proveedores registrados
                    </td>
                  </tr>
                ) : (
                  filteredProveedores.map((proveedor, index) => {
                    const creditoInicial = proveedor.credito?.credito_inicial || 0
                    const saldoActual = proveedor.credito?.saldo_actual || 0

                    return (
                      <tr
                        key={proveedor.id_proveedor}
                        className={`border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                        }`}
                        role='button'
                        tabIndex={0}
                        onClick={() =>
                          router.push(`/administrar/proveedores-credito/${proveedor.id_proveedor}`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            router.push(
                              `/administrar/proveedores-credito/${proveedor.id_proveedor}`
                            )
                          }
                        }}
                      >
                        <td className='px-6 py-4 text-sm text-gray-600 dark:text-white'>
                          {proveedor.nombre}
                        </td>
                        <td className='px-6 py-4 text-right dark:text-gray-300'>
                          ₡{creditoInicial.toLocaleString('es-CR')}
                        </td>
                        <td className='px-6 py-4 text-right dark:text-gray-300'>
                          ₡{saldoActual.toLocaleString('es-CR')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
