import { useState } from 'react'
import { useRecurso } from '../hooks/useRecurso.js'
import {
  listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria
} from '../services/categoriasService.js'
import { validarTexto } from '../utils/validaciones.js'
import { Cargando, ErrorAviso, Vacio } from '../components/Avisos.jsx'

export default function Categorias() {
  const { datos, cargando, error, recargar } = useRecurso(listarCategorias, [])
  const [nombre, setNombre] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

  const categorias = datos || []

  async function guardar(evento) {
    evento.preventDefault()
    if (!validarTexto(nombre)) {
      setErrorFormulario('Debe ingresar un nombre para la categoría.')
      return
    }
    setErrorFormulario('')
    setErrorAccion('')
    try {
      if (editandoId) await actualizarCategoria(editandoId, nombre.trim())
      else await crearCategoria(nombre.trim())
      setNombre('')
      setEditandoId(null)
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  function empezarEdicion(categoria) {
    setEditandoId(categoria.id)
    setNombre(categoria.nombre)
    setErrorFormulario('')
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setNombre('')
  }

  async function eliminar(categoria) {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return
    try {
      setErrorAccion('')
      await eliminarCategoria(categoria.id)
      if (editandoId === categoria.id) cancelarEdicion()
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  return (
    <>
      <h1 className="h3 titulo-gestion mb-1">Categorías</h1>
      <p className="text-muted mb-4">Administre las categorías disponibles para los productos.</p>

      <ErrorAviso error={error} />
      <ErrorAviso error={errorFormulario} />
      <ErrorAviso error={errorAccion} />

      <div className="row g-4">
        <div className="col-12 col-md-5">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 titulo-gestion">
                {editandoId ? `Editar categoría #${editandoId}` : 'Nueva categoría'}
              </h2>
              <form onSubmit={guardar} noValidate>
                <div className="mb-3">
                  <label htmlFor="nombreCategoria" className="form-label">Nombre</label>
                  <input id="nombreCategoria" className="form-control" value={nombre}
                    onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Colgantes" />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-perla">Guardar</button>
                  {editandoId && (
                    <button type="button" className="btn btn-outline-secondary" onClick={cancelarEdicion}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-7">
          {cargando && <Cargando texto="Cargando categorías..." />}
          {!cargando && !error && categorias.length === 0 && (
            <Vacio texto="Todavía no hay categorías registradas." />
          )}
          {!cargando && categorias.length > 0 && (
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle tabla-gestion">
                <thead><tr><th>ID</th><th>Nombre</th><th className="acciones-tabla">Acciones</th></tr></thead>
                <tbody>
                  {categorias.map((categoria) => (
                    <tr key={categoria.id}>
                      <td>{categoria.id}</td>
                      <td>{categoria.nombre}</td>
                      <td className="acciones-tabla">
                        <div className="d-flex gap-2 flex-wrap">
                          <button type="button" className="btn btn-sm btn-outline-perla"
                            onClick={() => empezarEdicion(categoria)}>Editar</button>
                          <button type="button" className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminar(categoria)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
