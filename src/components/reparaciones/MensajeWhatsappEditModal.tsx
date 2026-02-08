'use client'

import Button from '@/components/ui/Button'
import { InfoRow } from '@/components/ui/InfoRow'
import Input from '@/components/ui/Input'
import SectionTitle from '@/components/ui/SectionTitle'
import { MensajeWhatsapp } from '@/types/mensaje_whatsapp'
import { useEffect, useRef, useState } from 'react'

interface MensajeWhatsappEditModalProps {
  isOpen: boolean
  onClose: () => void
  mensaje: MensajeWhatsapp
  onSave: (data: Partial<MensajeWhatsapp>) => void
  isSubmitting: boolean
}

export default function MensajeWhatsappEditModal({
  isOpen,
  onClose,
  mensaje,
  onSave,
  isSubmitting,
}: MensajeWhatsappEditModalProps) {
  const [asunto, setAsunto] = useState(mensaje.asunto ?? '')
  const [plantilla, setPlantilla] = useState(mensaje.plantilla ?? '')
  const editableRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setAsunto(mensaje.asunto ?? '')
    setPlantilla(mensaje.plantilla ?? '')
    // render editable content from raw plantilla
    requestAnimationFrame(() => {
      const root = editableRef.current
      if (root) {
        root.innerHTML = rawToHtml(mensaje.plantilla ?? '')
      }
    })
  }, [mensaje])

  const handleSave = () => {
    // ensure plantilla is synced from editable before saving
    const root = editableRef.current
    const final = htmlToRaw(root)
    setPlantilla(final)
    onSave({ asunto, plantilla: final })
  }

  const variables = [
    { key: '{cliente}', label: 'cliente' },
    { key: '{equipo}', label: 'equipo' },
    { key: '{problema}', label: 'problema' },
    { key: '{costo_estimado}', label: 'costo_estimado' },
    { key: '{costo_final}', label: 'costo_final' },
  ]

  const placeholderKeys = [
    '{cliente}',
    '{equipo}',
    '{problema}',
    '{costo_estimado}',
    '{costo_final}',
  ]

  const rawToHtml = (raw: string) => {
    if (!raw) return ''
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const parts = raw.split(
      /(\{(?:cliente|equipo|problema|costo_estimado|costo_final)\})/g
    )
    return parts
      .map((p) => {
        if (
          /^\{(?:cliente|equipo|problema|costo_estimado|costo_final)\}$/.test(p)
        ) {
          const label = p.slice(1, -1)
          return `<span data-key="${p}" contenteditable="false" class="inline-flex items-center px-2 py-1 mr-1 mb-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">${esc(label)}</span>`
        }
        return `<span>${esc(p)}</span>`
      })
      .join('')
  }

  const htmlToRaw = (el: HTMLElement | null) => {
    if (!el) return ''
    let out = ''
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        out += node.textContent ?? ''
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elNode = node as HTMLElement
        if (elNode.dataset && elNode.dataset.key) {
          out += elNode.dataset.key
        } else {
          out += htmlToRaw(elNode)
        }
      }
    })
    return out
  }

  const insertVariableAtCursor = (key: string) => {
    const root = editableRef.current
    if (!root) {
      // fallback: append to raw
      setPlantilla((p) => p + key)
      return
    }
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) {
      root.insertAdjacentHTML('beforeend', rawToHtml(key))
      setPlantilla(htmlToRaw(root))
      return
    }
    const range = sel.getRangeAt(0)
    // create span node
    const span = document.createElement('span')
    span.setAttribute('data-key', key)
    span.setAttribute('contenteditable', 'false')
    span.className =
      'inline-flex items-center px-2 py-1 mr-1 mb-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded'
    span.textContent = key.slice(1, -1)
    range.deleteContents()
    range.insertNode(span)
    // move caret after span
    range.setStartAfter(span)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    // sync raw
    setPlantilla(htmlToRaw(root))
  }

  const handleEditableInput = () => {
    const root = editableRef.current
    setPlantilla(htmlToRaw(root))
  }

  const renderPreview = () => {
    if (!plantilla) return null
    const parts = plantilla.split(
      /(\{(?:cliente|equipo|problema|costo_estimado|costo_final)\})/g
    )
    return (
      <div className='mt-2 p-2 border rounded bg-gray-50 dark:bg-gray-900'>
        {parts.map((part, i) => {
          if (
            /^\{(?:cliente|equipo|problema|costo_estimado|costo_final)\}$/.test(
              part
            )
          ) {
            return (
              <span
                key={i}
                className='inline-flex items-center px-2 py-1 mr-1 mb-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded'
              >
                {part}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg relative'>
        <button
          className='absolute top-2 right-2 text-gray-500 hover:text-gray-800'
          onClick={onClose}
          title='Cerrar'
        >
          ×
        </button>
        <SectionTitle className='mb-4'>Editar Mensaje de WhatsApp</SectionTitle>
        <div className='space-y-4'>
          <InfoRow
            label='Tipo'
            value={
              <Input
                label=''
                type='text'
                value={mensaje.tipo}
                disabled
                className='w-full bg-gray-100 dark:bg-gray-700'
              />
            }
          />
          <InfoRow
            label='Asunto'
            value={
              <Input
                label=''
                type='text'
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                className='w-full'
              />
            }
          />
          <InfoRow
            label='Plantilla'
            value={
              <div>
                <div
                  ref={editableRef}
                  onInput={handleEditableInput}
                  contentEditable
                  suppressContentEditableWarning
                  className={`mt-1 block w-full min-h-[8rem] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-2`}
                />
                <textarea value={plantilla} readOnly className='hidden' />
              </div>
            }
          />
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            <p className='font-bold mb-2'>Variables disponibles:</p>
            <div className='flex flex-wrap gap-2'>
              {variables.map((v) => (
                <button
                  key={v.key}
                  type='button'
                  onClick={() => insertVariableAtCursor(v.key)}
                  className='text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border hover:bg-gray-200 dark:hover:bg-gray-600'
                >
                  {v.key.replace(/^{|}$/g, '')}
                </button>
              ))}
            </div>
            <p className='mt-2'>Toca una variable para insertarla donde esté el cursor.</p>
          </div>
        </div>
        <div className='flex justify-end gap-2 mt-6'>
          <Button type='button' color='secondary' onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type='button' onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
