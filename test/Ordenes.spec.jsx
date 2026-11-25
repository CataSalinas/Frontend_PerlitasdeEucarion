import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import Ordenes from '../src/pages/Ordenes.jsx'
import { iniciarSesion, mockFetch, respuestaOk } from './helpers.jsx'

const BOLETA = {
  id: 1001,
  fecha: '2026-11-20T12:00:00.000Z',
  total: 9990,
  estado: 'PAGADO',
  usuarioNombre: 'Ana Admin',
  clienteNombre: 'María',
  clienteApellidos: 'González',
  clienteCorreo: 'maria@example.cl',
  calle: 'Av. Providencia',
  numeroCasa: '1234',
  regionId: 1000,
  comunaId: 1022,
  indicaciones: '',
  detalles: []
}

function renderizar(rol) {
  iniciarSesion(rol)
  mockFetch((url) => String(url).includes('/boletas') ? respuestaOk([BOLETA]) : respuestaOk([]))
  return render(
    <MemoryRouter>
      <AuthProvider><Ordenes /></AuthProvider>
    </MemoryRouter>
  )
}

describe('Página Órdenes', () => {
  it('ADMIN puede cambiar estado y anular', async () => {
    renderizar('ADMIN')
    await waitFor(() => expect(screen.getByText('María González')).toBeTruthy())

    expect(screen.getByLabelText('Cambiar estado de la boleta 1001')).toBeTruthy()
    expect(screen.getByText('Anular')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Registrar venta/ })).toBeTruthy()
  })

  it('VENDEDOR solo consulta: no hay selector de estado ni botón Anular', async () => {
    renderizar('VENDEDOR')
    await waitFor(() => expect(screen.getByText('María González')).toBeTruthy())

    expect(screen.queryByLabelText('Cambiar estado de la boleta 1001')).toBeNull()
    expect(screen.queryByText('Anular')).toBeNull()
    expect(screen.queryByRole('link', { name: /Registrar venta/ })).toBeNull()
    expect(screen.getByRole('link', { name: 'Ver' })).toBeTruthy()
  })
})
