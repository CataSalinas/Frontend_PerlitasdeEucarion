import { apiFetch, guardarSesion, limpiarSesion, renovarAccessToken } from './api.js'

/** Inicia sesión y persiste tokens + usuario. */
export async function login(correo, password) {
  const datos = await apiFetch('/auth/login', {
    method: 'POST',
    body: { correo, password },
    auth: false
  })
  guardarSesion(datos)
  return datos
}

export function refrescarSesion() {
  return renovarAccessToken()
}

export function logout() {
  limpiarSesion()
}

export function obtenerPerfil() {
  return apiFetch('/auth/me')
}
