import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useRecurso } from '../hooks/useRecurso.js'
import { listarBoletas, cambiarEstadoBoleta, anularBoleta } from '../services/boletasService.js'
import { claseEstado, etiquetaEstado, formatearPrecio } from '../utils/validaciones.js'
import { Cargando, ErrorAviso, Vacio } from '../components/Avisos.jsx'

export const ESTADOS = ['PAGADO', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']

export function formatearFecha(fecha) {
  if (!fecha) return '-'
  const fechaObjeto = new Date(fecha)
  return Number.isNaN(fechaObjeto.getTime()) ? fecha : fechaObjeto.toLocaleString('es-CL')
}

export default function Ordenes() {
  const { hasRole } = useAuth()
  const ubicacion = useLocation()
  const { datos, cargando, error, recargar } = useRecurso(listarBoletas, [])
  const [errorAccion, setErrorAccion] = useState('')

  const boletas = datos || []

  async function cambiarEstado(id, estado) {
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

      {cargando && <Cargando texto="Cargando órdenes..." />}
      {!cargando && !error && boletas.length === 0 && (
        <Vacio texto="No hay órdenes registradas todavía." />
      )}

      {!cargando && boletas.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle tabla-gestion">
            <thead>
              <tr>
                <th>#</th><th>Fecha</th><th>Cliente</th><th>Vendida por</th>
                <th>Total</th><th>Estado</th><th className="acciones-tabla">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {boletas.map((boleta) => (
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
                      {/* VENDEDOR never ve controles de escritura: solo ADMIN puede cambiar estado/anular. */}
                      {hasRole('ADMIN') && (
                        <>
                          <select
                            aria-label={`Cambiar estado de la boleta ${boleta.id}`}
                            className="form-select form-select-sm" style={{ width: '150px' }}
                            value={boleta.estado}
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
