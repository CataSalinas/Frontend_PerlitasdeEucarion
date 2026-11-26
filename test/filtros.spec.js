import { filtrarOrdenes, filtrarProductos } from '../src/utils/filtros.js'

const ordenes = [
  { id: 1, fecha: '2026-11-20', clienteNombre: 'María', clienteApellidos: 'Pérez', estado: 'PAGADO' },
  { id: 2, fecha: '2026-11-21', clienteCorreo: 'ana@example.cl', estado: 'PENDIENTE' }
]
const productos = [
  { nombre: 'Anillo', stock: 0, categoria: 'Anillos', precioAhora: 100 },
  { nombre: 'Collar', stock: 4, categoria: 'Collares', precioAhora: 300 },
  { nombre: 'Aros', stock: 10, categoria: 'Aros', precioAhora: 200 }
]

describe('Filtros de órdenes', () => {
  it('busca por nombre sin distinguir acentos, número y correo', () => {
    expect(filtrarOrdenes(ordenes, { busqueda: 'maria perez' })[0].id).toBe(1)
    expect(filtrarOrdenes(ordenes, { busqueda: '#2' })[0].id).toBe(2)
    expect(filtrarOrdenes(ordenes, { busqueda: 'ana@example.cl' })[0].id).toBe(2)
  })
  it('combina búsqueda y estado y admite resultados vacíos', () => {
    expect(filtrarOrdenes(ordenes, { busqueda: 'Maria', estado: 'PAGADO' }).length).toBe(1)
    expect(filtrarOrdenes(ordenes, { busqueda: 'Maria', estado: 'PENDIENTE' }).length).toBe(0)
  })
  it('ordena por fecha sin modificar el listado original', () => {
    expect(filtrarOrdenes(ordenes).map(o => o.id)).toEqual([2, 1])
    expect(filtrarOrdenes(ordenes, { orden: 'antiguas' }).map(o => o.id)).toEqual([1, 2])
    expect(ordenes[0].id).toBe(1)
  })
})

describe('Filtros de productos', () => {
  it('combina nombre y categoría', () => {
    expect(filtrarProductos(productos, { busqueda: 'COL', categoria: 'Collares' }).length).toBe(1)
    expect(filtrarProductos(productos, { busqueda: 'COL', categoria: 'Aros' }).length).toBe(0)
  })
  it('distingue agotados, stock bajo y disponibles', () => {
    expect(filtrarProductos(productos, { stock: 'agotado' })[0].nombre).toBe('Anillo')
    expect(filtrarProductos(productos, { stock: 'bajo' })[0].nombre).toBe('Collar')
    expect(filtrarProductos(productos, { stock: 'disponible' }).length).toBe(2)
  })
  it('ordena por precio sin modificar el catálogo original', () => {
    expect(filtrarProductos(productos, { orden: 'menor' }).map(p => p.precioAhora)).toEqual([100, 200, 300])
    expect(filtrarProductos(productos, { orden: 'mayor' }).map(p => p.precioAhora)).toEqual([300, 200, 100])
    expect(productos[0].nombre).toBe('Anillo')
  })
})
