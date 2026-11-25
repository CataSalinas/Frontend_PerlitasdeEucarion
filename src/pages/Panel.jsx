import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useRecurso } from '../hooks/useRecurso.js'
import { listarProductos } from '../services/productosService.js'
import { listarBoletas } from '../services/boletasService.js'
import { Cargando, ErrorAviso } from '../components/Avisos.jsx'

export default function Panel() {
  const { usuario, rol, hasRole } = useAuth()
  const { datos, cargando, error, recargar } = useRecurso(
    () => Promise.all([listarProductos(), listarBoletas()]),
    []
  )

  const productos = datos ? datos[0] : []
  const boletas = datos ? datos[1] : []
  const stockBajo = productos.filter((producto) => producto.stock < 5)

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 titulo-gestion mb-1">Panel de gestión</h1>
          <p className="text-muted mb-0">Bienvenido/a, {usuario.nombre}. Rol: <strong>{rol}</strong></p>
        </div>
        <button type="button" className="btn btn-outline-perla btn-sm" onClick={recargar}>
          <i className="bi bi-arrow-clockwise me-1"></i>Actualizar datos
        </button>
      </div>

      <ErrorAviso error={error} />
      {cargando && <Cargando texto="Cargando resumen..." />}

      {!cargando && !error && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card tarjeta-resumen h-100">
                <div className="card-body">
                  <p className="etiqueta-aviso text-muted mb-1">Productos registrados</p>
                  <p className="numero mb-0">{productos.length}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card tarjeta-resumen h-100">
                <div className="card-body">
                  <p className="etiqueta-aviso text-muted mb-1">Órdenes / boletas</p>
                  <p className="numero mb-0">{boletas.length}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card tarjeta-resumen h-100">
                <div className="card-body">
                  <p className="etiqueta-aviso text-muted mb-1">Productos con stock bajo (&lt; 5)</p>
                  <p className="numero mb-0">{stockBajo.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="h5 titulo-gestion">Accesos rápidos</h2>
                  <div className="d-flex flex-wrap gap-2">
                    <Link className="btn btn-outline-perla" to="/productos">Ver productos</Link>
                    <Link className="btn btn-outline-perla" to="/ordenes">Ver órdenes</Link>
                    {hasRole('ADMIN') && (
                      <>
                        <Link className="btn btn-perla" to="/productos/nuevo">Nuevo producto</Link>
                        <Link className="btn btn-perla" to="/ordenes/nueva">Registrar venta</Link>
                        <Link className="btn btn-outline-perla" to="/categorias">Categorías</Link>
                        <Link className="btn btn-outline-perla" to="/usuarios">Usuarios</Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="h5 titulo-gestion">Stock bajo</h2>
                  {stockBajo.length === 0 ? (
                    <p className="text-muted mb-0">No hay productos con stock crítico.</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {stockBajo.slice(0, 5).map((producto) => (
                        <li className="list-group-item d-flex justify-content-between" key={producto.id}>
                          <span>{producto.nombre}</span>
                          <span className="badge bg-danger">{producto.stock} uds.</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
