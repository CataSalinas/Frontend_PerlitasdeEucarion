import { apiFetch } from './api.js'

function adaptarProducto(producto, relaciones) {
  const relacion = relaciones.find((r) => r.productoId === producto.id)
  return {
    ...producto,
    precioAntes: producto.precioAntes ?? producto.precioVenta,
    precioAhora: producto.precioVenta,
    stock: producto.stockDisponible,
    categoriaId: relacion?.categoria?.id ?? '',
    categoria: relacion?.categoria?.nombre ?? 'Sin categoría'
  }
}

function prepararProducto(datos, activo = true) {
  return {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    precioAntes: datos.precioAntes,
    precioVenta: datos.precioAhora,
    stockDisponible: datos.stock,
    activo
  }
}

export async function listarProductos() {
  const [productos, relaciones] = await Promise.all([
    apiFetch('/productos'),
    apiFetch('/categorias/relaciones')
  ])
  return productos.map((producto) => adaptarProducto(producto, relaciones))
}

export async function obtenerProducto(id) {
  const [producto, relaciones] = await Promise.all([
    apiFetch(`/productos/${id}`),
    apiFetch('/categorias/relaciones')
  ])
  return adaptarProducto(producto, relaciones)
}

function asignarCategoria(id, categoriaId) {
  return apiFetch(`/categorias/relaciones/${id}?categoriaId=${categoriaId}`, { method: 'PUT' })
}

export async function crearProducto(datos) {
  const producto = await apiFetch('/productos', { method: 'POST', body: prepararProducto(datos) })
  try {
    await asignarCategoria(producto.id, datos.categoriaId)
  } catch (error) {
    try { await apiFetch(`/productos/${producto.id}`, { method: 'DELETE' }) } catch {
      throw new Error('El producto se creó, pero no se pudo asignar su categoría. Revise el listado antes de reintentar.')
    }
    throw error
  }
  return adaptarProducto(producto, [{ productoId: producto.id, categoria: await apiFetch(`/categorias/${datos.categoriaId}`) }])
}

export async function actualizarProducto(id, datos) {
  const anterior = await apiFetch(`/productos/${id}`)
  const producto = await apiFetch(`/productos/${id}`, {
    method: 'PUT', body: { ...anterior, ...prepararProducto(datos, anterior.activo) }
  })
  await asignarCategoria(id, datos.categoriaId)
  return adaptarProducto(producto, [{ productoId: producto.id, categoria: await apiFetch(`/categorias/${datos.categoriaId}`) }])
}

export async function eliminarProducto(id) {
  await apiFetch(`/productos/${id}`, { method: 'DELETE' })
  await apiFetch(`/categorias/relaciones/${id}`, { method: 'DELETE' })
}
