function normalizar(valor) {
  return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function filtrarOrdenes(ordenes, { busqueda = '', estado = '', orden = 'recientes' } = {}) {
  const consulta = normalizar(busqueda).replace(/^#/, '')
  return ordenes.filter((b) => (!estado || b.estado === estado) &&
    normalizar(`${b.id} ${b.clienteNombre ?? ''} ${b.clienteApellidos ?? ''} ${b.clienteCorreo ?? ''}`).includes(consulta)
  ).sort((a, b) => {
    const diferencia = (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0) || Number(b.id) - Number(a.id)
    return orden === 'antiguas' ? -diferencia : diferencia
  })
}

export function filtrarProductos(productos, { busqueda = '', categoria = '', stock = '', orden = '' } = {}) {
  const consulta = normalizar(busqueda)
  const resultado = productos.filter((p) => {
    const cantidad = Number(p.stock)
    return normalizar(p.nombre).includes(consulta) && (!categoria || p.categoria === categoria) &&
      (!stock || (stock === 'agotado' && cantidad === 0) || (stock === 'bajo' && cantidad > 0 && cantidad < 5) || (stock === 'disponible' && cantidad > 0))
  })
  if (orden === 'menor') resultado.sort((a, b) => Number(a.precioAhora) - Number(b.precioAhora))
  if (orden === 'mayor') resultado.sort((a, b) => Number(b.precioAhora) - Number(a.precioAhora))
  return resultado
}
