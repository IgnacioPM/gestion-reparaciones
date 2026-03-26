'use client'

import { supabase } from '@/lib/supabaseClient'
import '@/styles/print.css'
import { generateNextBarcode } from '@/utils/barcode'
import { use } from 'react'
import { useEffect, useState } from 'react'
import JsBarcode from 'jsbarcode'

type ProductoEtiqueta = {
  id_producto: string
  empresa_id: string
  nombre: string
  codigo_barras: string | null
  tipo: 'venta' | 'repuesto' | 'ambos' | null
  id_fabricante: string | null
  id_ubicacion_principal: string | null
}

function getMarcaEtiqueta(fabricanteNombre: string | null, productoNombre: string): string {
  const marca = (fabricanteNombre ?? '').trim()
  if (!marca) return '---'

  const isApple = marca.toLowerCase() === 'apple'
  const nombreLower = (productoNombre ?? '').toLowerCase()
  const esCelularApple = isApple && /(iphone|celular|m[oó]vil|mobile)/i.test(nombreLower)

  if (esCelularApple) return 'IPH'
  return marca.slice(0, 3).toUpperCase()
}

export default function ProductoEtiquetaImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [producto, setProducto] = useState<ProductoEtiqueta | null>(null)
  const [fabricanteNombre, setFabricanteNombre] = useState<string | null>(null)
  const [ubicacionTexto, setUbicacionTexto] = useState<string>('SIN UBICACIÓN')
  const [loading, setLoading] = useState(true)
  const [barcodeReady, setBarcodeReady] = useState(false)
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: productoData, error: productoError } = await supabase
        .from('productos')
        .select(
          'id_producto, empresa_id, nombre, codigo_barras, tipo, id_fabricante, id_ubicacion_principal'
        )
        .eq('id_producto', id)
        .single()

      if (productoError || !productoData) {
        console.error('Error cargando producto para impresión:', productoError)
        setLoading(false)
        return
      }

      const p = productoData as ProductoEtiqueta

      let codigoBarrasFinal = String(p.codigo_barras ?? '').trim()

      if (!codigoBarrasFinal && p.empresa_id) {
        for (let intento = 0; intento < 3; intento += 1) {
          const { data: rows, error: rowsError } = await supabase
            .from('productos')
            .select('codigo_barras')
            .eq('empresa_id', p.empresa_id)

          if (rowsError) {
            console.error('Error obteniendo códigos existentes:', rowsError)
            break
          }

          const candidate = generateNextBarcode(
            p.empresa_id,
            (rows ?? []).map((row: any) => row.codigo_barras)
          )

          const { error: updateError } = await supabase
            .from('productos')
            .update({ codigo_barras: candidate })
            .eq('id_producto', p.id_producto)

          if (!updateError) {
            codigoBarrasFinal = candidate
            break
          }

          const msg = String(updateError.message ?? '').toLowerCase()
          const details = String((updateError as any).details ?? '').toLowerCase()
          const hint = String((updateError as any).hint ?? '').toLowerCase()
          const isDuplicate =
            msg.includes('codigo_barras') ||
            details.includes('codigo_barras') ||
            hint.includes('codigo_barras')

          if (!isDuplicate) {
            console.error('Error guardando código de barras automático:', updateError)
            break
          }
        }
      }

      p.codigo_barras = codigoBarrasFinal || p.codigo_barras
      setProducto(p)

      if (p.id_fabricante) {
        const { data: fabData } = await supabase
          .from('fabricantes')
          .select('nombre')
          .eq('id_fabricante', p.id_fabricante)
          .single()

        setFabricanteNombre((fabData as { nombre?: string } | null)?.nombre ?? null)
      }

      if (p.id_ubicacion_principal) {
        const { data: ubData } = await supabase
          .from('ubicaciones')
          .select('codigo, id_catalogo')
          .eq('id_ubicacion', p.id_ubicacion_principal)
          .single()

        const codigo = (ubData as { codigo?: string } | null)?.codigo ?? ''
        const idCatalogo = (ubData as { id_catalogo?: string } | null)?.id_catalogo

        let catalogoNombre = ''
        if (idCatalogo) {
          const { data: catData } = await supabase
            .from('ubicaciones_catalogo')
            .select('nombre')
            .eq('id_catalogo', idCatalogo)
            .single()

          catalogoNombre = (catData as { nombre?: string } | null)?.nombre ?? ''
        }

        const loc = [catalogoNombre, codigo].filter(Boolean).join(' / ')
        setUbicacionTexto(loc || 'SIN UBICACIÓN')
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  useEffect(() => {
    const rawCode = (producto?.codigo_barras ?? '').trim()

    if (!rawCode) {
      setBarcodeDataUrl(null)
      setBarcodeReady(true)
      return
    }

    try {
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, rawCode, {
        format: 'CODE128',
        displayValue: false,
        margin: 8,
        height: 30,
        width: 1.8,
        lineColor: '#000000',
        background: '#ffffff',
      })

      const dataUrl = canvas.toDataURL('image/png')
      setBarcodeDataUrl(dataUrl)
      setBarcodeReady(true)
    } catch (error) {
      console.error('Error renderizando código de barras:', error)
      setBarcodeDataUrl(null)
      setBarcodeReady(false)
    }
  }, [producto?.codigo_barras])

  useEffect(() => {
    if (!loading && producto && barcodeReady) {
      setTimeout(() => window.print(), 500)
    }
  }, [loading, producto, barcodeReady])

  if (loading) return <p>Cargando etiqueta...</p>
  if (!producto) return <p>No se encontró el producto.</p>

  const marcaCorta = getMarcaEtiqueta(fabricanteNombre, producto.nombre)

  return (
    <div className='printable-area'>
      <div className='receipt-box product-label-print'>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px', marginBottom: '6px' }}>
          {barcodeDataUrl ? (
            <img
              src={barcodeDataUrl}
              alt='Código de barras'
              style={{
                display: 'block',
                width: 'auto',
                height: '30px',
                maxWidth: '100%',
                imageRendering: 'pixelated',
              }}
            />
          ) : (
            <span style={{ fontSize: '10px' }}>SIN CÓDIGO DE BARRAS</span>
          )}
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            marginTop: '2px',
            marginBottom: '2px',
            letterSpacing: '0.2px',
          }}
        >
          <span style={{ fontSize: '15px', letterSpacing: '0.4px' }}>{marcaCorta}</span>
          <span> - </span>
          <span>{producto.nombre}</span>
        </p>

        <p
          style={{
            textAlign: 'center',
            fontSize: '15px',
            marginTop: '3px',
            marginBottom: '3px',
            letterSpacing: '0.2px',
          }}
        >
          <span>{ubicacionTexto}</span>
        </p>
      </div>
    </div>
  )
}
