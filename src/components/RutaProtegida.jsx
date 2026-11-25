import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Cargando } from './Avisos.jsx'
import AccesoDenegado from '../pages/AccesoDenegado.jsx'

/**
 * Restricción de acceso en el FRONTEND.
 * Sin sesión -> /login. Con sesión pero rol no permitido -> página 403.
 * La seguridad real la impone el backend (401/403); aquí solo se ocultan pantallas.
 */
export default function RutaProtegida({ roles = [] }) {
  const { cargando, isAuthenticated, hasRole } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return <Cargando texto="Verificando sesión..." />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  if (roles.length > 0 && !hasRole(...roles)) return <AccesoDenegado />

  return <Outlet />
}
