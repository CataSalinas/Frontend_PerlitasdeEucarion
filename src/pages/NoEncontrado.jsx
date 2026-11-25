import { Link } from 'react-router-dom'

export default function NoEncontrado() {
  return (
    <div className="text-center py-5">
      <p className="display-6 text-muted">404</p>
      <h1 className="h3">Página no encontrada</h1>
      <p className="text-muted">La ruta solicitada no existe en el sistema de gestión.</p>
      <Link className="btn btn-perla" to="/panel">Ir al panel</Link>
    </div>
  )
}
