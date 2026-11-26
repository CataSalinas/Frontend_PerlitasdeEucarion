export function validarTexto(texto) {
  return typeof texto === 'string' && texto.trim().length > 0
}

export function validarCantidad(valor) {
  const limpio = String(valor ?? '').trim()
  if (limpio.length === 0 || isNaN(limpio)) return false
  return parseInt(limpio, 10) > 0
}

/** Acepta 0 y números positivos. Útil para precios base y stock. */
export function validarNoNegativo(valor) {
  const limpio = String(valor ?? '').trim()
  if (limpio.length === 0 || isNaN(limpio)) return false
  const numero = Number(limpio)
  return Number.isFinite(numero) && numero >= 0
}

export function validarCorreo(valor) {
  if (!validarTexto(valor)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
}

export function formatearPrecio(valor) {
  return '$' + Number(valor).toLocaleString('es-CL')
}

const ETIQUETAS_ESTADO = {
  PENDIENTE: 'Pendiente de pago',
  PAGADO: 'Pagado',
  EN_PREPARACION: 'En preparación',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Anulado'
}

export function etiquetaEstado(estado) {
  return ETIQUETAS_ESTADO[estado] || estado || 'Sin estado'
}

export function claseEstado(estado) {
  if (estado === 'PENDIENTE') return 'bg-warning text-dark'
  if (estado === 'PAGADO') return 'bg-perla'
  if (estado === 'EN_PREPARACION') return 'bg-warning text-dark'
  if (estado === 'ENTREGADO') return 'bg-success'
  if (estado === 'CANCELADO') return 'bg-secondary'
  return 'bg-light text-dark'
}
