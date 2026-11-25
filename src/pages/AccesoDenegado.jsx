import { Link } from 'react-router-dom'

export default function AccesoDenegado() {
  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6 text-center">
        <div className="card border-danger-subtle">
          <div className="card-body py-5">
            <p className="display-6 text-danger">403</p>
            <h1 className="h3">Acceso denegado</h1>
            <p className="text-muted">
              Su rol no tiene permisos para ver esta pantalla. Si necesita realizar esta acción,
              solicite acceso a un administrador.
            </p>
            <Link className="btn btn-perla" to="/panel">Volver al panel</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
