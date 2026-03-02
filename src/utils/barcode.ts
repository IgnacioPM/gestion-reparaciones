import JsBarcode from 'jsbarcode'

function hashEmpresaIdToPrefix(empresaId: string): string {
  let hash = 0
  for (let i = 0; i < empresaId.length; i += 1) {
    hash = (hash * 31 + empresaId.charCodeAt(i)) % 1000000
  }
  return String(Math.abs(hash)).padStart(6, '0')
}

function extractSequence(barcode: string, prefix: string): number | null {
  if (!barcode.startsWith(prefix)) return null
  const suffix = barcode.slice(prefix.length)
  if (!/^\d{6}$/.test(suffix)) return null
  return Number.parseInt(suffix, 10)
}

export function isValidCode128(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  if (typeof document === 'undefined') return true

  try {
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, trimmed, {
      format: 'CODE128',
      displayValue: false,
      margin: 0,
    })
    return true
  } catch {
    return false
  }
}

export function generateNextBarcode(
  empresaId: string,
  existingBarcodes: Iterable<string | null | undefined>
): string {
  const prefix = hashEmpresaIdToPrefix(empresaId)
  let maxSequence = 0

  for (const rawCode of existingBarcodes) {
    if (!rawCode) continue
    const code = rawCode.trim()
    const sequence = extractSequence(code, prefix)
    if (sequence != null && sequence > maxSequence) {
      maxSequence = sequence
    }
  }

  let nextSequence = maxSequence + 1

  while (nextSequence <= 999999) {
    const candidate = `${prefix}${String(nextSequence).padStart(6, '0')}`
    if (isValidCode128(candidate)) return candidate
    nextSequence += 1
  }

  throw new Error('No fue posible generar un código de barras único para la empresa')
}
