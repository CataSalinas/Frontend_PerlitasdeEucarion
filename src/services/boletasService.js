import { apiFetch } from './api.js'

function adaptarVenta(venta) {
  return {
    ...venta,
    detalles: (venta.productos || []).map((producto) => ({
      ...producto,
      productoNombre: producto.datosProducto?.nombre || `Producto #${producto.productoId}`
    }))
  }
}

export async function listarBoletas() {
  const ventas = await apiFetch('/ventas')
  return ventas.map(adaptarVenta)
}

export async function obtenerBoleta(id) {
  return adaptarVenta(await apiFetch(`/ventas/${id}`))
}

export async function crearBoleta(datos) {
  return adaptarVenta(await apiFetch('/ventas/registro', { method: 'POST', body: datos }))
}

export function cambiarEstadoBoleta(id, estado) {
  return apiFetch(`/ventas/${id}/estado`, { method: 'PUT', body: { estado } })
}

export function anularBoleta(id) {
  return apiFetch(`/ventas/${id}`, { method: 'DELETE' })
}
