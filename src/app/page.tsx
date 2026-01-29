'use client'

import ServiciosTable from '@/components/reparaciones/ServiciosTable'
import VentasTable from '@/components/ventas/VentasTable'
import Navbar from '@/components/ui/Navbar'
import { useState } from 'react'

type Tab = 'servicios' | 'ventas' | 'general'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('servicios')

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors'>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Tabs */}
          <div className='flex gap-6 mb-6 border-b border-gray-300 dark:border-gray-700'>
            <TabButton
              label='Servicios'
              active={activeTab === 'servicios'}
              onClick={() => setActiveTab('servicios')}
            />
            <TabButton
              label='Ventas'
              active={activeTab === 'ventas'}
              onClick={() => setActiveTab('ventas')}
            />
            {/* <TabButton
              label='General'
              active={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
            /> */}
          </div>

          {/* Content */}
          {activeTab === 'servicios' && <ServiciosTable />}
          {activeTab === 'ventas' && <VentasTable />}

          {activeTab === 'general' && (
            <div className='p-10 text-center text-gray-500'>
              <p className='text-lg font-medium'>Dashboard general</p>
              <p className='text-sm mt-2'>Aquí irá métricas, totales, gráficos, etc.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
                px-4 py-2 font-medium transition
                border-b-2
                -mb-px
                ${
                  active
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }
            `}
    >
      {label}
    </button>
  )
}
