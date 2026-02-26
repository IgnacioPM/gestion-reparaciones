'use client'

import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { UbicacionesCatalogo } from '@/types/ubicaciones_catalogo'
import { ChevronLeft, ChevronRight, Edit, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import UbicacionesCatalogoEditModal from './UbicacionesCatalogoEditModal'

export default function UbicacionesCatalogoTable() {
  const { profile } = useAuthStore()
  const [items, setItems] = useState<UbicacionesCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState<Partial<UbicacionesCatalogo> | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchItems = async () => {
    setLoading(true)
    if (!profile?.empresa_id) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('ubicaciones_catalogo')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('nombre', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar catálogos de ubicaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [profile])

  useEffect(() => {
    setCurrentPage(1)
  }, [items])

  const handleNew = () => {
    setSelected(null)
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleEdit = (item: UbicacionesCatalogo) => {
    setSelected(item)
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este catálogo?')) return
    try {
      const { error } = await supabase.from('ubicaciones_catalogo').delete().eq('id_catalogo', id)
      if (error) throw error
      toast.success('Catálogo eliminado.')
      fetchItems()
    } catch (err) {
      console.error(err)
      toast.error('Error al eliminar catálogo.')
    }
  }

  const handleSave = async (formData: { nombre: string }) => {
    setIsSubmitting(true)
    setModalError(null)
    try {
      if (!profile?.empresa_id) throw new Error('No se pudo identificar la empresa.')

      if (selected?.id_catalogo) {
        const { error } = await supabase
          .from('ubicaciones_catalogo')
          .update(formData)
          .eq('id_catalogo', selected.id_catalogo)
        if (error) throw error
        toast.success('Catálogo actualizado.')
      } else {
        const { error } = await supabase
          .from('ubicaciones_catalogo')
          .insert({ ...formData, empresa_id: profile.empresa_id })
        if (error) throw error
        toast.success('Catálogo creado.')
      }
      fetchItems()
      setIsModalOpen(false)
    } catch (err: any) {
      setModalError(err.message)
      toast.error(err.message || 'Ocurrió un error.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='w-full'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold'>Catálogos de Ubicaciones</h3>
        <Button onClick={handleNew} className='flex items-center gap-2'>
          <Plus className='w-4 h-4' /> Agregar Catálogo
        </Button>
      </div>

      <div className='overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Nombre
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Activo
              </th>
              <th className='relative px-6 py-3'>
                <span className='sr-only'>Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
            {loading ? (
              <tr>
                <td colSpan={3} className='text-center p-4'>
                  Cargando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className='text-center p-4'>
                  No hay catálogos.
                </td>
              </tr>
            ) : (
              // paginated
              items
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  (currentPage - 1) * itemsPerPage + itemsPerPage
                )
                .map((item, index) => (
                  <tr
                    key={item.id_catalogo}
                    className={
                      index % 2 === 0
                        ? 'bg-white dark:bg-gray-800'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                      {item.nombre}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                      {item.activo ? 'Sí' : 'No'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
                      <button
                        onClick={() => handleEdit(item)}
                        className='text-blue-600 hover:text-blue-900'
                      >
                        <Edit />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id_catalogo)}
                        className='text-red-600 hover:text-red-900'
                      >
                        <Trash2 />
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {Math.ceil(items.length / itemsPerPage) > 1 && (
        <div className='flex justify-end items-center gap-2 mt-4'>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className='p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50'
          >
            <ChevronLeft />
          </button>
          <span>
            {currentPage} / {Math.ceil(items.length / itemsPerPage)}
          </span>
          <button
            disabled={currentPage === Math.ceil(items.length / itemsPerPage)}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(items.length / itemsPerPage)))
            }
            className='p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50'
          >
            <ChevronRight />
          </button>
        </div>
      )}

      <UbicacionesCatalogoEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        initialData={selected}
        error={modalError}
      />
    </div>
  )
}
