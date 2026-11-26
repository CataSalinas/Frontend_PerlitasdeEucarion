import { apiFetch } from './api.js'

export async function listarTienda() {
  const [productos, categorias] = await Promise.all([
    apiFetch('/productos/tienda', { auth: false }),
    apiFetch('/categorias/tienda', { auth: false })
  ])
  return productos.map((p) => {
    const categoria = categorias.find((c) => c.productoId === p.id)
    return { ...p, precioAntes: p.precioAntes ?? p.precioVenta, precioAhora: p.precioVenta,
      stock: p.stockDisponible, categoria: categoria?.nombre || 'Sin categoría' }
  })
}

export function comprarSinCuenta(datos) {
  return apiFetch('/ventas/compra', { method: 'POST', body: datos, auth: false })
}
