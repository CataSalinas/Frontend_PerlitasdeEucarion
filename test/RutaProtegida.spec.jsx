import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import RutaProtegida from '../src/components/RutaProtegida.jsx'
import { iniciarSesion } from './helpers.jsx'

function renderizar(ruta = '/privada', roles = ['ADMIN']) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>PANTALLA DE LOGIN</p>} />
          <Route element={<RutaProtegida roles={roles} />}>
            <Route path="/privada" element={<p>CONTENIDO PROTEGIDO</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('RutaProtegida', () => {
  it('sin sesión redirige a /login', async () => {
    renderizar()
    await waitFor(() => expect(screen.getByText('PANTALLA DE LOGIN')).toBeTruthy())
  })

  it('con sesión pero rol incorrecto muestra Acceso denegado (403)', async () => {
    iniciarSesion('VENDEDOR')
    renderizar('/privada', ['ADMIN'])
    await waitFor(() => expect(screen.getByText('Acceso denegado')).toBeTruthy())
    expect(screen.getByRole('link', { name: /Volver al panel/ })).toBeTruthy()
  })

  it('con rol permitido muestra la página solicitada', async () => {
    iniciarSesion('ADMIN')
    renderizar('/privada', ['ADMIN'])
    await waitFor(() => expect(screen.getByText('CONTENIDO PROTEGIDO')).toBeTruthy())
  })
})
