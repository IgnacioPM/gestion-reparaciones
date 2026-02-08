'use client'

import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export interface Cliente {
  id_cliente: string
  nombre: string
  telefono: string | null
  correo: string | null
}

interface ClienteFormProps {
  clienteInicial?: Cliente | null
  onClienteChange: (cliente: Cliente | null) => void
}

export default function ClienteForm({ clienteInicial = null, onClienteChange }: ClienteFormProps) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [sugerencias, setSugerencias] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [busquedaActiva, setBusquedaActiva] = useState(false)

  /**
   * 🔹 Sincronizar cliente inicial (Consumidor final)
   */
  useEffect(() => {
    if (!clienteInicial) return

    setClienteSeleccionado(clienteInicial)
    setNombre(clienteInicial.nombre)
    setTelefono(clienteInicial.telefono || '')
    setCorreo(clienteInicial.correo || '')
    setBusquedaActiva(false)
    setSugerencias([])
    onClienteChange(clienteInicial)
  }, [clienteInicial, onClienteChange])

  /**
   * 🔹 Manejar cambios en inputs
   */
  const handleInputChange = (field: 'nombre' | 'telefono' | 'correo', value: string) => {
    // Actualizar estado local
    if (field === 'nombre') setNombre(value)
    if (field === 'telefono') setTelefono(value)
    if (field === 'correo') setCorreo(value)

    // 🔥 Si se edita el nombre → romper selección y activar búsqueda
    if (field === 'nombre') {
      if (clienteSeleccionado) {
        setClienteSeleccionado(null)
      }
      setBusquedaActiva(true)
    }

    const nombreFinal = field === 'nombre' ? value.trim() : nombre.trim()
    const telefonoFinal = field === 'telefono' ? value.trim() : telefono.trim()
    const correoFinal = field === 'correo' ? value.trim() : correo.trim()

    if (!nombreFinal) {
      onClienteChange(null)
      return
    }

    onClienteChange({
      id_cliente: 'nuevo',
      nombre: nombreFinal,
      telefono: telefonoFinal || null,
      correo: correoFinal || null,
    })
  }

  /**
   * 🔹 Buscar clientes existentes
   */
  useEffect(() => {
    const fetchClientes = async () => {
      if (!busquedaActiva || nombre.length < 2 || clienteSeleccionado) {
        setSugerencias([])
        return
      }

      const { data } = await supabase
        .from('clientes')
        .select('*')
        .ilike('nombre', `%${nombre}%`)
        .limit(5)

      setSugerencias(data || [])
    }

    fetchClientes()
  }, [nombre, busquedaActiva, clienteSeleccionado])

  /**
   * 🔹 Seleccionar cliente existente
   */
  const handleSelectCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente)
    setNombre(cliente.nombre)
    setTelefono(cliente.telefono || '')
    setCorreo(cliente.correo || '')
    setBusquedaActiva(false)
    setSugerencias([])
    onClienteChange(cliente)
  }

  return (
    <div className='space-y-4'>
      {/* Nombre */}
      <div className='relative'>
        <Input
          label='Nombre del cliente'
          type='text'
          value={nombre}
          onChange={(e) => handleInputChange('nombre', e.target.value)}
        />

        {sugerencias.length > 0 && (
          <ul className='absolute z-10 w-full border rounded mt-1 bg-white dark:bg-gray-800 shadow'>
            {sugerencias.map((c) => (
              <li
                key={c.id_cliente}
                onClick={() => handleSelectCliente(c)}
                className='px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
              >
                {c.nombre} {c.telefono ? `– ${c.telefono}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Teléfono + Correo */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Input
          label='Teléfono'
          type='text'
          value={telefono}
          onChange={(e) => handleInputChange('telefono', e.target.value)}
        />

        <Input
          label='Correo (opcional)'
          type='email'
          value={correo}
          onChange={(e) => handleInputChange('correo', e.target.value)}
        />
      </div>
    </div>
  )
}
