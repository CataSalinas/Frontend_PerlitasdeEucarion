import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRecurso } from '../hooks/useRecurso.js'
import { listarProductos } from '../services/productosService.js'
import { crearBoleta } from '../services/boletasService.js'
import { regiones, comunas } from '../data/zonas.js'
import { formatearPrecio, validarCantidad, validarCorreo, validarTexto } from '../utils/validaciones.js'
import { Cargando, ErrorAviso, Vacio } from '../components/Avisos.jsx'

const CLIENTE_VACIO = {
  clienteNombre: '', clienteApellidos: '', clienteCorreo: '',
  calle: '', numeroCasa: '', regionId: '', comunaId: '', indicaciones: ''
}

/**
 * Adaptación del antiguo Checkout como pantalla interna: el ADMIN selecciona
 * productos y cantidades, valida stock y registra la venta. El total definitivo
 * lo calcula el servidor (aquí solo se muestra un estimado).
 */
export default function NuevaOrden() {
  const navigate = useNavigate()
  const { datos: productos, cargando, error } = useRecurso(listarProductos, [])
  const [seleccion, setSeleccion] = useState({ productoId: '', cantidad: '1' })
  const [items, setItems] = useState([])
  const [cliente, setCliente] = useState(CLIENTE_VACIO)
  const [errores, setErrores] = useState({})
  const [errorAccion, setErrorAccion] = useState('')
  const [guardando, setGuardando] = useState(false)

  const lista = productos || []
  const comunasFiltradas = comunas.filter((c) => c.id_region === Number(cliente.regionId))
  const totalEstimado = items.reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0)

  function agregarItem(evento) {
    evento.preventDefault()
    setErrorAccion('')
    const producto = lista.find((p) => p.id === Number(seleccion.productoId))
    const cantidad = Number(seleccion.cantidad)
    if (!producto) {
      setErrorAccion('Seleccione un producto.')
      return
    }
    if (!validarCantidad(seleccion.cantidad)) {
      setErrorAccion('La cantidad debe ser un entero positivo.')
      return
    }
    const yaSeleccionado = items.find((i) => i.productoId === producto.id)
    if ((yaSeleccionado ? yaSeleccionado.cantidad : 0) + cantidad > producto.stock) {
      setErrorAccion(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}.`)
      return
    }

    if (yaSeleccionado) {
      setItems(items.map((i) => i.productoId === producto.id
        ? { ...i, cantidad: i.cantidad + cantidad }
        : i))
    } else {
      setItems([...items, {
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad,
        precioUnitario: producto.precioAhora
      }])
    }
    setSeleccion({ productoId: '', cantidad: '1' })
  }

  function cambiarCantidad(productoId, valor) {
    setErrorAccion('')
    const cantidad = Number(valor)
    const producto = lista.find((p) => p.id === productoId)
    if (!validarCantidad(valor) || !producto || cantidad > producto.stock) {
      setErrorAccion(`La cantidad debe estar entre 1 y ${producto ? producto.stock : 0}.`)
      return
    }
    setItems(items.map((i) => i.productoId === productoId ? { ...i, cantidad } : i))
  }

  function manejarCliente(evento) {
    setCliente({ ...cliente, [evento.target.name]: evento.target.value })
  }

  function cambiarRegion(evento) {
    setCliente({ ...cliente, regionId: evento.target.value, comunaId: '' })
  }

  async function registrar(evento) {
    evento.preventDefault()
    const nuevos = {}
    if (items.length === 0) nuevos.items = 'Debe agregar al menos un producto.'
    if (!validarTexto(cliente.clienteNombre)) nuevos.clienteNombre = 'Ingrese el nombre.'
    if (!validarTexto(cliente.clienteApellidos)) nuevos.clienteApellidos = 'Ingrese los apellidos.'
    if (!validarCorreo(cliente.clienteCorreo)) nuevos.clienteCorreo = 'Ingrese un correo válido.'
    if (!validarTexto(cliente.calle)) nuevos.calle = 'Ingrese la calle.'
    if (!validarTexto(cliente.numeroCasa)) nuevos.numeroCasa = 'Ingrese el número.'
    if (!cliente.regionId) nuevos.regionId = 'Seleccione una región.'
    if (!cliente.comunaId) nuevos.comunaId = 'Seleccione una comuna.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const cuerpo = {
      clienteNombre: cliente.clienteNombre.trim(),
      clienteApellidos: cliente.clienteApellidos.trim(),
      clienteCorreo: cliente.clienteCorreo.trim(),
      calle: cliente.calle.trim(),
      numeroCasa: cliente.numeroCasa.trim(),
      regionId: Number(cliente.regionId),
      comunaId: Number(cliente.comunaId),
      indicaciones: (cliente.indicaciones || '').trim(),
      items: items.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad }))
    }

    setGuardando(true)
    setErrorAccion('')
    try {
      const boleta = await crearBoleta(cuerpo)
      navigate('/ordenes', {
        state: {
          mensaje: `Venta #${boleta.id} registrada. Total confirmado por el servidor: ${formatearPrecio(boleta.total)}.`
        }
      })
    } catch (e) {
      setErrorAccion(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <h1 className="h3 titulo-gestion mb-1">Registrar venta</h1>
      <p className="text-muted mb-4">Seleccione productos, ingrese los datos de entrega y confirme la boleta.</p>

      <ErrorAviso error={error} />
      <ErrorAviso error={errorAccion} />

      {cargando && <Cargando texto="Cargando catálogo..." />}
      {!cargando && !error && lista.length === 0 && <Vacio texto="No hay productos disponibles para vender." />}

      {!cargando && lista.length > 0 && (
        <form onSubmit={registrar} noValidate>
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="h5 titulo-gestion">1. Productos</h2>
              <div className="row g-2 align-items-end">
                <div className="col-12 col-md-7">
                  <label htmlFor="productoVenta" className="form-label">Producto</label>
                  <select id="productoVenta" className="form-select" value={seleccion.productoId}
                    onChange={(e) => setSeleccion({ ...seleccion, productoId: e.target.value })}>
                    <option value="">Seleccione un producto</option>
                    {lista.map((producto) => (
                      <option key={producto.id} value={producto.id} disabled={producto.stock === 0}>
                        {producto.nombre} — {formatearPrecio(producto.precioAhora)} (stock: {producto.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <label htmlFor="cantidadVenta" className="form-label">Cantidad</label>
                  <input id="cantidadVenta" type="number" min="1" className="form-control"
                    value={seleccion.cantidad}
                    onChange={(e) => setSeleccion({ ...seleccion, cantidad: e.target.value })} />
                </div>
                <div className="col-6 col-md-2">
                  <button type="button" className="btn btn-perla w-100" onClick={agregarItem}>Agregar</button>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="text-muted mt-3 mb-0">Aún no ha agregado productos a la venta.</p>
              ) : (
                <div className="table-responsive mt-3">
                  <table className="table table-sm align-middle tabla-gestion">
                    <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.productoId}>
                          <td>{item.productoNombre}</td>
                          <td style={{ width: '100px' }}>
                            <input type="number" min="1" className="form-control form-control-sm"
                              aria-label={`Cantidad de ${item.productoNombre}`}
                              value={item.cantidad}
                              onChange={(e) => cambiarCantidad(item.productoId, e.target.value)} />
                          </td>
                          <td>{formatearPrecio(item.precioUnitario)}</td>
                          <td>{formatearPrecio(item.precioUnitario * item.cantidad)}</td>
                          <td>
                            <button type="button" className="btn btn-sm btn-outline-danger"
                              onClick={() => setItems(items.filter((i) => i.productoId !== item.productoId))}>
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {errores.items && <div className="mensaje-error">{errores.items}</div>}
              <p className="text-end resumen-total mb-0">
                Total estimado: <strong>{formatearPrecio(totalEstimado)}</strong>
              </p>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h2 className="h5 titulo-gestion">2. Datos del cliente y entrega</h2>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="clienteNombre" className="form-label">Nombre</label>
                  <input id="clienteNombre" name="clienteNombre" className="form-control"
                    value={cliente.clienteNombre} onChange={manejarCliente} />
                  {errores.clienteNombre && <div className="mensaje-error">{errores.clienteNombre}</div>}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="clienteApellidos" className="form-label">Apellidos</label>
                  <input id="clienteApellidos" name="clienteApellidos" className="form-control"
                    value={cliente.clienteApellidos} onChange={manejarCliente} />
                  {errores.clienteApellidos && <div className="mensaje-error">{errores.clienteApellidos}</div>}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="clienteCorreo" className="form-label">Correo</label>
                  <input id="clienteCorreo" name="clienteCorreo" type="email" className="form-control"
                    value={cliente.clienteCorreo} onChange={manejarCliente} />
                  {errores.clienteCorreo && <div className="mensaje-error">{errores.clienteCorreo}</div>}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="calle" className="form-label">Calle</label>
                  <input id="calle" name="calle" className="form-control" value={cliente.calle} onChange={manejarCliente} />
                  {errores.calle && <div className="mensaje-error">{errores.calle}</div>}
                </div>
                <div className="col-12 col-md-4 mb-3">
                  <label htmlFor="numeroCasa" className="form-label">Número de casa</label>
                  <input id="numeroCasa" name="numeroCasa" className="form-control"
                    value={cliente.numeroCasa} onChange={manejarCliente} />
                  {errores.numeroCasa && <div className="mensaje-error">{errores.numeroCasa}</div>}
                </div>
                <div className="col-12 col-md-4 mb-3">
                  <label htmlFor="regionId" className="form-label">Región</label>
                  <select id="regionId" name="regionId" className="form-select" value={cliente.regionId}
                    onChange={cambiarRegion}>
                    <option value="">Seleccione una región</option>
                    {regiones.map((region) => <option key={region.id} value={region.id}>{region.nombre}</option>)}
                  </select>
                  {errores.regionId && <div className="mensaje-error">{errores.regionId}</div>}
                </div>
                <div className="col-12 col-md-4 mb-3">
                  <label htmlFor="comunaId" className="form-label">Comuna</label>
                  <select id="comunaId" name="comunaId" className="form-select" value={cliente.comunaId}
                    onChange={manejarCliente} disabled={!cliente.regionId}>
                    <option value="">Seleccione una comuna</option>
                    {comunasFiltradas.map((comuna) => <option key={comuna.id} value={comuna.id}>{comuna.nombre}</option>)}
                  </select>
                  {errores.comunaId && <div className="mensaje-error">{errores.comunaId}</div>}
                </div>
                <div className="col-12 mb-3">
                  <label htmlFor="indicaciones" className="form-label">Indicaciones (opcional)</label>
                  <textarea id="indicaciones" name="indicaciones" rows="2" className="form-control"
                    value={cliente.indicaciones} onChange={manejarCliente} />
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to="/ordenes">Cancelar</Link>
            <button type="submit" className="btn btn-perla" disabled={guardando}>
              {guardando ? 'Registrando...' : 'Registrar venta'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
