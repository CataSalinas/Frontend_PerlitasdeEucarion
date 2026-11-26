import { apiFetch, guardarSesion, limpiarSesion, decodificarJwt, tokenExpirado, ApiError } from './api.js'

export async function login(usuario, password) {
  const token = (await apiFetch('/auth/login', {
    method: 'POST', body: { nombreUsuario: usuario, contrasena: password }, auth: false, texto: true
  })).trim()
  const payload = decodificarJwt(token)
  const rol = payload?.roles?.includes('ADMIN') ? 'ADMIN' : payload?.roles?.includes('VENDEDOR') ? 'VENDEDOR' : null
  if (!payload?.sub || !Number.isFinite(payload.exp) || tokenExpirado(token) || !rol) {
    throw new ApiError('El servidor devolvió una sesión inválida.', 401)
  }
  const datos = { accessToken: token, usuario: { nombre: payload.sub, nombreUsuario: payload.sub, rol } }
  guardarSesion(datos)
  return datos
}

export function logout() {
  limpiarSesion()
}
