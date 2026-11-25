import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import Login from '../src/pages/Login.jsx'
import { mockFetch, respuestaError, respuestaOk } from './helpers.jsx'

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/panel" element={<p>PANEL DE GESTIÓN</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

function llenarFormulario() {
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'admin@perlitas.cl' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Admin123!' } })
}

describe('Login', () => {
  it('valida campos vacíos sin llamar a la API', () => {
    const fetchSpy = mockFetch(() => respuestaOk({}))
    renderizar()

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByText('Debe ingresar su correo.')).toBeTruthy()
    expect(screen.getByText('Debe ingresar su contraseña.')).toBeTruthy()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('muestra mensaje claro ante credenciales inválidas (401)', async () => {
    mockFetch(() => respuestaError(401, 'Correo o contraseña incorrectos'))
    renderizar()
    llenarFormulario()

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.getByText('Correo o contraseña incorrectos.')).toBeTruthy()
    })
  })

  it('muestra mensaje de servidor caído (error de red)', async () => {
    spyOn(window, 'fetch').and.returnValue(Promise.reject(new Error('network')))
    renderizar()
    llenarFormulario()

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.getByText('No se pudo conectar con el servidor. Intente más tarde.')).toBeTruthy()
    })
  })

  it('con credenciales válidas navega al panel', async () => {
    const datos = {
      accessToken: 'access-ok', refreshToken: 'refresh-ok', tokenType: 'Bearer', expiresIn: 900,
      usuario: { id: 1, nombre: 'Ana', apellidos: 'Admin', correo: 'admin@perlitas.cl', rol: 'ADMIN' }
    }
    mockFetch(() => respuestaOk(datos))
    renderizar()
    llenarFormulario()

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => expect(screen.getByText('PANEL DE GESTIÓN')).toBeTruthy())
  })
})
