export function Cargando({ texto = 'Cargando...' }) {
  return (
    <p className="text-muted d-flex align-items-center gap-2" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {texto}
    </p>
  )
}

export function ErrorAviso({ error }) {
  if (!error) return null
  return <div className="alert alert-danger" role="alert">{error}</div>
}

export function Vacio({ texto }) {
  return <div className="alert alert-info">{texto}</div>
}
