'use client'

import ProveedorAddModal from '@/components/proveedores/ProveedorAddModal'
import ProveedorEditModal from '@/components/proveedores/ProveedorEditModal'
import { supabase } from '@/lib/supabaseClient'
import { ProveedorFormData } from '@/schemas/proveedor'
import { useAuthStore } from '@/stores/auth'
import { ChevronLeft, ChevronRight, Edit, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Proveedor } from '@/types/proveedor'

export default function ProveedoresTable() {
  const { profile } = useAuthStore()

  const [allProveedores, setAllProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showAddModal, setShowAddModal] = useState(false)
  const [editProveedor, setEditProveedor] = useState<Proveedor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =====================
  // HANDLERS
  // =====================

  const handleNewProveedor = () => setShowAddModal(true)
  const handleEditProveedor = (proveedor: Proveedor) => setEditProveedor(proveedor)

  // =====================
  // FETCH
  // =====================

  const fetchInitialData = async (empresaId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nombre', { ascending: true })

      if (error) throw error
      setAllProveedores(data || [])
    } catch (err) {
      console.error('Error cargando proveedores:', err)
      setAllProveedores([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.empresa_id) {
      fetchInitialData(profile.empresa_id)
    }
  }, [profile?.empresa_id])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // =====================
  // FILTRO
  // =====================

  const filteredProveedores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return allProveedores

    return allProveedores.filter((p) => {
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.telefono?.toLowerCase().includes(q)
      )
    })
  }, [allProveedores, searchQuery])

  // =====================
  // PAGINACIÓN
  // =====================

  const paginatedProveedores = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage
    return filteredProveedores.slice(from, from + itemsPerPage)
  }, [filteredProveedores, currentPage, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredProveedores.length / itemsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // =====================
  // GUARDAR / ACTUALIZAR
  // =====================

  const handleSaveProveedor = async (data: ProveedorFormData) => {
    if (!profile?.empresa_id) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.from('proveedores').insert({
        ...data,
        empresa_id: profile.empresa_id,
      })

      if (error) throw error
      setShowAddModal(false)
      fetchInitialData(profile.empresa_id)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar proveedor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProveedor = async (data: ProveedorFormData) => {
    if (!editProveedor || !profile?.empresa_id) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('proveedores')
        .update(data)
        .eq('id_proveedor', editProveedor.id_proveedor)

      if (error) throw error
      setEditProveedor(null)
      fetchInitialData(profile.empresa_id)
    } catch (err: any) {
      setError(err.message ?? 'Error al actualizar proveedor')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =====================
  // JSX
  // =====================

  return (
    <div className='w-full space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>Proveedores</h1>
        <button
          onClick={handleNewProveedor}
          className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md'
        >
          <Plus className='w-5 h-5' />
          Nuevo Proveedor
        </button>
      </div>

      <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Proveedor</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Teléfono</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Email</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase'>Dirección</th>
              <th className='px-6 py-3 text-right text-xs font-medium uppercase'>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className='px-6 py-6 text-center'>
                  Cargando...
                </td>
              </tr>
            ) : (
              paginatedProveedores.map((p) => (
                <tr key={p.id_proveedor}>
                  <td className='px-6 py-4'>{p.nombre}</td>
                  <td className='px-6 py-4'>{p.telefono || '—'}</td>
                  <td className='px-6 py-4'>{p.email || '—'}</td>
                  <td className='px-6 py-4'>{p.direccion || '—'}</td>
                  <td className='px-6 py-4 text-right'>
                    <button onClick={() => handleEditProveedor(p)}>
                      <Edit className='w-4 h-4' />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='flex items-center justify-end gap-3'>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className='rounded-md p-2 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-700'
        >
          <ChevronLeft />
        </button>

        <span className='text-sm'>
          {currentPage} / {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className='rounded-md p-2 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-700'
        >
          <ChevronRight />
        </button>
      </div>

      <ProveedorAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveProveedor}
        isSubmitting={isSubmitting}
        error={error}
      />

      {editProveedor && (
        <ProveedorEditModal
          isOpen
          initialData={editProveedor}
          onClose={() => setEditProveedor(null)}
          onSave={handleUpdateProveedor}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </div>
  )
}
