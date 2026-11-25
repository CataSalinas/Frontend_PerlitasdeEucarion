import { apiFetch } from './api.js'

export function listarUsuarios() {
  return apiFetch('/usuarios')
}

export function obtenerUsuario(id) {
  return apiFetch(`/usuarios/${id}`)
}

export function crearUsuario(datos) {
  return apiFetch('/usuarios', { method: 'POST', body: datos })
}

export function actualizarUsuario(id, datos) {
  return apiFetch(`/usuarios/${id}`, { method: 'PUT', body: datos })
}

export function darBajaUsuario(id) {
  return apiFetch(`/usuarios/${id}`, { method: 'DELETE' })
}
