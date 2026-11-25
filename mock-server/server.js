/**
 * Servidor mock SOLO DE DESARROLLO.
 * Implementa el contrato REST que debe cumplir el backend Spring Boot real.
 * El frontend no distingue entre este servidor y el real: solo cambia VITE_API_URL.
 */
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')

const app = express()
const PUERTO = Number(process.env.MOCK_PORT || 8080)
const CLAVE_JWT = process.env.MOCK_JWT_SECRET || 'clave-desarrollo-perlitas-cambiar-en-produccion'
const ACCESO_MINUTOS = Number(process.env.MOCK_ACCESS_MIN || 15)
const ACCESO_SEGUNDOS = Math.max(1, Math.round(ACCESO_MINUTOS * 60))
const ORIGENES_PERMITIDOS = ['http://localhost:5173', 'http://127.0.0.1:5173']

app.use(cors({
  origin: ORIGENES_PERMITIDOS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// ---------------------------------------------------------------------------
// Datos sembrados (en memoria: se pierden al reiniciar, es intencional)
// ---------------------------------------------------------------------------

let categorias = [
  { id: 1, nombre: 'Collares' },
  { id: 2, nombre: 'Aros' },
  { id: 3, nombre: 'Pulseras' },
  { id: 4, nombre: 'Anillos' }
]

let productos = [
  { id: 1, nombre: 'Collar de perlas', descripcion: 'Collar artesanal con perlas de río.', precioAntes: 12990, precioAhora: 9990, stock: 8, categoriaId: 1 },
  { id: 2, nombre: 'Aros de plata', descripcion: 'Aros colgantes con baño de plata.', precioAntes: 8990, precioAhora: 6990, stock: 15, categoriaId: 2 },
  { id: 3, nombre: 'Pulsera de cuentas', descripcion: 'Pulsera tejida con cuentas de colores.', precioAntes: 5990, precioAhora: 4490, stock: 20, categoriaId: 3 },
  { id: 4, nombre: 'Anillo ajustable', descripcion: 'Anillo con piedra rosa, talla ajustable.', precioAntes: 6990, precioAhora: 5490, stock: 12, categoriaId: 4 },
  { id: 5, nombre: 'Gargantilla rosa', descripcion: 'Gargantilla con dije de cuarzo rosa.', precioAntes: 9990, precioAhora: 7990, stock: 6, categoriaId: 1 },
  { id: 6, nombre: 'Set de aros mini', descripcion: 'Set de tres pares de aros pequeños.', precioAntes: 7990, precioAhora: 5990, stock: 10, categoriaId: 2 }
]

let usuarios = [
  { id: 1, nombre: 'Ana', apellidos: 'Administradora', correo: 'admin@perlitas.cl', password: 'Admin123!', rol: 'ADMIN', activo: true },
  { id: 2, nombre: 'Luis', apellidos: 'Vendedor', correo: 'vendedor@perlitas.cl', password: 'Vendedor123!', rol: 'VENDEDOR', activo: true }
]

let boletas = []
let siguienteProducto = 7
let siguienteCategoria = 5
let siguienteUsuario = 3
let siguienteBoleta = 1000

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const ETIQUETAS_ESTADO = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error'
}

function responderError(req, res, status, message, error) {
  return res.status(status).json({
    timestamp: new Date().toISOString(),
    status,
    error: error || ETIQUETAS_ESTADO[status] || 'Error',
    message,
    path: req.originalUrl
  })
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

function numero(valor) {
  if (valor === '' || valor === null || valor === undefined) return NaN
  const n = Number(valor)
  return Number.isFinite(n) ? n : NaN
}

function productoPublico(producto) {
  const categoria = categorias.find((c) => c.id === producto.categoriaId)
  return {
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precioAntes: producto.precioAntes,
    precioAhora: producto.precioAhora,
    stock: producto.stock,
    categoria: categoria ? categoria.nombre : '',
    categoriaId: producto.categoriaId
  }
}

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellidos: usuario.apellidos,
    correo: usuario.correo,
    rol: usuario.rol,
    activo: usuario.activo
  }
}

function generarTokens(usuario) {
  const base = { sub: String(usuario.id), correo: usuario.correo, rol: usuario.rol }
  const accessToken = jwt.sign(base, CLAVE_JWT, { expiresIn: ACCESO_SEGUNDOS })
  const refreshToken = jwt.sign({ ...base, tipo: 'refresh' }, CLAVE_JWT, { expiresIn: '7d' })
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: ACCESO_SEGUNDOS,
    usuario: usuarioPublico(usuario)
  }
}

// ---------------------------------------------------------------------------
// Autenticación y permisos
// ---------------------------------------------------------------------------

function autenticar(req, res, next) {
  const cabecera = req.headers.authorization || ''
  if (!cabecera.startsWith('Bearer ')) {
    return responderError(req, res, 401, 'Se requiere un token de acceso')
  }
  try {
    const payload = jwt.verify(cabecera.slice(7), CLAVE_JWT)
    if (payload.tipo === 'refresh') throw new Error('token de refresh usado como access')
    const usuario = usuarios.find((u) => u.id === Number(payload.sub) && u.activo)
    if (!usuario) return responderError(req, res, 401, 'El usuario ya no está activo')
    req.usuario = usuario
    return next()
  } catch (error) {
    const mensaje = error && error.name === 'TokenExpiredError'
      ? 'El token de acceso expiró'
      : 'Token inválido o expirado'
    return responderError(req, res, 401, mensaje)
  }
}

function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'ADMIN') {
    return responderError(req, res, 403, 'No tiene permisos para realizar esta acción')
  }
  return next()
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

app.post('/api/v1/auth/login', (req, res) => {
  const correo = texto(req.body && req.body.correo).toLowerCase()
  const password = texto(req.body && req.body.password)
  const usuario = usuarios.find((u) => u.correo.toLowerCase() === correo && u.password === password && u.activo)

  if (!usuario) return responderError(req, res, 401, 'Correo o contraseña incorrectos')
  return res.json(generarTokens(usuario))
})

app.post('/api/v1/auth/refresh', (req, res) => {
  const refreshToken = texto(req.body && req.body.refreshToken)
  if (!refreshToken) return responderError(req, res, 400, 'Debe enviar el refreshToken')

  try {
    const payload = jwt.verify(refreshToken, CLAVE_JWT)
    if (payload.tipo !== 'refresh') throw new Error('no es refresh')
    const usuario = usuarios.find((u) => u.id === Number(payload.sub) && u.activo)
    if (!usuario) return responderError(req, res, 401, 'No es posible renovar la sesión')
    return res.json(generarTokens(usuario))
  } catch (error) {
    return responderError(req, res, 401, 'El refresh token es inválido o expiró')
  }
})

app.get('/api/v1/auth/me', autenticar, (req, res) => {
  res.json(usuarioPublico(req.usuario))
})

// ---------------------------------------------------------------------------
// Productos (lectura: ADMIN + VENDEDOR; escritura: solo ADMIN)
// ---------------------------------------------------------------------------

app.get('/api/v1/productos', autenticar, (req, res) => {
  res.json(productos.map(productoPublico))
})

app.get('/api/v1/productos/:id', autenticar, (req, res) => {
  const producto = productos.find((p) => p.id === Number(req.params.id))
  if (!producto) return responderError(req, res, 404, 'Producto no encontrado')
  return res.json(productoPublico(producto))
})

function validarCuerpoProducto(body, existente) {
  const datos = body || {}
  const nombre = texto(datos.nombre) || (existente && existente.nombre) || ''
  const descripcion = datos.descripcion !== undefined ? texto(datos.descripcion) : (existente ? existente.descripcion : '')
  const precioAntes = datos.precioAntes !== undefined ? numero(datos.precioAntes) : (existente ? existente.precioAntes : NaN)
  const precioAhora = datos.precioAhora !== undefined ? numero(datos.precioAhora) : (existente ? existente.precioAhora : NaN)
  const stock = datos.stock !== undefined ? numero(datos.stock) : (existente ? existente.stock : NaN)
  const categoriaId = datos.categoriaId !== undefined ? Number(datos.categoriaId) : (existente ? existente.categoriaId : NaN)

  if (!nombre) return { error: 'El nombre del producto es obligatorio' }
  if (!Number.isFinite(precioAntes) || precioAntes < 0) return { error: 'El precio anterior debe ser un número mayor o igual a 0' }
  if (!Number.isFinite(precioAhora) || precioAhora < 0) return { error: 'El precio actual debe ser un número mayor o igual a 0' }
  if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return { error: 'El stock debe ser un entero mayor o igual a 0' }
  if (!categorias.some((c) => c.id === categoriaId)) return { error: 'La categoría seleccionada no existe' }

  return { values: { nombre, descripcion, precioAntes, precioAhora, stock, categoriaId } }
}

app.post('/api/v1/productos', autenticar, soloAdmin, (req, res) => {
  const validacion = validarCuerpoProducto(req.body)
  if (validacion.error) return responderError(req, res, 400, validacion.error)
  const producto = { id: siguienteProducto++, ...validacion.values }
  productos.push(producto)
  return res.status(201).json(productoPublico(producto))
})

app.put('/api/v1/productos/:id', autenticar, soloAdmin, (req, res) => {
  const indice = productos.findIndex((p) => p.id === Number(req.params.id))
  if (indice === -1) return responderError(req, res, 404, 'Producto no encontrado')
  const validacion = validarCuerpoProducto(req.body, productos[indice])
  if (validacion.error) return responderError(req, res, 400, validacion.error)
  productos[indice] = { ...productos[indice], ...validacion.values }
  return res.json(productoPublico(productos[indice]))
})

app.delete('/api/v1/productos/:id', autenticar, soloAdmin, (req, res) => {
  const indice = productos.findIndex((p) => p.id === Number(req.params.id))
  if (indice === -1) return responderError(req, res, 404, 'Producto no encontrado')
  productos.splice(indice, 1)
  return res.status(204).send()
})

// ---------------------------------------------------------------------------
// Categorías (lectura: ADMIN + VENDEDOR; escritura: solo ADMIN)
// ---------------------------------------------------------------------------

app.get('/api/v1/categorias', autenticar, (req, res) => {
  res.json(categorias)
})

app.get('/api/v1/categorias/:id', autenticar, (req, res) => {
  const categoria = categorias.find((c) => c.id === Number(req.params.id))
  if (!categoria) return responderError(req, res, 404, 'Categoría no encontrada')
  return res.json(categoria)
})

app.post('/api/v1/categorias', autenticar, soloAdmin, (req, res) => {
  const nombre = texto(req.body && req.body.nombre)
  if (!nombre) return responderError(req, res, 400, 'El nombre de la categoría es obligatorio')
  if (categorias.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
    return responderError(req, res, 409, 'Ya existe una categoría con ese nombre')
  }
  const categoria = { id: siguienteCategoria++, nombre }
  categorias.push(categoria)
  return res.status(201).json(categoria)
})

app.put('/api/v1/categorias/:id', autenticar, soloAdmin, (req, res) => {
  const categoria = categorias.find((c) => c.id === Number(req.params.id))
  if (!categoria) return responderError(req, res, 404, 'Categoría no encontrada')
  const nombre = texto(req.body && req.body.nombre)
  if (!nombre) return responderError(req, res, 400, 'El nombre de la categoría es obligatorio')
  if (categorias.some((c) => c.id !== categoria.id && c.nombre.toLowerCase() === nombre.toLowerCase())) {
    return responderError(req, res, 409, 'Ya existe una categoría con ese nombre')
  }
  categoria.nombre = nombre
  return res.json(categoria)
})

app.delete('/api/v1/categorias/:id', autenticar, soloAdmin, (req, res) => {
  const id = Number(req.params.id)
  const indice = categorias.findIndex((c) => c.id === id)
  if (indice === -1) return responderError(req, res, 404, 'Categoría no encontrada')
  if (productos.some((p) => p.categoriaId === id)) {
    return responderError(req, res, 409, 'No se puede eliminar una categoría que tiene productos asociados')
  }
  categorias.splice(indice, 1)
  return res.status(204).send()
})

// ---------------------------------------------------------------------------
// Boletas / órdenes
// ---------------------------------------------------------------------------

const ESTADOS_PERMITIDOS = ['PAGADO', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']

function devolverStock(boleta) {
  boleta.detalles.forEach((detalle) => {
    const producto = productos.find((p) => p.id === detalle.productoId)
    if (producto) producto.stock += detalle.cantidad
  })
}

function registrarBoleta(body, usuario, fecha) {
  const datos = body || {}
  const items = Array.isArray(datos.items) ? datos.items : []
  if (!texto(datos.clienteNombre) || !texto(datos.clienteApellidos) || !texto(datos.clienteCorreo)) {
    return { error: 'Debe ingresar el nombre, apellidos y correo del cliente' }
  }
  if (!texto(datos.calle) || !texto(datos.numeroCasa)) {
    return { error: 'Debe ingresar la dirección de entrega' }
  }
  if (!Number.isInteger(Number(datos.regionId)) || !Number.isInteger(Number(datos.comunaId))) {
    return { error: 'Debe seleccionar región y comuna' }
  }
  if (items.length === 0) return { error: 'La boleta debe tener al menos un producto' }

  const detalles = []
  for (const item of items) {
    const producto = productos.find((p) => p.id === Number(item.productoId))
    const cantidad = Number(item.cantidad)
    if (!producto) return { error: 'Uno de los productos seleccionados no existe' }
    if (!Number.isInteger(cantidad) || cantidad <= 0) return { error: 'Las cantidades deben ser enteros positivos' }
    if (producto.stock < cantidad) {
      return { error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`, status: 409 }
    }
    detalles.push({
      productoId: producto.id,
      productoNombre: producto.nombre,
      cantidad,
      precioUnitario: producto.precioAhora
    })
  }

  const total = detalles.reduce((suma, d) => suma + d.precioUnitario * d.cantidad, 0)
  const boleta = {
    id: siguienteBoleta++,
    fecha: fecha || new Date().toISOString(),
    total,
    estado: 'PAGADO',
    usuarioNombre: `${usuario.nombre} ${usuario.apellidos}`,
    clienteNombre: texto(datos.clienteNombre),
    clienteApellidos: texto(datos.clienteApellidos),
    clienteCorreo: texto(datos.clienteCorreo),
    calle: texto(datos.calle),
    numeroCasa: texto(datos.numeroCasa),
    regionId: Number(datos.regionId),
    comunaId: Number(datos.comunaId),
    indicaciones: texto(datos.indicaciones),
    detalles
  }

  detalles.forEach((detalle) => {
    const producto = productos.find((p) => p.id === detalle.productoId)
    producto.stock -= detalle.cantidad
  })
  boletas.push(boleta)
  return { boleta }
}

// Boletas de ejemplo (el stock queda descontado coherendentemente).
registrarBoleta({
  clienteNombre: 'María', clienteApellidos: 'González', clienteCorreo: 'maria@example.cl',
  calle: 'Av. Providencia', numeroCasa: '1234', regionId: 1000, comunaId: 1022,
  indicaciones: 'Dejar en conserjería',
  items: [{ productoId: 1, cantidad: 1 }, { productoId: 2, cantidad: 2 }]
}, usuarios[1], new Date(Date.now() - 2 * 86400000).toISOString())

registrarBoleta({
  clienteNombre: 'Carlos', clienteApellidos: 'Muñoz', clienteCorreo: 'carlos@example.cl',
  calle: 'Calle Central', numeroCasa: '56', regionId: 6000, comunaId: 6007,
  indicaciones: '',
  items: [{ productoId: 3, cantidad: 2 }]
}, usuarios[0], new Date(Date.now() - 86400000).toISOString())

app.get('/api/v1/boletas', autenticar, (req, res) => {
  res.json([...boletas].sort((a, b) => b.fecha.localeCompare(a.fecha)))
})

app.get('/api/v1/boletas/:id', autenticar, (req, res) => {
  const boleta = boletas.find((b) => b.id === Number(req.params.id))
  if (!boleta) return responderError(req, res, 404, 'Boleta no encontrada')
  return res.json(boleta)
})

app.post('/api/v1/boletas', autenticar, soloAdmin, (req, res) => {
  const resultado = registrarBoleta(req.body, req.usuario)
  if (resultado.error) return responderError(req, res, resultado.status || 400, resultado.error)
  return res.status(201).json(resultado.boleta)
})

app.put('/api/v1/boletas/:id/estado', autenticar, soloAdmin, (req, res) => {
  const boleta = boletas.find((b) => b.id === Number(req.params.id))
  if (!boleta) return responderError(req, res, 404, 'Boleta no encontrada')
  const estado = texto(req.body && req.body.estado)
  if (!ESTADOS_PERMITIDOS.includes(estado)) {
    return responderError(req, res, 400, 'Estado no válido. Use PAGADO, EN_PREPARACION, ENTREGADO o CANCELADO')
  }
  if (boleta.estado === 'CANCELADO' && estado !== 'CANCELADO') {
    return responderError(req, res, 409, 'Una boleta anulada no puede volver a otro estado')
  }
  if (estado === 'CANCELADO' && boleta.estado !== 'CANCELADO') devolverStock(boleta)
  boleta.estado = estado
  return res.json(boleta)
})

app.delete('/api/v1/boletas/:id', autenticar, soloAdmin, (req, res) => {
  const boleta = boletas.find((b) => b.id === Number(req.params.id))
  if (!boleta) return responderError(req, res, 404, 'Boleta no encontrada')
  if (boleta.estado !== 'CANCELADO') devolverStock(boleta)
  boleta.estado = 'CANCELADO'
  return res.status(204).send()
})

// ---------------------------------------------------------------------------
// Usuarios del personal (solo ADMIN; baja lógica)
// ---------------------------------------------------------------------------

app.get('/api/v1/usuarios', autenticar, soloAdmin, (req, res) => {
  res.json(usuarios.map(usuarioPublico))
})

app.get('/api/v1/usuarios/:id', autenticar, soloAdmin, (req, res) => {
  const usuario = usuarios.find((u) => u.id === Number(req.params.id))
  if (!usuario) return responderError(req, res, 404, 'Usuario no encontrado')
  return res.json(usuarioPublico(usuario))
})

app.post('/api/v1/usuarios', autenticar, soloAdmin, (req, res) => {
  const datos = req.body || {}
  const nombre = texto(datos.nombre)
  const apellidos = texto(datos.apellidos)
  const correo = texto(datos.correo).toLowerCase()
  const password = texto(datos.password)
  const rol = texto(datos.rol)

  if (!nombre || !apellidos || !correo) return responderError(req, res, 400, 'Nombre, apellidos y correo son obligatorios')
  if (password.length < 6) return responderError(req, res, 400, 'La contraseña debe tener al menos 6 caracteres')
  if (!['ADMIN', 'VENDEDOR'].includes(rol)) return responderError(req, res, 400, 'El rol debe ser ADMIN o VENDEDOR')
  if (usuarios.some((u) => u.correo.toLowerCase() === correo)) {
    return responderError(req, res, 409, 'Ya existe un usuario con ese correo')
  }
  const usuario = { id: siguienteUsuario++, nombre, apellidos, correo, password, rol, activo: true }
  usuarios.push(usuario)
  return res.status(201).json(usuarioPublico(usuario))
})

app.put('/api/v1/usuarios/:id', autenticar, soloAdmin, (req, res) => {
  const usuario = usuarios.find((u) => u.id === Number(req.params.id))
  if (!usuario) return responderError(req, res, 404, 'Usuario no encontrado')
  const datos = req.body || {}
  const nombre = datos.nombre !== undefined ? texto(datos.nombre) : usuario.nombre
  const apellidos = datos.apellidos !== undefined ? texto(datos.apellidos) : usuario.apellidos
  const correo = datos.correo !== undefined ? texto(datos.correo).toLowerCase() : usuario.correo
  const rol = datos.rol !== undefined ? texto(datos.rol) : usuario.rol
  const activo = datos.activo !== undefined ? Boolean(datos.activo) : usuario.activo

  if (!nombre || !apellidos || !correo) return responderError(req, res, 400, 'Nombre, apellidos y correo son obligatorios')
  if (!['ADMIN', 'VENDEDOR'].includes(rol)) return responderError(req, res, 400, 'El rol debe ser ADMIN o VENDEDOR')
  if (usuarios.some((u) => u.id !== usuario.id && u.correo.toLowerCase() === correo)) {
    return responderError(req, res, 409, 'Ya existe un usuario con ese correo')
  }
  if (usuario.id === req.usuario.id && !activo) {
    return responderError(req, res, 409, 'No puede desactivar su propio usuario')
  }
  Object.assign(usuario, { nombre, apellidos, correo, rol, activo })
  if (datos.password && texto(datos.password).length >= 6) usuario.password = texto(datos.password)
  return res.json(usuarioPublico(usuario))
})

app.delete('/api/v1/usuarios/:id', autenticar, soloAdmin, (req, res) => {
  const usuario = usuarios.find((u) => u.id === Number(req.params.id))
  if (!usuario) return responderError(req, res, 404, 'Usuario no encontrado')
  if (usuario.id === req.usuario.id) {
    return responderError(req, res, 409, 'No puede dar de baja su propio usuario')
  }
  usuario.activo = false
  return res.status(204).send()
})

// ---------------------------------------------------------------------------
// Rutas no encontradas y manejo centralizado de errores
// ---------------------------------------------------------------------------

app.use('/api', (req, res) => responderError(req, res, 404, 'Endpoint no encontrado'))

app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  if (error && error.type === 'entity.parse.failed') {
    return responderError(req, res, 400, 'El cuerpo de la petición no es un JSON válido')
  }
  console.error('[mock-server]', error)
  return responderError(req, res, 500, 'Error interno del servidor mock')
})

app.listen(PUERTO, () => {
  console.log(`Mock-server.listening http://localhost:${PUERTO}/api/v1 (access ${ACCESO_MINUTOS} min)`)
})
