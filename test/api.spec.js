import {
  apiFetch, guardarSesion, leerSesion, registrarCierreSesion
} from '../src/services/api.js'
import { mockFetch, respuestaError, respuestaOk, tokenValido } from './helpers.jsx'

function sesionInicial(accessToken = tokenValido()) {
  return guardarSesion({
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    usuario: { id: 1, nombre: 'Ana', apellidos: 'Admin', correo: 'admin@perlitas.cl', rol: 'ADMIN' }
  })
}

describe('api.js (wrapper de fetch)', () => {
  it('antepone VITE_API_URL y agrega el header Authorization', async () => {
    sesionInicial('access-123')
    const fetchSpy = mockFetch(() => respuestaOk([]))

    await apiFetch('/productos')

    const [url, opciones] = fetchSpy.calls.mostRecent().args
    expect(url).toBe('/api/v1/productos')
    expect(opciones.headers.Authorization).toBe('Bearer access-123')
  })

  it('envía el JWT real y cierra sesión ante 401 sin pedir refresh', async () => {
    const quitar = registrarCierreSesion(() => {})
    sesionInicial()
    const fetchSpy = mockFetch(() => respuestaError(401, 'Token expirado'))
    try {
      await expectAsync(apiFetch('/productos')).toBeRejected()
      expect(leerSesion()).toBeNull()
      expect(fetchSpy.calls.count()).toBe(1)
    } finally { quitar() }
  })

  it('normaliza el error usando el campo message del backend', async () => {
    sesionInicial()
    mockFetch(() => respuestaError(409, 'Stock insuficiente para Collar de perlas'))

    let error = null
    try {
      await apiFetch('/ventas/registro', { method: 'POST', body: { items: [] } })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.status).toBe(409)
    expect(error.message).toBe('Stock insuficiente para Collar de perlas')
  })

  it('informa error de red con un mensaje entendible', async () => {
    spyOn(window, 'fetch').and.returnValue(Promise.reject(new TypeError('Failed to fetch')))

    let error = null
    try {
      await apiFetch('/productos')
    } catch (e) {
      error = e
    }

    expect(error.status).toBe(0)
    expect(error.message).toBe('No se pudo conectar con el servidor')
  })

  it('un 403 no elimina la sesión', async () => {
    sesionInicial()
    mockFetch(() => respuestaError(403, 'Acceso denegado'))
    await expectAsync(apiFetch('/productos/1', { method: 'PUT', body: {} })).toBeRejected()
    expect(leerSesion()).not.toBeNull()
  })

  it('un 503 no elimina la sesión', async () => {
    sesionInicial()
    mockFetch(() => respuestaError(503, 'Servicio no disponible'))
    await expectAsync(apiFetch('/ventas')).toBeRejected()
    expect(leerSesion()).not.toBeNull()
  })
})
