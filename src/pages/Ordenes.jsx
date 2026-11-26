import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useRecurso } from '../hooks/useRecurso.js'
import { listarBoletas, cambiarEstadoBoleta, anularBoleta } from '../services/boletasService.js'
import { claseEstado, etiquetaEstado, formatearPrecio } from '../utils/validaciones.js'
import { Cargando, ErrorAviso, Vacio } from '../components/Avisos.jsx'

import { filtrarOrdenes } from '../utils/filtros.js'

export const ESTADOS = ['PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']

export function formatearFecha(fecha) {
  if (!fecha) return '-'
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha.split('-').reverse().join('-')
  const fechaObjeto = new Date(fecha)
  return Number.isNaN(fechaObjeto.getTime()) ? fecha : fechaObjeto.toLocaleString('es-CL')
}

export default function Ordenes() {
  const { hasRole } = useAuth()
  const ubicacion = useLocation()
  const { datos, cargando, error, recargar } = useRecurso(listarBoletas, [])
  const [errorAccion, setErrorAccion] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('')
  const [orden, setOrden] = useState('recientes')
  const boletas = datos || []
  const visibles = filtrarOrdenes(boletas, { busqueda, estado, orden })

  async function cambiarEstado(id, estado) {
    if (estado === 'CANCELADO' && !window.confirm(`¿Anular la boleta #${id}? Se devolverá el stock.`)) return
    try {
      setErrorAccion('')
      await cambiarEstadoBoleta(id, estado)
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  async function anular(boleta) {
    if (!window.confirm(`¿Anular la boleta #${boleta.id}? Se devolverá el stock de sus productos.`)) return
    try {
      setErrorAccion('')
      await anularBoleta(boleta.id)
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 titulo-gestion mb-1">Órdenes / boletas</h1>
          <p className="text-muted mb-0">Consulte ventas registradas y su estado.</p>
        </div>
        {hasRole('ADMIN') && (
          <Link className="btn btn-perla" to="/ordenes/nueva">
            <i className="bi bi-plus-lg me-1"></i>Registrar venta
          </Link>
        )}
      </div>

      {ubicacion.state && ubicacion.state.mensaje && (
        <div className="alert alert-success" role="status">{ubicacion.state.mensaje}</div>
      )}
      <ErrorAviso error={error} />
      <ErrorAviso error={errorAccion} />

      <div className="row g-2 mb-3 align-items-end">
        <div className="col-12 col-md-5">
          <label htmlFor="buscarOrden" className="form-label small mb-0">Buscar orden</label>
          <input id="buscarOrden" type="search" className="form-control form-control-sm" placeholder="N° de boleta, cliente o correo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label htmlFor="filtroEstado" className="form-label small mb-0">Estado</label>
          <select id="filtroEstado" className="form-select form-select-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{etiquetaEstado(e)}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-4">
          <label htmlFor="ordenFecha" className="form-label small mb-0">Ordenar por</label>
          <select id="ordenFecha" className="form-select form-select-sm" value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="recientes">Más recientes</option>
            <option value="antiguas">Más antiguas</option>
          </select>
        </div>
      </div>
      {!cargando && !error && boletas.length > 0 && <p className="small text-muted">{visibles.length} de {boletas.length} órdenes</p>}
      {!cargando && !error && boletas.length > 0 && visibles.length === 0 && <Vacio texto="No se encontraron órdenes con estos filtros." />}
      {cargando && <Cargando texto="Cargando órdenes..." />}
      {!cargando && !error && boletas.length === 0 && (
        <Vacio texto="No hay órdenes registradas todavía." />
      )}

      {!cargando && visibles.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle tabla-gestion">
            <thead>
              <tr>
                <th>#</th><th>Fecha</th><th>Cliente</th><th>Vendida por</th>
                <th>Total</th><th>Estado</th><th className="acciones-tabla">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((boleta) => (
                <tr key={boleta.id}>
                  <td>{boleta.id}</td>
                  <td>{formatearFecha(boleta.fecha)}</td>
                  <td>{boleta.clienteNombre} {boleta.clienteApellidos}</td>
                  <td>{boleta.usuarioNombre}</td>
                  <td>{formatearPrecio(boleta.total)}</td>
                  <td>
                    <span className={'badge ' + claseEstado(boleta.estado)}>
                      {etiquetaEstado(boleta.estado)}
                    </span>
                  </td>
                  <td className="acciones-tabla">
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                      <Link className="btn btn-sm btn-outline-perla" to={`/ordenes/${boleta.id}`}>Ver</Link>
                      {hasRole('ADMIN') && (
                        <>
                          <select
                            aria-label={`Cambiar estado de la boleta ${boleta.id}`}
                            className="form-select form-select-sm" style={{ width: '150px' }}
                            value={boleta.estado}
                            disabled={boleta.estado === 'CANCELADO'}
                            onChange={(e) => cambiarEstado(boleta.id, e.target.value)}
                          >
                            {ESTADOS.map((estado) => (
                              <option key={estado} value={estado}>{etiquetaEstado(estado)}</option>
                            ))}
                          </select>
                          {boleta.estado !== 'CANCELADO' && (
                            <button type="button" className="btn btn-sm btn-outline-danger"
                              onClick={() => anular(boleta)}>Anular</button>
                          )}
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
