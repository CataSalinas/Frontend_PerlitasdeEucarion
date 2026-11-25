import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import { guardarSesion } from '../src/services/api.js'

/**
 * Deja que terminen los efectos asíncronos (login, refresh) antes de consultar el DOM.
 * En jsdom no hay MessageChannel, que es lo que usa `act(async () => ...)`; por eso
 * se espera un tick del event loop en vez de envolver las pruebas en `act`.
 */
export function drenarEfectos() {
  return new Promise((resolver) => setTimeout(resolver, 100))
}

export const PRODUCTOS_FALSOS = [
  {
    id: 1, nombre: 'Collar de perlas', categoria: 'Collares', descripcion: 'Perlas de río',
    precioAntes: 12990, precioAhora: 9990, stock: 8, categoriaId: 1
  },
  {
    id: 2, nombre: 'Aros de plata', categoria: 'Aros', descripcion: 'Baño de plata',
    precioAntes: 8990, precioAhora: 6990, stock: 2, categoriaId: 2
  }
]

export const CATEGORIAS_FALSAS = [
  { id: 1, nombre: 'Collares' },
  { id: 2, nombre: 'Aros' }
]

/** JWT falso con claim exp; la firma no importa porque las pruebas mockean fetch. */
export function tokenConExp(exp, datos = {}) {
  const payload = {
    sub: '1', correo: 'admin@perlitas.cl', rol: 'ADMIN', exp, ...datos
  }
  const codificado = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `header.${codificado}.firma`
}

export function tokenValido(rol = 'ADMIN') {
  return tokenConExp(Math.floor(Date.now() / 1000) + 3600, { rol })
}

export function iniciarSesion(rol = 'ADMIN') {
  const sesion = guardarSesion({
    accessToken: tokenValido(rol),
    refreshToken: 'refresh-valido',
    tokenType: 'Bearer',
    expiresIn: 3600,
    usuario: {
      id: 1, nombre: 'Ana', apellidos: 'Admin', correo: 'admin@perlitas.cl', rol, activo: true
    }
  })
  return sesion
}

export function respuestaOk(cuerpo, status = 200) {
  return {
    ok: true,
    status,
    json: () => Promise.resolve(cuerpo)
  }
}

export function respuestaError(status, message) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({
      timestamp: new Date().toISOString(),
      status,
      error: 'Error',
      message,
      path: '/api/v1/prueba'
    })
  }
}

/** Instala un spy de fetch que devuelve lo que decida `manejador(url, opciones)`. */
export function mockFetch(manejador) {
  return spyOn(window, 'fetch').and.callFake((url, opciones) =>
    Promise.resolve(manejador(String(url), opciones || {}))
  )
}

export function Envoltorio({ children, ruta = '/', login = false }) {
  return (
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        {login ? (
          <Routes>
            <Route path="/login" element={<p>PANTALLA DE LOGIN</p>} />
            <Route path="*" element={children} />
          </Routes>
        ) : children}
      </AuthProvider>
    </MemoryRouter>
  )
}
