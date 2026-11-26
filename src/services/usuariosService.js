import { apiFetch } from './api.js'

export function listarUsuarios() {
  return apiFetch('/auth/usuarios')
}

export function obtenerUsuario(id) {
  return apiFetch(`/auth/usuarios/${id}`)
}

export function crearUsuario(datos) {
  return apiFetch('/auth/usuarios', { method: 'POST', body: datos })
}

export function actualizarUsuario(id, datos) {
  return apiFetch(`/auth/usuarios/${id}`, { method: 'PUT', body: datos })
}

export function darBajaUsuario(id) {
  return apiFetch(`/auth/usuarios/${id}`, { method: 'DELETE' })
}
