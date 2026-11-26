import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useRecurso } from '../hooks/useRecurso.js'
import {
  listarUsuarios, crearUsuario, actualizarUsuario, darBajaUsuario
} from '../services/usuariosService.js'
import { validarCorreo, validarTexto } from '../utils/validaciones.js'
import { Cargando, ErrorAviso, Vacio } from '../components/Avisos.jsx'

const NUEVO_VACIO = { nombre: '', apellidos: '', correo: '', password: '', rol: 'VENDEDOR' }

export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const { datos, cargando, error, recargar } = useRecurso(listarUsuarios, [])
  const [nuevo, setNuevo] = useState(NUEVO_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [edicion, setEdicion] = useState({ nombre: '', apellidos: '', correo: '', rol: 'VENDEDOR', activo: true })
  const [errores, setErrores] = useState({})
  const [errorAccion, setErrorAccion] = useState('')

  const usuarios = datos || []
  const esYo = (usuario) => usuario.id === yo.id || usuario.nombreUsuario === (yo.nombreUsuario || yo.nombre)
  const esMiId = (id) => usuarios.some((usuario) => usuario.id === id && esYo(usuario))

  function empezarEdicion(usuario) {
    setEditandoId(usuario.id)
    setEdicion({
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      rol: usuario.rol,
      activo: usuario.activo
    })
    setErrores({})
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setErrores({})
  }

  async function crear(evento) {
    evento.preventDefault()
    const nuevosErrores = {}
    if (!validarTexto(nuevo.nombre)) nuevosErrores.nombre = 'Ingrese el nombre.'
    if (!validarTexto(nuevo.apellidos)) nuevosErrores.apellidos = 'Ingrese los apellidos.'
    if (!validarCorreo(nuevo.correo)) nuevosErrores.correo = 'Ingrese un correo válido.'
    if (!validarTexto(nuevo.password) || nuevo.password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres.'
    }
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    try {
      setErrorAccion('')
      await crearUsuario({
        nombre: nuevo.nombre.trim(),
        apellidos: nuevo.apellidos.trim(),
        correo: nuevo.correo.trim(),
        password: nuevo.password,
        rol: nuevo.rol
      })
      setNuevo(NUEVO_VACIO)
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  async function guardarEdicion(id) {
    const nuevosErrores = {}
    if (!validarTexto(edicion.nombre)) nuevosErrores.nombre = 'Ingrese el nombre.'
    if (!validarCorreo(edicion.correo)) nuevosErrores.correo = 'Ingrese un correo válido.'
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    try {
      setErrorAccion('')
      const activo = esMiId(id) ? true : edicion.activo
      await actualizarUsuario(id, {
        nombre: edicion.nombre.trim(),
        apellidos: edicion.apellidos.trim(),
        correo: edicion.correo.trim(),
        rol: edicion.rol,
        activo
      })
      cancelarEdicion()
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  async function darBaja(usuario) {
    if (esYo(usuario)) return
    if (!window.confirm(`¿Dar de baja al usuario ${usuario.nombre} ${usuario.apellidos}?`)) return
    try {
      setErrorAccion('')
      await darBajaUsuario(usuario.id)
      recargar()
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  return (
    <>
      <h1 className="h3 titulo-gestion mb-1">Usuarios del personal</h1>
      <p className="text-muted mb-4">Solo el ADMIN puede crear, editar y dar de baja a los usuarios.</p>

      <ErrorAviso error={error} />
      <ErrorAviso error={errorAccion} />

      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 titulo-gestion">Nuevo usuario</h2>
              <form onSubmit={crear} noValidate>
                <div className="mb-2">
                  <label htmlFor="nuevoNombre" className="form-label">Nombre</label>
                  <input id="nuevoNombre" className="form-control" value={nuevo.nombre}
                    onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
                  {errores.nombre && <div className="mensaje-error">{errores.nombre}</div>}
                </div>
                <div className="mb-2">
                  <label htmlFor="nuevoApellidos" className="form-label">Apellidos</label>
                  <input id="nuevoApellidos" className="form-control" value={nuevo.apellidos}
                    onChange={(e) => setNuevo({ ...nuevo, apellidos: e.target.value })} />
                  {errores.apellidos && <div className="mensaje-error">{errores.apellidos}</div>}
                </div>
                <div className="mb-2">
                  <label htmlFor="nuevoCorreo" className="form-label">Correo</label>
                  <input id="nuevoCorreo" type="email" className="form-control" value={nuevo.correo}
                    onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} />
                  {errores.correo && <div className="mensaje-error">{errores.correo}</div>}
                </div>
                <div className="mb-2">
                  <label htmlFor="nuevoPassword" className="form-label">Contraseña</label>
                  <input id="nuevoPassword" type="password" className="form-control" value={nuevo.password}
                    onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} />
                  {errores.password && <div className="mensaje-error">{errores.password}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="nuevoRol" className="form-label">Rol</label>
                  <select id="nuevoRol" className="form-select" value={nuevo.rol}
                    onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>
                    <option value="VENDEDOR">VENDEDOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-perla">Crear usuario</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          {cargando && <Cargando texto="Cargando usuarios..." />}
          {!cargando && !error && usuarios.length === 0 && <Vacio texto="No hay usuarios registrados." />}
          {!cargando && usuarios.length > 0 && (
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle tabla-gestion">
                <thead>
                  <tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Activo</th><th className="acciones-tabla">Acciones</th></tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      {editandoId === usuario.id ? (
                        <>
                          <td>{usuario.id}</td>
                          <td>
                            <input className="form-control form-control-sm mb-1" aria-label="Nombre"
                              value={edicion.nombre} onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })} />
                            <input className="form-control form-control-sm" aria-label="Apellidos"
                              value={edicion.apellidos} onChange={(e) => setEdicion({ ...edicion, apellidos: e.target.value })} />
                          </td>
                          <td>
                            <input className="form-control form-control-sm" aria-label="Correo"
                              value={edicion.correo} onChange={(e) => setEdicion({ ...edicion, correo: e.target.value })} />
                          </td>
                          <td>
                            <select className="form-select form-select-sm" aria-label="Rol" disabled={esYo(usuario)}
                              value={edicion.rol} onChange={(e) => setEdicion({ ...edicion, rol: e.target.value })}>
                              <option value="VENDEDOR">VENDEDOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td>
                            <div className="form-check">
                              <input className="form-check-input" id={`activo-${usuario.id}`} type="checkbox"
                                checked={esYo(usuario) ? true : edicion.activo}
                                disabled={esYo(usuario)}
                                onChange={(e) => setEdicion({ ...edicion, activo: e.target.checked })} />
                            </div>
                          </td>
                          <td className="acciones-tabla">
                            <div className="d-flex gap-2 flex-wrap">
                              <button type="button" className="btn btn-sm btn-perla"
                                onClick={() => guardarEdicion(usuario.id)}>Guardar</button>
                              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancelarEdicion}>Cancelar</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{usuario.id}</td>
                          <td>
                            {usuario.nombre} {usuario.apellidos}
                            {esYo(usuario) && <span className="badge bg-perla ms-2">Usted</span>}
                          </td>
                          <td>{usuario.correo}</td>
                          <td>{usuario.rol}</td>
                          <td>
                            <span className={'badge ' + (usuario.activo ? 'bg-success' : 'bg-secondary')}>
                              {usuario.activo ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td className="acciones-tabla">
                            <div className="d-flex gap-2 flex-wrap">
                              <button type="button" className="btn btn-sm btn-outline-perla"
                                onClick={() => empezarEdicion(usuario)}>Editar</button>
                              <button type="button" className="btn btn-sm btn-outline-danger"
                                disabled={esYo(usuario)}
                                title={esYo(usuario) ? 'No puede dar de baja su propio usuario' : ''}
                                onClick={() => darBaja(usuario)}>Dar de baja</button>
                            </div>
                          </td>
                        </>
                      )}
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
