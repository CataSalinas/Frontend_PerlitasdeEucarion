import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '../services/authService.js'
import {
  CLAVES_SESION,
  leerSesion,
  limpiarSesion,
  registrarCierreSesion,
  obtenerExpiracion,
  suscribirSesion,
  tokenExpirado
} from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  // Inicialización síncrona: evita el parpadeo de "/login" al recargar con sesión válida.
  const [sesion, setSesion] = useState(() => leerSesion())
  const [cargando, setCargando] = useState(true)

  // La capa API avisa cuando guarda tokens o cuando un 401 obliga a cerrar sesión.
  useEffect(() => {
    const quitarSesion = suscribirSesion((nueva) => setSesion(nueva))
    const quitarCierre = registrarCierreSesion(() => {
      setSesion(null)
      navigate('/login', { replace: true })
    })
    return () => {
      quitarSesion()
      quitarCierre()
    }
  }, [navigate])

  // Sin refresh token: una sesión vencida requiere volver a iniciar sesión.
  useEffect(() => {
    const actual = leerSesion()
    if (actual && tokenExpirado(actual.accessToken)) {
      limpiarSesion()
      navigate('/login', { replace: true })
    }
    setSesion(leerSesion())
    setCargando(false)
  }, [navigate])

  // Cierra la sesión al vencer el JWT, incluso sin nuevas peticiones.
  useEffect(() => {
    if (!sesion) return
    const exp = obtenerExpiracion(sesion.accessToken)
    if (exp === null) return
    const cerrar = () => {
      if (leerSesion()?.accessToken !== sesion.accessToken) return
      limpiarSesion()
      navigate('/login', { replace: true })
    }
    const timer = setTimeout(cerrar, Math.max(0, exp * 1000 - Date.now()))
    return () => clearTimeout(timer)
  }, [sesion, navigate])

  // Sincronización entre pestañas: si otra cierra sesión, esta también.
  useEffect(() => {
    function alCambiarAlmacenamiento(evento) {
      const claves = Object.values(CLAVES_SESION)
      if (evento.key !== null && !claves.includes(evento.key)) return

      if (!leerSesion()) {
        limpiarSesion()
        navigate('/login', { replace: true })
        return
      }
      setSesion(leerSesion())
    }

    window.addEventListener('storage', alCambiarAlmacenamiento)
    return () => window.removeEventListener('storage', alCambiarAlmacenamiento)
  }, [navigate])

  const valor = useMemo(() => ({
    usuario: sesion ? sesion.usuario : null,
    rol: sesion ? sesion.usuario.rol : null,
    accessToken: sesion ? sesion.accessToken : null,
    cargando,
    isAuthenticated: Boolean(sesion && sesion.usuario && sesion.accessToken),

    async login(correo, password) {
      const datos = await authService.login(correo, password)
      setSesion(leerSesion())
      return datos.usuario
    },

    logout() {
      limpiarSesion()
      setSesion(null)
      navigate('/login', { replace: true })
    },

    hasRole(...roles) {
      if (!sesion || !sesion.usuario) return false
      return roles.length === 0 || roles.includes(sesion.usuario.rol)
    }
  }), [sesion, cargando, navigate])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return contexto
}
