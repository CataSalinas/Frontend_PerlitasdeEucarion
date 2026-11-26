import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import Productos from '../src/pages/Productos.jsx'
import {
  CATEGORIAS_FALSAS, PRODUCTOS_FALSOS, iniciarSesion, mockFetch, respuestaOk
} from './helpers.jsx'

function renderizar(rol) {
  iniciarSesion(rol)
  return render(
    <MemoryRouter>
      <AuthProvider><Productos /></AuthProvider>
    </MemoryRouter>
  )
}

function mockCatalogo() {
  return mockFetch((url, opciones) => {
    if (String(url).includes('/categorias/relaciones')) {
      if (opciones.method === 'DELETE') return respuestaOk(null, 204)
      return respuestaOk(PRODUCTOS_FALSOS.map(p => ({ productoId: p.id, categoria: CATEGORIAS_FALSAS.find(c => c.id === p.categoriaId) })))
    }
    if (String(url).includes('/categorias')) return respuestaOk(CATEGORIAS_FALSAS)
    if (String(url).includes('/productos')) {
      if (opciones.method === 'DELETE') return respuestaOk(null, 204)
      return respuestaOk(PRODUCTOS_FALSOS.map(p => ({ id: p.id, nombre: p.nombre, descripcion: p.descripcion, precioAntes: p.precioAntes, precioVenta: p.precioAhora, stockDisponible: p.stock, activo: true })))
    }
    return respuestaOk([])
  })
}

describe('Página Productos', () => {
  it('ADMIN ve botones de nuevo, editar y eliminar', async () => {
    mockCatalogo()
    renderizar('ADMIN')

    await waitFor(() => expect(screen.getByText('Collar de perlas')).toBeTruthy())
    expect(screen.getByRole('link', { name: /Nuevo producto/ })).toBeTruthy()
    expect(screen.getAllByText('Editar').length).toBe(2)
    expect(screen.getAllByText('Eliminar').length).toBe(2)
  })

  it('VENDEDOR no ve botones de escritura, solo puede ver detalle', async () => {
    mockCatalogo()
    renderizar('VENDEDOR')

    await waitFor(() => expect(screen.getByText('Collar de perlas')).toBeTruthy())
    expect(screen.queryByRole('link', { name: /Nuevo producto/ })).toBeNull()
    expect(screen.queryByText('Editar')).toBeNull()
    expect(screen.queryByText('Eliminar')).toBeNull()
    expect(screen.getAllByRole('link', { name: 'Ver' }).length).toBe(2)
  })

  it('eliminar pide confirmación y llama a DELETE', async () => {
    const fetchSpy = mockCatalogo()
    spyOn(window, 'confirm').and.returnValue(true)
    renderizar('ADMIN')

    await waitFor(() => expect(screen.getByText('Collar de perlas')).toBeTruthy())
    fireEvent.click(screen.getAllByText('Eliminar')[0])

    await waitFor(() => {
      const llamada = fetchSpy.calls.allArgs().find((args) => args[1].method === 'DELETE')
      expect(llamada).toBeTruthy()
      expect(llamada[0]).toContain('/productos/1')
    })
  })
})
