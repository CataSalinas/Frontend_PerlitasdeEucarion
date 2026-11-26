import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useRecurso } from '../hooks/useRecurso.js'
import { listarProductos, eliminarProducto } from '../services/productosService.js'
import { listarCategorias } from '../services/categoriasService.js'
import { formatearPrecio } from '../utils/validaciones.js'
import { Cargando, ErrorAviso, Vacio } from '../components/Avisos.jsx'

import { filtrarProductos } from '../utils/filtros.js'

export default function Productos() {
  const { hasRole } = useAuth()
  const ubicacion = useLocation()
  const { datos, cargando, error, recargar } = useRecurso(
    () => Promise.all([listarProductos(), listarCategorias()]),
    []
  )
  const [categoria, setCategoria] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [stock, setStock] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

  const productos = datos ? datos[0] : []
  const categorias = datos ? datos[1] : []
  const visibles = filtrarProductos(productos, { busqueda, categoria, stock })

  async function eliminar(id, nombre) {
    if (!window.confirm(`¿Eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      setErrorAccion('')
      await eliminarProducto(id)
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 titulo-gestion mb-1">Productos</h1>
          <p className="text-muted mb-0">Listado y detalle del catálogo de bisutería.</p>
        </div>
        {hasRole('ADMIN') && (
          <Link className="btn btn-perla" to="/productos/nuevo">
            <i className="bi bi-plus-lg me-1"></i>Nuevo producto
          </Link>
        )}
      </div>

      {ubicacion.state && ubicacion.state.mensaje && (
        <div className="alert alert-success" role="status">{ubicacion.state.mensaje}</div>
      )}
      <ErrorAviso error={error} />
      <ErrorAviso error={errorAccion} />

      <div className="row g-2 mb-3">
        <div className="col-12 col-sm-6 col-md-4">
          <label htmlFor="buscarProducto" className="form-label small mb-0">Buscar producto</label>
          <input id="buscarProducto" type="search" className="form-control form-control-sm" placeholder="Nombre del producto" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <label htmlFor="filtroCategoria" className="form-label small mb-0">Filtrar por categoría</label>
          <select
            id="filtroCategoria" className="form-select form-select-sm"
            value={categoria} onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <label htmlFor="filtroStock" className="form-label small mb-0">Stock</label>
          <select id="filtroStock" className="form-select form-select-sm" value={stock} onChange={(e) => setStock(e.target.value)}>
            <option value="">Todos</option>
            <option value="disponible">Disponibles</option>
            <option value="bajo">Stock bajo (1 a 4)</option>
            <option value="agotado">Agotados</option>
          </select>
        </div>
      </div>
      {!cargando && !error && productos.length > 0 && <p className="small text-muted">{visibles.length} de {productos.length} productos</p>}

      {cargando && <Cargando texto="Cargando productos..." />}
      {!cargando && !error && visibles.length === 0 && (
        <Vacio texto="No hay productos para mostrar con el filtro seleccionado." />
      )}

      {!cargando && visibles.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle tabla-gestion">
            <thead>
              <tr>
                <th>ID</th><th>Producto</th><th>Categoría</th>
                <th>Precio</th><th>Stock</th><th className="acciones-tabla">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.id}</td>
                  <td>{producto.nombre}</td>
                  <td>{producto.categoria}</td>
                  <td>{formatearPrecio(producto.precioAhora)}</td>
                  <td>
                    {producto.stock}{' '}
                    {producto.stock < 5 && <span className="badge bg-danger">Bajo</span>}
                  </td>
                  <td className="acciones-tabla">
                    <div className="d-flex gap-2 flex-wrap">
                      <Link className="btn btn-sm btn-outline-perla" to={`/productos/${producto.id}`}>Ver</Link>
                      {hasRole('ADMIN') && (
                        <>
                          <Link className="btn btn-sm btn-outline-perla" to={`/productos/${producto.id}/editar`}>Editar</Link>
                          <button
                            type="button" className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminar(producto.id, producto.nombre)}
                          >Eliminar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
