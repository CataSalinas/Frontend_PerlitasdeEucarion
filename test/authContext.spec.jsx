import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '../src/context/AuthContext.jsx'
import { guardarSesion, leerSesion } from '../src/services/api.js'
import {
  drenarEfectos, iniciarSesion, mockFetch, respuestaError, respuestaOk, tokenConExp, tokenValido
} from './helpers.jsx'

function PantallaSesion() {
  const { cargando, isAuthenticated, usuario, rol, login, logout } = useAuth()
  return (
    <div>
      <p data-testid="estado">
        {cargando ? 'cargando' : isAuthenticated ? `autenticado:${rol}` : 'sin-sesion'}
      </p>
      <p data-testid="nombre">{usuario ? usuario.nombre : ''}</p>
      <button type="button" onClick={() => login('admin@perlitas.cl', 'Admin123!')}>Ingresar</button>
      <button type="button" onClick={logout}>Salir</button>
    </div>
  )
}

function renderizar(ruta = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path="/panel" element={<p>PANEL</p>} />
          <Route path="/login" element={<p>PANTALLA DE LOGIN</p>} />
          <Route path="*" element={<PantallaSesion />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

const USUARIO = {
  id: 1, nombre: 'Ana', apellidos: 'Admin', correo: 'admin@perlitas.cl', rol: 'ADMIN'
}

describe('AuthContext (sesión)', () => {
  it('login guarda tokens y usuario y deja la sesión autenticada', async () => {
    const datos = {
      accessToken: 'access-login', refreshToken: 'refresh-login',
      tokenType: 'Bearer', expiresIn: 900, usuario: USUARIO
    }
    const fetchSpy = mockFetch((url) => url.includes('/auth/login')
      ? respuestaOk(datos)
      : respuestaError(404, 'no'))

    renderizar()
    fireEvent.click(screen.getByText('Ingresar'))
    await drenarEfectos()

    await waitFor(() => {
      expect(screen.getByTestId('estado').textContent).toBe('autenticado:ADMIN')
    })
    expect(leerSesion().accessToken).toBe('access-login')
    expect(screen.getByTestId('nombre').textContent).toBe('Ana')
    expect(fetchSpy.calls.mostRecent().args[0]).toContain('/auth/login')
    // Login es público: no debe enviar Authorization.
    expect(fetchSpy.calls.mostRecent().args[1].headers.Authorization).toBeUndefined()
  })

  it('restaura la sesión después de una "recarga" (desmontar y volver a montar)', async () => {
    iniciarSesion()
    const fetchSpy = mockFetch(() => respuestaOk([]))

    const primera = renderizar('/panel')
    await waitFor(() => expect(screen.getByText('PANEL')).toBeTruthy())
    primera.unmount()

    renderizar('/panel')
    await waitFor(() => expect(screen.getByText('PANEL')).toBeTruthy())
    // Con access_token vigente no se llama al backend al restaurar.
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('logout limpia la sesión y redirige a /login', async () => {
    iniciarSesion()
    renderizar()
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('autenticado:ADMIN'))

    fireEvent.click(screen.getByText('Salir'))

    await waitFor(() => expect(screen.getByText('PANTALLA DE LOGIN')).toBeTruthy())
    expect(leerSesion()).toBeNull()
  })

  it('si el access está expirado intenta refresh y conserva la sesión', async () => {
    const expirado = tokenConExp(Math.floor(Date.now() / 1000) - 60)
    guardarSesion({ accessToken: expirado, refreshToken: 'refresh-viejo', usuario: USUARIO })
    const nuevos = {
      accessToken: tokenValido(), refreshToken: 'refresh-nuevo',
      tokenType: 'Bearer', expiresIn: 900, usuario: USUARIO
    }
    const fetchSpy = mockFetch((url) => url.includes('/auth/refresh')
      ? respuestaOk(nuevos)
      : respuestaError(401, 'Token expirado'))

    renderizar()
    await drenarEfectos()
    await waitFor(() => expect(screen.getByTestId('estado').textContent).toBe('autenticado:ADMIN'))

    expect(fetchSpy.calls.mostRecent().args[0]).toContain('/auth/refresh')
    expect(leerSesion().refreshToken).toBe('refresh-nuevo')
  })

  it('si el refresh falla, limpia la sesión y envía a /login', async () => {
    const expirado = tokenConExp(Math.floor(Date.now() / 1000) - 60)
    guardarSesion({ accessToken: expirado, refreshToken: 'refresh-malo', usuario: USUARIO })
    mockFetch((url) => url.includes('/auth/refresh')
      ? respuestaError(401, 'Refresh inválido')
      : respuestaError(401, 'Token expirado'))

    renderizar()
    await drenarEfectos()
    await waitFor(() => expect(screen.getByText('PANTALLA DE LOGIN')).toBeTruthy())
    expect(leerSesion()).toBeNull()
  })
})
