import { z } from 'zod'

export const compraDetalleSchema = z.object({
  producto_id: z.string().uuid('Debe seleccionar un producto válido'),
  cantidad: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  costo_unitario: z.number().min(0, 'El costo unitario debe ser positivo'),
  descuento_monto: z.number().min(0, 'El descuento no puede ser negativo').default(0),
  descuento_porcentaje: z.number().min(0).max(100).nullable().default(null),
})

export const compraSchema = z.object({
  proveedor_id: z.string().uuid('Debe seleccionar un proveedor válido'),
  metodo_pago: z.enum(['efectivo', 'tarjeta', 'sinpe', 'credito']).optional().nullable(),
})

export const proveedorCreditoSchema = z.object({
  credito_inicial: z.number().min(0, 'El crédito inicial debe ser positivo').default(0),
})

export const proveedorMovimientoSchema = z.object({
  monto: z.number().min(0, 'El monto debe ser positivo'),
  metodo_pago: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
})

export type CompraDetalleFormData = z.infer<typeof compraDetalleSchema>
export type CompraFormData = z.infer<typeof compraSchema>
export type ProveedorCreditoFormData = z.infer<typeof proveedorCreditoSchema>
export type ProveedorMovimientoFormData = z.infer<typeof proveedorMovimientoSchema>
