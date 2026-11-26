import { listarTienda, comprarSinCuenta } from '../src/services/tiendaService.js'
import { iniciarSesion, mockFetch, respuestaOk } from './helpers.jsx'

describe('Tienda pública', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('consulta catálogo y categorías sin JWT, incluso si hay una sesión de personal', async () => {
    iniciarSesion()
    const fetchMock = mockFetch((url) => respuestaOk(url.endsWith('/productos/tienda') ?
      [{ id: 1, nombre: 'Collar', precioVenta: 1000, stockDisponible: 2 }] :
      [{ productoId: 1, categoriaId: 2, nombre: 'Collares' }]))
    const productos = await listarTienda()
    expect(productos[0].precioAhora).toBe(1000)
    expect(productos[0].categoria).toBe('Collares')
    for (const llamada of fetchMock.calls.allArgs()) expect(llamada[1].headers.Authorization).toBeUndefined()
  })

  it('envía la compra sin sesión al endpoint público', async () => {
    const datos = { metodoPago: 'EFECTIVO', items: [{ productoId: 1, cantidad: 2 }] }
    const fetchMock = mockFetch(() => respuestaOk({ id: 1, total: 2000, estado: 'PENDIENTE' }, 201))
    const compra = await comprarSinCuenta(datos)
    expect(compra.estado).toBe('PENDIENTE')
    const [url, opciones] = fetchMock.calls.mostRecent().args
    expect(url).toBe('/api/v1/ventas/compra')
    expect(opciones.method).toBe('POST')
    expect(opciones.headers.Authorization).toBeUndefined()
    expect(JSON.parse(opciones.body)).toEqual(datos)
  })
})
