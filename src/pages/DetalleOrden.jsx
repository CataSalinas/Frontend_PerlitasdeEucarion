import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useRecurso } from '../hooks/useRecurso.js'
import { obtenerBoleta, cambiarEstadoBoleta, anularBoleta } from '../services/boletasService.js'
import { regiones, comunas } from '../data/zonas.js'
import { claseEstado, etiquetaEstado, formatearPrecio } from '../utils/validaciones.js'
import { Cargando, ErrorAviso } from '../components/Avisos.jsx'

const ESTADOS = ['PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']

function nombreZona(lista, id) {
  const encontrado = lista.find((item) => item.id === Number(id))
  return encontrado ? encontrado.nombre : 'No indicada'
}

export default function DetalleOrden() {
  const { id } = useParams()
  const { hasRole } = useAuth()
  const { datos: boleta, cargando, error, recargar } = useRecurso(() => obtenerBoleta(id), [id])
  const [errorAccion, setErrorAccion] = useState('')

  async function cambiarEstado(estado) {
    if (estado === 'CANCELADO' && !window.confirm(`¿Anular la boleta #${id}? Se devolverá el stock.`)) return
    try {
      setErrorAccion('')
      await cambiarEstadoBoleta(id, estado)
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  async function anular() {
    if (!window.confirm(`¿Anular la boleta #${id}? Se devolverá el stock.`)) return
    try {
      setErrorAccion('')
      await anularBoleta(id)
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  if (cargando) return <Cargando texto="Cargando boleta..." />
  if (error) return <ErrorAviso error={error} />
  if (!boleta) return null

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 titulo-gestion mb-1">Boleta #{boleta.id}</h1>
          <p className="text-muted mb-0">
            Fecha: {boleta.fecha && /^\d{4}-\d{2}-\d{2}$/.test(boleta.fecha) ? boleta.fecha.split('-').reverse().join('-') : new Date(boleta.fecha).toLocaleString('es-CL')} · Vendida por: {boleta.usuarioNombre}
          </p>
        </div>
        <span className={'badge ' + claseEstado(boleta.estado)}>{etiquetaEstado(boleta.estado)}</span>
      </div>

      <ErrorAviso error={errorAccion} />
      {hasRole('ADMIN') && (
        <div className="card mb-4">
          <div className="card-body d-flex flex-wrap gap-2 align-items-center">
            <label htmlFor="estadoBoleta" className="form-label mb-0">Cambiar estado:</label>
            <select id="estadoBoleta" className="form-select form-select-sm" style={{ width: '190px' }}
              value={boleta.estado} disabled={boleta.estado === 'CANCELADO'} onChange={(e) => cambiarEstado(e.target.value)}>
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>{etiquetaEstado(estado)}</option>
              ))}
            </select>
            {boleta.estado !== 'CANCELADO' && (
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={anular}>Anular boleta</button>
            )}
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h5 titulo-gestion">Datos del cliente</h2>
              <p className="mb-1"><strong>Nombre:</strong> {boleta.clienteNombre} {boleta.clienteApellidos}</p>
              <p className="mb-1"><strong>Correo:</strong> {boleta.clienteCorreo}</p>
              <p className="mb-1"><strong>Dirección:</strong> {boleta.calle} {boleta.numeroCasa}</p>
              <p className="mb-1"><strong>Región:</strong> {nombreZona(regiones, boleta.regionId)}</p>
              <p className="mb-1"><strong>Comuna:</strong> {nombreZona(comunas, boleta.comunaId)}</p>
              <p className="mb-0"><strong>Indicaciones:</strong> {boleta.indicaciones || 'Sin indicaciones'}</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h5 titulo-gestion">Detalle de la venta</h2>
              <div className="table-responsive">
                <table className="table table-sm align-middle tabla-gestion">
                  <thead>
                    <tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {boleta.detalles.map((detalle, indice) => (
                      <tr key={`${detalle.productoId}-${indice}`}>
                        <td>{detalle.productoNombre}</td>
                        <td>{detalle.cantidad}</td>
                        <td>{formatearPrecio(detalle.precioUnitario)}</td>
                        <td>{formatearPrecio(detalle.precioUnitario * detalle.cantidad)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-end resumen-total mb-0">
                Total: <strong>{formatearPrecio(boleta.total)}</strong>
              </p>
              <small className="text-muted d-block text-end">
                El total fue calculado por el servidor al registrar la venta.
              </small>
            </div>
          </div>
        </div>
      </div>

      <Link className="btn btn-outline-secondary mt-4" to="/ordenes">Volver a órdenes</Link>
    </>
  )
}
