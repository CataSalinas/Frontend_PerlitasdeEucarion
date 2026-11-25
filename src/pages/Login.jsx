import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { validarTexto } from '../utils/validaciones.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [datos, setDatos] = useState({ correo: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function manejarCambio(evento) {
    setDatos({ ...datos, [evento.target.name]: evento.target.value })
    setErrorGeneral('')
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    const nuevosErrores = {}
    if (!validarTexto(datos.correo)) nuevosErrores.correo = 'Debe ingresar su correo.'
    if (!validarTexto(datos.password)) nuevosErrores.password = 'Debe ingresar su contraseña.'
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setEnviando(true)
    try {
      await login(datos.correo.trim(), datos.password)
      navigate('/panel', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        setErrorGeneral('Correo o contraseña incorrectos.')
      } else if (error.status === 0) {
        setErrorGeneral('No se pudo conectar con el servidor. Intente más tarde.')
      } else {
        setErrorGeneral(error.message || 'No fue posible iniciar sesión.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="row justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
      <div className="col-12 col-sm-10 col-md-6 col-lg-4">
        <div className="card shadow-sm login-card">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <i className="bi bi-gem display-4 texto-perla"></i>
              <h1 className="h4 mt-2 titulo-gestion">Perlitas de Eucarión</h1>
              <p className="text-muted small mb-0">Acceso al sistema de gestión interna</p>
            </div>

            {errorGeneral && <div className="alert alert-danger" role="alert">{errorGeneral}</div>}

            <form onSubmit={manejarEnvio} noValidate>
              <div className="mb-3">
                <label htmlFor="correo" className="form-label">Correo</label>
                <input
                  id="correo" name="correo" type="email" autoComplete="username"
                  className={'form-control' + (errores.correo ? ' is-invalid' : '')}
                  value={datos.correo} onChange={manejarCambio}
                  placeholder="nombre@perlitas.cl"
                />
                {errores.correo && <div className="mensaje-error">{errores.correo}</div>}
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label">Contraseña</label>
                <input
                  id="password" name="password" type="password" autoComplete="current-password"
                  className={'form-control' + (errores.password ? ' is-invalid' : '')}
                  value={datos.password} onChange={manejarCambio}
                  placeholder="••••••••"
                />
                {errores.password && <div className="mensaje-error">{errores.password}</div>}
              </div>

              <button className="btn btn-perla w-100" type="submit" disabled={enviando}>
                {enviando ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
            <p className="text-center text-muted small mt-3 mb-0">
              Solo personal autorizado. Los usuarios los crea el administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
