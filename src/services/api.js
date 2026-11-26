import { API_URL } from '../config.js'

/**
 * Capa de transporte hacia la API REST.
 * - Antepone VITE_API_URL.
 * - Agrega el header Authorization: Bearer <accessToken>.
 * - Si recibe 401 en una petición autenticada, finaliza la sesión.
 * - Normaliza los errores del backend usando el campo `message`.
 */
export const CLAVES_SESION = {
  accessToken: 'perlitas_accessToken',
  refreshToken: 'perlitas_refreshToken',
  usuario: 'perlitas_usuario'
}

const oyentesSesion = new Set()
let oyenteCierre = null

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

// ---------------------------------------------------------------------------
// Suscripciones: permiten que AuthContext reaccione a cambios de la capa API
// ---------------------------------------------------------------------------

export function suscribirSesion(funcion) {
  oyentesSesion.add(funcion)
  return () => oyentesSesion.delete(funcion)
}

function notificarSesion() {
  oyentesSesion.forEach((funcion) => funcion(leerSesion()))
}

export function registrarCierreSesion(funcion) {
  oyenteCierre = funcion
  return () => { if (oyenteCierre === funcion) oyenteCierre = null }
}

function cerrarSesionForzada() {
  limpiarSesion()
  if (typeof oyenteCierre === 'function') {
    oyenteCierre()
  } else if (typeof window !== 'undefined' && window.location) {
    try { window.location.assign('/login') } catch { /* jsdom no implementa navegación */ }
  }
}

// ---------------------------------------------------------------------------
// Persistencia de sesión (localStorage)
// ---------------------------------------------------------------------------

export function leerSesion() {
  try {
    const accessToken = localStorage.getItem(CLAVES_SESION.accessToken)
    const usuario = JSON.parse(localStorage.getItem(CLAVES_SESION.usuario) || 'null')
    if (!accessToken || !usuario) return null
    return { accessToken, usuario }
  } catch {
    return null
  }
}

export function guardarSesion(datos) {
  if (!datos || !datos.accessToken || !datos.usuario) return null
  localStorage.setItem(CLAVES_SESION.accessToken, datos.accessToken)
  localStorage.removeItem(CLAVES_SESION.refreshToken)
  localStorage.setItem(CLAVES_SESION.usuario, JSON.stringify(datos.usuario))
  notificarSesion()
  return leerSesion()
}

export function limpiarSesion() {
  Object.values(CLAVES_SESION).forEach((clave) => localStorage.removeItem(clave))
  notificarSesion()
}

// ---------------------------------------------------------------------------
// JWT: lectura del claim `exp` (sin verificar firma; eso lo hace el backend)
// ---------------------------------------------------------------------------

export function decodificarJwt(token) {
  try {
    const parte = String(token).split('.')[1]
    if (!parte) return null
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const relleno = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(relleno))
  } catch {
    return null
  }
}

export function obtenerExpiracion(token) {
  const payload = decodificarJwt(token)
  return payload && typeof payload.exp === 'number' ? payload.exp : null
}

export function tokenExpirado(token, ahora = Date.now()) {
  const exp = obtenerExpiracion(token)
  return exp !== null && exp * 1000 <= ahora
}

// ---------------------------------------------------------------------------
// petición genérica
// ---------------------------------------------------------------------------

function construirUrl(ruta) {
  if (/^https?:\/\//i.test(ruta)) return ruta
  return `${API_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`
}

function mensajeDelBackend(respuesta, payload) {
  if (payload && typeof payload.mensaje === 'string' && payload.mensaje.trim()) return payload.mensaje
  if (payload && typeof payload.message === 'string' && payload.message.trim()) return payload.message
  if (respuesta.status === 401) return 'No autorizado'
  if (respuesta.status === 403) return 'No tiene permisos para realizar esta acción'
  if (respuesta.status === 404) return 'Recurso no encontrado'
  return `Error del servidor (${respuesta.status})`
}

/**
 * @param {string} ruta ruta relativa a VITE_API_URL
 * @param {object} opciones { method, body, auth = true, signal }
 */
export async function apiFetch(ruta, opciones = {}) {
  const { method = 'GET', body, auth = true, signal, texto = false } = opciones
  const sesion = leerSesion()
  const cabeceras = { Accept: 'application/json' }

  if (body !== undefined) cabeceras['Content-Type'] = 'application/json'
  if (auth && sesion && sesion.accessToken) {
    cabeceras.Authorization = `Bearer ${sesion.accessToken}`
  }

  let respuesta
  try {
    respuesta = await fetch(construirUrl(ruta), {
      method,
      headers: cabeceras,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }

  if (!respuesta.ok) {
    let payload = null
    try { payload = await respuesta.json() } catch { /* cuerpo vacío */ }

    // Una respuesta vieja no debe cerrar una sesión que acaba de cambiar.
    if (respuesta.status === 401 && auth && sesion && leerSesion()?.accessToken === sesion.accessToken) {
      cerrarSesionForzada()
    }

    throw new ApiError(mensajeDelBackend(respuesta, payload), respuesta.status, payload)
  }

  if (respuesta.status === 204) return null
  if (texto) return await respuesta.text()
  try {
    return await respuesta.json()
  } catch {
    return null
  }
}

export default apiFetch
