import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRecurso } from '../hooks/useRecurso.js'
import { listarCategorias } from '../services/categoriasService.js'
import { crearProducto, actualizarProducto, obtenerProducto } from '../services/productosService.js'
import { validarNoNegativo, validarTexto } from '../utils/validaciones.js'
import { Cargando, ErrorAviso } from '../components/Avisos.jsx'

const VACIO = {
  nombre: '', descripcion: '', precioAntes: '', precioAhora: '', stock: '', categoriaId: ''
}

export default function FormularioProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)
  const { datos, cargando, error } = useRecurso(
    () => Promise.all([listarCategorias(), esEdicion ? obtenerProducto(id) : Promise.resolve(null)]),
    [id]
  )
  const [formulario, setFormulario] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [errorEnvio, setErrorEnvio] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!datos) return
    const producto = datos[1]
    if (producto) {
      setFormulario({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precioAntes: String(producto.precioAntes),
        precioAhora: String(producto.precioAhora),
        stock: String(producto.stock),
        categoriaId: String(producto.categoriaId)
      })
    }
  }, [datos])

  function manejarCambio(evento) {
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value })
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    const nuevos = {}
    if (!validarTexto(formulario.nombre)) nuevos.nombre = 'Debe ingresar un nombre.'
    if (!formulario.categoriaId) nuevos.categoriaId = 'Debe seleccionar una categoría.'
    if (!validarNoNegativo(formulario.precioAntes)) nuevos.precioAntes = 'Ingrese un precio válido (0 o más).'
    if (!validarNoNegativo(formulario.precioAhora)) nuevos.precioAhora = 'Ingrese un precio válido (0 o más).'
    if (!validarNoNegativo(formulario.stock)) nuevos.stock = 'Ingrese un stock válido (0 o más).'
    if (!nuevos.precioAntes && !nuevos.precioAhora &&
        Number(formulario.precioAhora) > Number(formulario.precioAntes)) {
      nuevos.precioAhora = 'El precio actual no puede ser mayor al precio anterior.'
    }
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const cuerpo = {
      nombre: formulario.nombre.trim(),
      descripcion: (formulario.descripcion || '').trim(),
      precioAntes: Number(formulario.precioAntes),
      precioAhora: Number(formulario.precioAhora),
      stock: Number(formulario.stock),
      categoriaId: Number(formulario.categoriaId)
    }

    setGuardando(true)
    setErrorEnvio('')
    try {
      if (esEdicion) await actualizarProducto(id, cuerpo)
      else await crearProducto(cuerpo)
      navigate('/productos', {
        state: { mensaje: esEdicion ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.' }
      })
    } catch (e) {
      setErrorEnvio(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const categorias = datos ? datos[0] : []

  if (cargando) return <Cargando texto="Cargando formulario..." />
  if (error) return <ErrorAviso error={error} />

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <h1 className="h3 titulo-gestion mb-3">
          {esEdicion ? `Editar producto #${id}` : 'Registrar producto'}
        </h1>
        <ErrorAviso error={errorEnvio} />

        <form onSubmit={manejarEnvio} noValidate>
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label">Nombre</label>
            <input id="nombre" name="nombre" className={'form-control' + (errores.nombre ? ' is-invalid' : '')}
              value={formulario.nombre} onChange={manejarCambio} />
            {errores.nombre && <div className="mensaje-error">{errores.nombre}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="descripcion" className="form-label">Descripción</label>
            <textarea id="descripcion" name="descripcion" rows="3" className="form-control"
              value={formulario.descripcion} onChange={manejarCambio} />
          </div>

          <div className="mb-3">
            <label htmlFor="categoriaId" className="form-label">Categoría</label>
            <select id="categoriaId" name="categoriaId"
              className={'form-select' + (errores.categoriaId ? ' is-invalid' : '')}
              value={formulario.categoriaId} onChange={manejarCambio}>
              <option value="">Seleccione una categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {errores.categoriaId && <div className="mensaje-error">{errores.categoriaId}</div>}
          </div>

          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <label htmlFor="precioAntes" className="form-label">Precio anterior</label>
              <input id="precioAntes" name="precioAntes" type="number" min="0"
                className={'form-control' + (errores.precioAntes ? ' is-invalid' : '')}
                value={formulario.precioAntes} onChange={manejarCambio} />
              {errores.precioAntes && <div className="mensaje-error">{errores.precioAntes}</div>}
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label htmlFor="precioAhora" className="form-label">Precio actual</label>
              <input id="precioAhora" name="precioAhora" type="number" min="0"
                className={'form-control' + (errores.precioAhora ? ' is-invalid' : '')}
                value={formulario.precioAhora} onChange={manejarCambio} />
              {errores.precioAhora && <div className="mensaje-error">{errores.precioAhora}</div>}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="stock" className="form-label">Stock</label>
            <input id="stock" name="stock" type="number" min="0"
              className={'form-control' + (errores.stock ? ' is-invalid' : '')}
              value={formulario.stock} onChange={manejarCambio} />
            {errores.stock && <div className="mensaje-error">{errores.stock}</div>}
          </div>

          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to="/productos">Cancelar</Link>
            <button type="submit" className="btn btn-perla" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
