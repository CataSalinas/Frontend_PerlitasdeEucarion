import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useRecurso } from '../hooks/useRecurso.js'
import { obtenerProducto, eliminarProducto } from '../services/productosService.js'
import { formatearPrecio } from '../utils/validaciones.js'
import { Cargando, ErrorAviso } from '../components/Avisos.jsx'

export default function DetalleProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const { datos, cargando, error, recargar } = useRecurso(() => obtenerProducto(id), [id])
  const [errorAccion, setErrorAccion] = useState('')

  async function eliminar() {
    if (!window.confirm(`¿Eliminar el producto "${datos.nombre}"?`)) return
    try {
      await eliminarProducto(id)
      navigate('/productos', { state: { mensaje: 'Producto eliminado correctamente.' } })
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  if (cargando) return <Cargando texto="Cargando producto..." />
  if (error) return <ErrorAviso error={error} />
  if (!datos) return null

  return (
    <>
      <h1 className="h3 titulo-gestion mb-3">Producto #{datos.id} · {datos.nombre}</h1>
      <ErrorAviso error={errorAccion} />

      <div className="card">
        <div className="card-body">
          <p><strong>Categoría:</strong> {datos.categoria}</p>
          <p><strong>Descripción:</strong> {datos.descripcion || 'Sin descripción'}</p>
          <p><strong>Precio anterior:</strong> {formatearPrecio(datos.precioAntes)}</p>
          <p><strong>Precio actual:</strong> {formatearPrecio(datos.precioAhora)}</p>
          <p>
            <strong>Stock:</strong> {datos.stock}{' '}
            {datos.stock < 5 && <span className="badge bg-danger">Stock bajo</span>}
          </p>
          <div className="d-flex gap-2 flex-wrap">
            <Link className="btn btn-outline-secondary" to="/productos">Volver</Link>
            {hasRole('ADMIN') && (
              <>
                <Link className="btn btn-perla" to={`/productos/${datos.id}/editar`}>Editar</Link>
                <button type="button" className="btn btn-outline-danger" onClick={eliminar}>Eliminar</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
