'use client'

import ProveedorAddModal from '@/components/proveedores/ProveedorAddModal'
import ProveedorEditModal from '@/components/proveedores/ProveedorEditModal'
import { supabase } from '@/lib/supabaseClient'
import { ProveedorFormData } from '@/schemas/proveedor'
import { useAuthStore } from '@/stores/auth'
import type { Proveedor } from '@/types/proveedor'
import { ChevronLeft, ChevronRight, Edit, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export default function ProveedoresTable() {
  const { profile } = useAuthStore()

  const [allProveedores, setAllProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showAddModal, setShowAddModal] = useState(false)
  const [editProveedor, setEditProveedor] = useState<Proveedor | null>(null)
  const [editProveedorCredito, setEditProveedorCredito] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =====================
  // HANDLERS
  // =====================

  const handleNewProveedor = () => setShowAddModal(true)
  const handleEditProveedor = (proveedor: Proveedor) => setEditProveedor(proveedor)

  const handleEditProveedorWithCredito = async (proveedor: Proveedor) => {
    if (!profile?.empresa_id) {
      setEditProveedor(proveedor)
      return
    }
    try {
      const { data, error } = await supabase
        .from('proveedores_credito')
        .select('credito_inicial')
        .eq('empresa_id', profile.empresa_id)
        .eq('proveedor_id', proveedor.id_proveedor)
        .maybeSingle()

      if (!error && data) setEditProveedorCredito(data.credito_inicial ?? null)
      else setEditProveedorCredito(null)
    } catch (err) {
      setEditProveedorCredito(null)
    }

    setEditProveedor(proveedor)
  }

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

  const handleSaveProveedor = async (
    data: ProveedorFormData & { credito_inicial?: number | null }
  ) => {
    if (!profile?.empresa_id) return

    setIsSubmitting(true)
    setError(null)

    try {
      // separate credito_inicial from the proveedor payload so we don't send it
      // to the `proveedores` table (it belongs to `proveedores_credito`)
      const { credito_inicial, ...provPayload } = data as any

      const { data: newProv, error: provError } = await supabase
        .from('proveedores')
        .insert({
          ...provPayload,
          empresa_id: profile.empresa_id,
        })
        .select('id_proveedor')
        .single()

      if (provError) throw provError

      const proveedorId = newProv?.id_proveedor

      // if credito_inicial provided, insert proveedores_credito
      if (data.credito_inicial != null && proveedorId) {
        const creditoVal = Number(data.credito_inicial) || 0
        const { data: creditoResult, error: creditoErr } = await supabase
          .from('proveedores_credito')
          .insert({
            empresa_id: profile.empresa_id,
            proveedor_id: proveedorId,
            credito_inicial: creditoVal,
            saldo_actual: creditoVal,
          })
          .select()
          .maybeSingle()

        if (creditoErr) throw creditoErr
      }

      setShowAddModal(false)
      fetchInitialData(profile.empresa_id)
    } catch (err: any) {
      const message = err?.message ?? (typeof err === 'string' ? err : JSON.stringify(err))
      setError(message || 'Error al guardar proveedor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProveedor = async (
    data: ProveedorFormData & { credito_inicial?: number | null }
  ) => {
    if (!editProveedor || !profile?.empresa_id) return

    setIsSubmitting(true)
    setError(null)

    try {
      // separate credito_inicial from update payload so it isn't sent to `proveedores`
      const { credito_inicial, ...provUpdate } = data as any

      const { error } = await supabase
        .from('proveedores')
        .update(provUpdate)
        .eq('id_proveedor', editProveedor.id_proveedor)

      if (error) throw error

      // update or create proveedores_credito
      if (credito_inicial != null) {
        const creditoVal = Number(credito_inicial) || 0
        const { data: existing, error: existErr } = await supabase
          .from('proveedores_credito')
          .select('*')
          .eq('empresa_id', profile.empresa_id)
          .eq('proveedor_id', editProveedor.id_proveedor)
          .maybeSingle()

        if (existErr) throw existErr

        if (existing) {
          const { error: updErr } = await supabase
            .from('proveedores_credito')
            .update({ credito_inicial: creditoVal })
            .eq('empresa_id', profile.empresa_id)
            .eq('proveedor_id', editProveedor.id_proveedor)

          if (updErr) throw updErr
        } else {
          const { error: insErr } = await supabase.from('proveedores_credito').insert({
            empresa_id: profile.empresa_id,
            proveedor_id: editProveedor.id_proveedor,
            credito_inicial: creditoVal,
            saldo_actual: creditoVal,
          })
          if (insErr) throw insErr
        }
      }

      setEditProveedor(null)
      setEditProveedorCredito(null)
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
              paginatedProveedores.map((p, index) => (
                <tr
                  key={p.id_proveedor}
                  className={
                    index % 2 === 0
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }
                >
                  <td className='px-6 py-4'>{p.nombre}</td>
                  <td className='px-6 py-4'>{p.telefono || '—'}</td>
                  <td className='px-6 py-4'>{p.email || '—'}</td>
                  <td className='px-6 py-4'>{p.direccion || '—'}</td>
                  <td className='px-6 py-4 text-right'>
                    <button onClick={() => handleEditProveedorWithCredito(p)}>
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
          initialCredito={editProveedorCredito}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </div>
  )
}
