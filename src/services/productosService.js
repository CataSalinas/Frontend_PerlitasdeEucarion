import { apiFetch } from './api.js'

export function listarProductos() {
  return apiFetch('/productos')
}

export function obtenerProducto(id) {
  return apiFetch(`/productos/${id}`)
}

export function crearProducto(datos) {
  return apiFetch('/productos', { method: 'POST', body: datos })
}

export function actualizarProducto(id, datos) {
  return apiFetch(`/productos/${id}`, { method: 'PUT', body: datos })
}

export function eliminarProducto(id) {
  return apiFetch(`/productos/${id}`, { method: 'DELETE' })
}
