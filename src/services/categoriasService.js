import { apiFetch } from './api.js'

export function listarCategorias() {
  return apiFetch('/categorias')
}

export function obtenerCategoria(id) {
  return apiFetch(`/categorias/${id}`)
}

export function crearCategoria(nombre) {
  return apiFetch('/categorias', { method: 'POST', body: { nombre } })
}

export function actualizarCategoria(id, nombre) {
  return apiFetch(`/categorias/${id}`, { method: 'PUT', body: { nombre } })
}

export function eliminarCategoria(id) {
  return apiFetch(`/categorias/${id}`, { method: 'DELETE' })
}
