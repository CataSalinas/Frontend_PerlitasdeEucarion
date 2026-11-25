import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import { Cargando } from './components/Avisos.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Panel from './pages/Panel.jsx'
import Productos from './pages/Productos.jsx'
import DetalleProducto from './pages/DetalleProducto.jsx'
import FormularioProducto from './pages/FormularioProducto.jsx'
import Categorias from './pages/Categorias.jsx'
import Ordenes from './pages/Ordenes.jsx'
import DetalleOrden from './pages/DetalleOrden.jsx'
import NuevaOrden from './pages/NuevaOrden.jsx'
import Usuarios from './pages/Usuarios.jsx'
import AccesoDenegado from './pages/AccesoDenegado.jsx'
import NoEncontrado from './pages/NoEncontrado.jsx'

const TODOS = ['ADMIN', 'VENDEDOR']
const SOLO_ADMIN = ['ADMIN']

export default function App() {
  const { cargando, isAuthenticated } = useAuth()

  // Evita el parpadeo hacia /login mientras se restaura la sesión desde localStorage.
  if (cargando) {
    return (
      <div className="container py-5 text-center" role="status">
        <div className="spinner-border text-danger" aria-hidden="true"></div>
        <p className="mt-3">Cargando sesión...</p>
      </div>
    )
  }

  return (
    <>
      {isAuthenticated && <Navbar />}
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Navigate to="/panel" replace />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/panel" replace /> : <Login />} />

          <Route element={<RutaProtegida roles={TODOS} />}>
            <Route path="/panel" element={<Panel />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/productos/:id" element={<DetalleProducto />} />
            <Route path="/ordenes" element={<Ordenes />} />
            <Route path="/ordenes/:id" element={<DetalleOrden />} />
          </Route>

          <Route element={<RutaProtegida roles={SOLO_ADMIN} />}>
            <Route path="/productos/nuevo" element={<FormularioProducto />} />
            <Route path="/productos/:id/editar" element={<FormularioProducto />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/ordenes/nueva" element={<NuevaOrden />} />
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>

          <Route path="/acceso-denegado" element={<AccesoDenegado />} />
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>
      {isAuthenticated && <Footer />}
    </>
  )
}
