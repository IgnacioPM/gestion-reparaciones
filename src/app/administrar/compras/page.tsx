'use client'

import ComprasTable from '@/components/compras/ComprasTable'
import Navbar from '@/components/ui/Navbar'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
interface CompraListItem {
  id_compra: string
  created_at: string
  total: number
  total_descuento: number
  metodo_pago: string | null
  proveedor: {
    nombre: string
  } | null
}

export default function ComprasPage() {
  const { profile } = useAuthStore()
  const router = useRouter()
  const [compras, setCompras] = useState<CompraListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompras = async () => {
      if (!profile?.empresa_id) return

      try {
        const { data, error } = await supabase
          .from('compras')
          .select(
            `
            id_compra,
            created_at,
            total,
            total_descuento,
            metodo_pago,
            proveedor:proveedores!inner (
              nombre
            )
          `
          )
          .eq('empresa_id', profile.empresa_id)
          .order('created_at', { ascending: false })

        if (error) throw error

        const mappedCompras = (data || []).map((item: any) => ({
          ...item,
          proveedor: Array.isArray(item.proveedor)
            ? item.proveedor?.[0] || null
            : item.proveedor || null,
        }))

        setCompras(mappedCompras)
      } catch (err) {
        console.error('Error fetching compras:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompras()
  }, [profile?.empresa_id])

  const filteredCompras = compras

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold dark:text-white'>Compras</h1>
          <div className='flex gap-4'>
            <Link href='/administrar'>
              <button className='flex items-center gap-2 text-gray-600 dark:text-gray-400'>
                <ArrowLeft className='h-5 w-5' /> Volver
              </button>
            </Link>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
          <ComprasTable loading={loading} compras={filteredCompras} />
        </div>
      </main>
    </div>
  )
}
