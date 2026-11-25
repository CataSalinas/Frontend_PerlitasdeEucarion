import { apiFetch } from './api.js'

export function listarBoletas() {
  return apiFetch('/boletas')
}

export function obtenerBoleta(id) {
  return apiFetch(`/boletas/${id}`)
}

export function crearBoleta(datos) {
  return apiFetch('/boletas', { method: 'POST', body: datos })
}

export function cambiarEstadoBoleta(id, estado) {
  return apiFetch(`/boletas/${id}/estado`, { method: 'PUT', body: { estado } })
}

export function anularBoleta(id) {
  return apiFetch(`/boletas/${id}`, { method: 'DELETE' })
}
