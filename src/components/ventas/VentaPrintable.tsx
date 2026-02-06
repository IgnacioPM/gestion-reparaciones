import { Profile } from '@/stores/auth'
import React from 'react'

// Duplicating types here to make the component self-contained.
// In a real app, these would be imported from a central types file.
interface VentaDetalleItem {
  producto: {
    nombre: string
    fabricante: {
      nombre: string
    }
  }
  cantidad: number
  precio_unitario: number
  subtotal: number
  descuento_monto: number
  descuento_porcentaje: number | null
}

interface VentaConDetalles {
  id_venta: number
  fecha: string
  total: number
  metodo_pago: string
  total_descuento: number
  cliente: {
    nombre: string
    telefono: string | null
    correo: string | null
  } | null
  items: VentaDetalleItem[]
}

interface VentaPrintableProps {
  venta: VentaConDetalles
  profile: Profile | null
}

const formatFechaSimple = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const ReceiptRow: React.FC<{ left: string; right: string }> = ({ left, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span>{left}</span>
    <span>{right}</span>
  </div>
)

export const VentaPrintable: React.FC<VentaPrintableProps> = ({ venta, profile }) => {
  return (
    <div className='receipt-box'>
      <div className='header'>
        <h1>{profile?.empresa?.nombre ?? 'Control de Ventas'}</h1>
      </div>

      <p>Dir: {profile?.empresa?.direccion ?? ''}</p>
      {profile?.empresa?.telefono && <p>Tel: {profile.empresa.telefono}</p>}

      <p>Fecha: {formatFechaSimple(venta.fecha)}</p>
      <p>Método de pago: {venta.metodo_pago}</p>

      <h2>----- Cliente -----</h2>
      <p>Nombre: {venta.cliente?.nombre ?? 'Consumidor Final'}</p>
      {venta.cliente?.telefono && <p>Tel: {venta.cliente.telefono}</p>}
      {venta.cliente?.correo && <p>Email: {venta.cliente.correo}</p>}

      <h2>----- Productos -----</h2>
      {/* Header for items */}
      <div
        style={{
          borderTop: '1px dashed black',
          borderBottom: '1px dashed black',
          padding: '2px 0',
          marginBottom: '2px',
        }}
      >
        <ReceiptRow left='Cant.  Producto' right='Total' />
      </div>

      {venta.items.map((item, index) => (
        <div key={index}>
          <p style={{ margin: 0 }}>
            {item.cantidad} x {item.producto.fabricante.nombre} {item.producto.nombre}
          </p>
          <ReceiptRow
            left={`    (₡ ${item.precio_unitario})`}
            right={`₡ ${item.subtotal.toFixed(2)}`}
          />
          {item.descuento_monto > 0 && (
            <ReceiptRow left={'     Descuento'} right={`- ₡ ${item.descuento_monto.toFixed(2)}`} />
          )}
        </div>
      ))}

      <div style={{ marginTop: '5px' }}></div>

      <div className='totals'>
        <p className='total'>
          <span>Subtotal:</span>
          <span>₡{(venta.total + venta.total_descuento).toFixed(2)}</span>
        </p>
        {venta.total_descuento > 0 && (
          <p className='total'>
            <span>Descuento:</span>
            <span>- ₡{venta.total_descuento.toFixed(2)}</span>
          </p>
        )}
        <p className='total' style={{ borderTop: '1px solid black', paddingTop: '5px' }}>
          <span>Total:</span>
          <span>₡{venta.total.toFixed(2)}</span>
        </p>
      </div>

      <div className='footer'>
        <p>'Gracias por su compra'</p>
      </div>
    </div>
  )
}
