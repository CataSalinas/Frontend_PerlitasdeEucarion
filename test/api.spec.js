import {
  apiFetch, guardarSesion, leerSesion, registrarCierreSesion
} from '../src/services/api.js'
import { mockFetch, respuestaError, respuestaOk, tokenValido } from './helpers.jsx'

function sesionInicial(accessToken = tokenValido()) {
  return guardarSesion({
    accessToken,
    refreshToken: 'refresh-inicial',
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
    expect(url).toBe('http://localhost:8080/api/v1/productos')
    expect(opciones.headers.Authorization).toBe('Bearer access-123')
  })

  it('renueva una vez con refresh y reintenta la petición original', async () => {
    sesionInicial('access-viejo')
    const nuevos = {
      accessToken: 'access-nuevo',
      refreshToken: 'refresh-nuevo',
      tokenType: 'Bearer',
      expiresIn: 3600,
      usuario: { id: 1, nombre: 'Ana', apellidos: 'Admin', correo: 'admin@perlitas.cl', rol: 'ADMIN' }
    }
    const fetchSpy = spyOn(window, 'fetch').and.callFake((url, opciones) => {
      const ruta = String(url)
      if (ruta.includes('/auth/refresh')) return Promise.resolve(respuestaOk(nuevos))
      if (ruta.includes('/productos')) {
        const reintento = opciones.headers.Authorization === 'Bearer access-nuevo'
        return Promise.resolve(reintento ? respuestaOk([{ id: 1 }]) : respuestaError(401, 'Token expirado'))
      }
      return Promise.resolve(respuestaError(404, 'No encontrado'))
    })

    const datos = await apiFetch('/productos')

    expect(datos).toEqual([{ id: 1 }])
    expect(fetchSpy.calls.count()).toBe(3)
    expect(fetchSpy.calls.argsFor(1)[0]).toContain('/auth/refresh')
    expect(fetchSpy.calls.argsFor(2)[1].headers.Authorization).toBe('Bearer access-nuevo')
    expect(leerSesion().accessToken).toBe('access-nuevo')
  })

  it('normaliza el error usando el campo message del backend', async () => {
    sesionInicial()
    mockFetch(() => respuestaError(409, 'Stock insuficiente para Collar de perlas'))

    let error = null
    try {
      await apiFetch('/boletas', { method: 'POST', body: { items: [] } })
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

  it('si el refresh falla, limpia la sesión', async () => {
    const quitar = registrarCierreSesion(() => {})
    sesionInicial()
    spyOn(window, 'fetch').and.callFake((url) =>
      Promise.resolve(String(url).includes('/auth/refresh')
        ? respuestaError(401, 'Refresh inválido')
        : respuestaError(401, 'Token expirado'))
    )

    let error = null
    try {
      await apiFetch('/productos')
    } catch (e) {
      error = e
    } finally {
      quitar()
    }

    expect(error.status).toBe(401)
    expect(leerSesion()).toBeNull()
  })

  it('evita refreshes simultáneos con una sola petición en vuelo', async () => {
    const quitar = registrarCierreSesion(() => {})
    sesionInicial()
    let resolverRefresh
    const refreshPromise = new Promise((resolver) => { resolverRefresh = resolver })
    const nuevos = {
      accessToken: 'access-unico',
      refreshToken: 'refresh-unico',
      usuario: { id: 1, nombre: 'Ana', apellidos: 'Admin', correo: 'admin@perlitas.cl', rol: 'ADMIN' }
    }
    const fetchSpy = spyOn(window, 'fetch').and.callFake((url) => {
      if (String(url).includes('/auth/refresh')) return refreshPromise
      return Promise.resolve(respuestaError(401, 'Token expirado'))
    })

    const peticionUno = apiFetch('/productos').catch(() => null)
    const peticionDos = apiFetch('/categorias').catch(() => null)
    await new Promise((resolver) => setTimeout(resolver, 0))
    resolverRefresh(respuestaOk(nuevos))
    await Promise.all([peticionUno, peticionDos])
    quitar()

    const refreshes = fetchSpy.calls.allArgs()
      .filter((argumentos) => String(argumentos[0]).includes('/auth/refresh'))
    expect(refreshes.length).toBe(1)
  })
})
