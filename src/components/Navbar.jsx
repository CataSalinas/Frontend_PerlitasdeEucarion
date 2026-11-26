import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ENLACES = [
  { to: '/panel', texto: 'Panel', icono: 'bi-speedometer2', roles: ['ADMIN', 'VENDEDOR'] },
  { to: '/productos', texto: 'Productos', icono: 'bi-box-seam', roles: ['ADMIN', 'VENDEDOR'] },
  { to: '/categorias', texto: 'Categorías', icono: 'bi-tags', roles: ['ADMIN'] },
  { to: '/ordenes', texto: 'Órdenes', icono: 'bi-receipt', roles: ['ADMIN', 'VENDEDOR'] },
  { to: '/ordenes/nueva', texto: 'Registrar venta', icono: 'bi-cart-plus', roles: ['ADMIN'] },
  { to: '/usuarios', texto: 'Usuarios', icono: 'bi-people', roles: ['ADMIN'] }
]

export default function Navbar() {
  const { usuario, rol, hasRole, logout } = useAuth()
  const visibles = ENLACES.filter((enlace) => hasRole(...enlace.roles))
  // Tras cerrar sesión el provider notifica el cambio antes de navegar: el
  // navbar se renderiza un instante sin usuario y no debe romperse.
  const nombre = usuario ? `${usuario.nombre ?? ''} ${usuario.apellidos ?? ''}`.trim() : ''

  return (
    <nav className="navbar navbar-expand-lg bg-perla-suave border-bottom">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/panel">
          <i className="bi bi-gem me-2"></i>Perlitas de Eucarión
          <small className="d-block small fw-normal">Gestión interna</small>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
          data-bs-target="#menuGestion" aria-controls="menuGestion" aria-label="Abrir menú">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="menuGestion">
          <ul className="navbar-nav me-auto">
            {visibles.map((enlace) => (
              <li className="nav-item" key={enlace.to}>
                <NavLink
                  to={enlace.to}
                  end={enlace.to === '/panel'}
                  className={({ isActive }) => 'nav-link' + (isActive ? ' active fw-semibold' : '')}
                >
                  <i className={'bi ' + enlace.icono + ' me-1'}></i>{enlace.texto}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span className="navbar-text small">
              {nombre}{' '}
              <span className={rol === 'ADMIN' ? 'badge bg-perla' : 'badge bg-outline-perla'}>{rol ?? ''}</span>
            </span>
            <button type="button" className="btn btn-outline-perla btn-sm" onClick={logout}>
              <i className="bi bi-box-arrow-right me-1"></i>Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
