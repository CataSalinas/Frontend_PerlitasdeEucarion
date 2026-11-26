import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NuevaOrden from '../src/pages/NuevaOrden.jsx'
import { mockFetch, respuestaOk } from './helpers.jsx'
import { regiones, comunas } from '../src/data/zonas.js'

describe('Compra pública', () => {
  it('permite agregar un producto y comprar sin iniciar sesión', async () => {
    const fetchMock = mockFetch((url) => {
      if (url.endsWith('/productos/tienda')) return respuestaOk([{ id: 1, nombre: 'Collar', precioVenta: 1000, stockDisponible: 2 }])
      if (url.endsWith('/categorias/tienda')) return respuestaOk([{ productoId: 1, categoriaId: 1, nombre: 'Collares' }])
      return respuestaOk({ id: 1, total: 1200, estado: 'PENDIENTE', items: [{ productoId: 1, productoNombre: 'Collar', cantidad: 1, precioUnitario: 1200, subtotal: 1200 }] }, 201)
    })
    render(<MemoryRouter><NuevaOrden publica /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Collar')).toBeTruthy())
    fireEvent.click(screen.getByText('Añadir al carrito'))
    fireEvent.click(screen.getByText('Continuar compra'))
    const comuna = comunas[0]
    const region = regiones.find((r) => r.id === comuna.id_region)
    for (const [id, valor] of Object.entries({ clienteNombre: 'Ana', clienteApellidos: 'Prueba', clienteCorreo: 'ana@example.com', calle: 'Calle Uno', numeroCasa: '123', regionId: String(region.id) })) {
      fireEvent.change(document.getElementById(id), { target: { value: valor } })
    }
    fireEvent.change(document.getElementById('comunaId'), { target: { value: String(comuna.id) } })
    fireEvent.click(screen.getByText('Confirmar compra'))
    await waitFor(() => expect(screen.getByText('¡Compra registrada!')).toBeTruthy())
    expect(screen.getByText('Resumen de tu compra')).toBeTruthy()
    expect(screen.getByText('Collar')).toBeTruthy()
    expect(screen.getByText('Total a pagar:')).toBeTruthy()
    expect(screen.getAllByText('$1.200').length).toBe(3)
    const llamada = fetchMock.calls.allArgs().find(([url]) => url.endsWith('/ventas/compra'))
    expect(llamada[1].headers.Authorization).toBeUndefined()
    expect(JSON.parse(llamada[1].body).items).toEqual([{ productoId: 1, cantidad: 1 }])
  })
})
