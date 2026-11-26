import { apiFetch, guardarSesion, limpiarSesion, renovarAccessToken, decodificarJwt } from './api.js'

export async function login(correo, password) {
  const token = await apiFetch('/auth/login', {
    method: 'POST',
    body: {
      nombreUsuario: correo,
      contrasena: password
    },
    auth: false,
    texto: true
  })

  const payload = decodificarJwt(token)

  const datos = {
    accessToken: token,
    refreshToken: '',
    usuario: {
      nombre: payload.sub,
      rol: payload.roles.includes('ADMIN') ? 'ADMIN' : 'VENDEDOR'
    }
  }

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