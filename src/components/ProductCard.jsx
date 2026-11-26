import { formatearPrecio } from '../utils/validaciones.js'

export default function ProductCard({ producto, agregar, cantidad = 0 }) {
  const oferta = producto.precioAntes > producto.precioAhora
  return (
    <div className="card card-producto h-100">
      <div className="card-body d-flex flex-column">
        <small className="text-muted">{producto.categoria}</small>
        <h2 className="h5 card-title">{producto.nombre}</h2>
        <p className="card-text">{producto.descripcion}</p>
        <div className="mt-auto">
          {oferta && <p className="text-muted text-decoration-line-through mb-0">{formatearPrecio(producto.precioAntes)}</p>}
          <p className="h4 texto-perla">{formatearPrecio(producto.precioAhora)}</p>
          <p className="small text-muted">{producto.stock > 0 ? `Stock disponible: ${producto.stock}` : 'Agotado'}</p>
          <button type="button" className="btn btn-perla w-100" disabled={producto.stock <= 0 || cantidad >= producto.stock}
            onClick={() => agregar(producto)}>{producto.stock <= 0 ? 'Agotado' : cantidad >= producto.stock ? 'Sin más stock' : 'Añadir al carrito'}</button>
        </div>
      </div>
    </div>
  )
}
