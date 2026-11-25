import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '../services/authService.js'
import {
  CLAVES_SESION,
  leerSesion,
  limpiarSesion,
  registrarCierreSesion,
  renovarAccessToken,
  suscribirSesion,
  tokenExpirado
} from '../services/api.js'

const AuthContext = createContext(null)

/**
 * Sesión de la aplicación.
 *
 * Decisión: tokens y usuario en localStorage (prefijo `perlitas_`).
 * Ventaja: la sesión sobrevive a recargas y a pestañas nuevas.
 * Trade-off: localStorage es legible por JS, por lo que un XSS podría robar el token.
 * Una cookie HttpOnly + SameSite sería más segura, pero no la puede leer el frontend
 * y complicaría el contrato con el backend. Por eso se valida todo en el backend
 * (401/403) y el rol del frontend solo oculta controles, nunca autoriza operaciones.
 */
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

  // Restauración al montar: decodifica exp y renueva si hace falta.
  useEffect(() => {
    let activo = true

    async function restaurar() {
      const actual = leerSesion()
      if (!actual) {
        if (activo) setCargando(false)
        return
      }

      if (tokenExpirado(actual.accessToken)) {
        try {
          await renovarAccessToken()
        } catch {
          // La renovación falló (refresh inválido, red caída, etc.).
          // Limpiamos aquí también: apiFetch solo cierra la sesión cuando el
          // 401 ocurre durante una petición, pero al restaurar no hay petición.
          limpiarSesion()
          if (activo) navigate('/login', { replace: true })
        }
      }

      if (activo) {
        setSesion(leerSesion())
        setCargando(false)
      }
    }

    restaurar()
    return () => { activo = false }
  }, [])

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
    refreshToken: sesion ? sesion.refreshToken : null,
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
