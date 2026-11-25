# Documento de integración frontend — API REST

Contrato consumido por el frontend de gestión. La fuente de verdad es el backend Spring Boot del compañero; `mock-server/` reproduce este contrato para desarrollo y pruebas.

## 1. Arquitectura

```
Navegador (React SPA)
  └─ pages/ ──> hooks/useRecurso.js ──> services/*Service.js ──> services/api.js
                                                                 │
                                                    fetch(VITE_API_URL + ruta)
                                                                 │
                              backend Spring Boot / mock-server (:8080/api/v1)
```

- `src/config.js`: `API_URL` = `VITE_API_URL` (o `http://localhost:8080/api/v1`), sin barra final.
- `src/services/api.js`: único lugar que llama a `fetch`. Agrega `Accept: application/json`, `Content-Type` cuando hay cuerpo y `Authorization: Bearer <accessToken>`.
- `src/context/AuthContext.jsx`: sesión, roles y navegación.
- `AuthProvider` envuelve la app en `src/main.jsx`; `RutaProtegida` decide qué pantallas se muestran.

## 2. Configuración

```env
# .env (ignorado por Git)
VITE_API_URL=http://localhost:8080/api/v1
```

Vite sustituye `globalThis.VITE_API_URL` mediante `vite.config.js`. En Karma/Webpack se define el mismo valor en `karma.conf.cjs`, para que las pruebas usen el código real sin `import.meta.env`.

Cambiar de mock a backend real **no requiere cambios de código**: basta con cambiar esa variable.

## 3. Autenticación

### Login

`POST /auth/login` con `{ correo, password }`. No envía `Authorization`.

Respuesta esperada:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "usuario": {
    "id": 1, "nombre": "Ana", "apellidos": "Admin",
    "correo": "admin@perlitas.cl", "rol": "ADMIN", "activo": true
  }
}
```

Se persiste en `localStorage` (`perlitas_accessToken`, `perlitas_refreshToken`, `perlitas_usuario`) y se navega a `/panel`.

### Restauración al recargar

No se llama a `/auth/me` al iniciar: se decodifica el claim `exp` del JWT.

- Access vigente → se usa tal cual, sin peticiones.
- Access vencido → `POST /auth/refresh` con `{ refreshToken }`.
- Refresh exitoso → se guardan los nuevos tokens y se continúa.
- Refresh fallido → se limpia la sesión y se redirige a `/login`.

Mientras se restaura, `App.jsx` muestra un indicador de carga para evitar el parpadeo hacia `/login`.

### Renovación ante 401

Si cualquier petición con `auth: true` recibe `401`:

1. Se intenta **un único refresh** (`promesaRefresh` compartida: varias peticiones concurrentes solo generan una llamada a `/auth/refresh`).
2. Con el nuevo token se reintenta la petición original una vez (`reintentar: false` en el reintento, para evitar bucles).
3. Si el refresh falla, se limpia la sesión y se notifica el cierre forzado.

`POST /auth/login` y el propio `/auth/refresh` usan `auth: false`, de modo que un 401 allí no dispara otro refresh.

### Cierre y sincronización

- `logout()` limpia `localStorage`, el estado de React y navega a `/login`.
- El evento `storage` sincroniza pestañas: si otra cierra sesión o cambia los tokens, esta reacciona.
- `GET /auth/me` está implementado en la capa de servicios (`obtenerPerfil`) pero no se usa en cada recarga.

## 4. Endpoints consumidos

| Recurso | Rutas que usa el frontend | Servicio | Pantalla |
| --- | --- | --- | --- |
| Productos | `GET /productos`, `GET /productos/:id`, `POST /productos`, `PUT /productos/:id`, `DELETE /productos/:id` | `productosService.js` | Productos, Detalle, Formulario, Panel, NuevaOrden |
| Categorías | `GET /categorias`, `GET /categorias/:id`, `POST /categorias`, `PUT /categorias/:id`, `DELETE /categorias/:id` | `categoriasService.js` | Categorías, filtro de Productos, Formulario |
| Usuarios | `GET /usuarios`, `GET /usuarios/:id`, `POST /usuarios`, `PUT /usuarios/:id`, `DELETE /usuarios/:id` | `usuariosService.js` | Usuarios |
| Boletas | `GET /boletas`, `GET /boletas/:id`, `POST /boletas`, `PUT /boletas/:id/estado`, `DELETE /boletas/:id` | `boletasService.js` | Órdenes, DetalleOrden, NuevaOrden, Panel |
| Autenticación | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` | `authService.js` | Login, AuthContext |

Formas de uso relevantes:

- `crearCategoria(nombre)` envía `{ "nombre": "..." }`.
- `crearBoleta(datos)` envía datos de cliente + entrega + `items: [{ productoId, cantidad }]`.
- `cambiarEstadoBoleta(id, estado)` envía `{ "estado": "PAGADO" | "EN_PREPARACION" | "ENTREGADO" | "CANCELADO" }`.
- `DELETE /boletas/:id` **anula** la boleta y devuelve el stock.
- `DELETE /usuarios/:id` es baja lógica (`activo: false`).

El total y los precios unitarios de una boleta los calcula el servidor; el frontend solo muestra un total estimado mientras se arma la venta.

## 5. Modelos manejados por la UI

```jsonc
// Producto
{ "id": 1, "nombre": "Collar de perlas", "descripcion": "Perlas de río",
  "precioAntes": 12990, "precioAhora": 9990, "stock": 8,
  "categoriaId": 1, "categoria": "Collares" }

// Categoría
{ "id": 1, "nombre": "Collares" }

// Usuario
{ "id": 1, "nombre": "Ana", "apellidos": "Admin", "correo": "admin@perlitas.cl",
  "rol": "ADMIN", "activo": true }

// Boleta (detalle)
{ "id": 1001, "fecha": "2026-11-25T10:00:00", "estado": "PAGADO", "total": 9990,
  "clienteNombre": "Camila", "clienteApellidos": "Pérez", "clienteCorreo": "camila@correo.cl",
  "calle": "Av. Central", "numeroCasa": "123", "regionId": 13, "comunaId": 151,
  "indicaciones": "Dejar en conserjería", "usuarioNombre": "Ana",
  "detalles": [{ "productoId": 1, "productoNombre": "Collar de perlas",
                 "cantidad": 1, "precioUnitario": 9990 }] }
```

Las regiones y comunas que se ofrecen en el formulario viven en `src/data/zonas.js` y se envían como `regionId` / `comunaId`.

## 6. Errores

El backend responde:

```json
{
  "timestamp": "2026-11-25T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Stock insuficiente para Collar de perlas",
  "path": "/api/v1/boletas"
}
```

`api.js` convierte la respuesta en un `ApiError` con `message`, `status` y `payload`. Cada pantalla muestra `error.message` en un aviso (`ErrorAviso`). Si no hay mensaje, se usan textos por defecto: `No autorizado`, `No tiene permisos para realizar esta acción`, `Recurso no encontrado` o `Error del servidor (n)`. Errores de red → `No se pudo conectar con el servidor` (`status: 0`).

Códigos esperados: `400` validación, `401` sin/invalid token, `403` rol sin permiso, `404` no encontrado, `409` conflicto (stock o categoría con productos), `500` error interno.

## 7. Permisos

| Operación | ADMIN | VENDEDOR |
| --- | --- | --- |
| `GET /productos`, `/productos/:id`, `/boletas`, `/boletas/:id` | Sí | Sí |
| `POST/PUT/DELETE /productos` | Sí | 403 |
| `GET/POST/PUT/DELETE /categorias` | Sí | 403 |
| `POST /boletas`, `PUT /boletas/:id/estado`, `DELETE /boletas/:id` | Sí | 403 |
| `GET/POST/PUT/DELETE /usuarios` | Sí | 403 |

Frontend: `RutaProtegida roles={...}` en `App.jsx` y `hasRole()` dentro de las páginas ocultan enlaces y botones. Backend: valida el rol del JWT en cada endpoint. La ocultación **no** es seguridad; es usabilidad.

## 8. mock-server

- `npm run mock` levanta Express en `http://localhost:8080/api/v1`, con CORS para `http://localhost:5173`.
- Usuarios sembrados: `admin@perlitas.cl` / `Admin123!` (ADMIN) y `vendedor@perlitas.cl` / `Vendedor123!` (VENDEDOR).
- Variables: `MOCK_PORT`, `MOCK_ACCESS_MIN` (poner `1` para probar expiración/refresh) y `MOCK_JWT_SECRET` (**solo desarrollo**).
- Los datos están en memoria y se reinician al detener el proceso. No tiene base de datos.

## 9. Verificación y pruebas

- `npm test`: 39 pruebas Jasmine + Karma con `jsdom` (sin Chrome) y cobertura en `coverage/html`.
- `npm run build`: empaquetado de producción en `dist/`.
- Comprobación manual del contrato con `curl`: ver `mock-server/README.md`.
- En `test/` los fetch se mockean, por lo que las pruebas no dependen de que el mock esté corriendo.

## 10. Limitaciones conocidas

- Los tokens están en `localStorage`: riesgo XSS documentado en `README.md` y `ASSUMPTIONS.md`.
- Al restaurar sesión se confía en el claim `exp` del JWT y en el refresh; no se consulta `/auth/me`.
- `jsdom` no implementa `MessageChannel`, por lo que las pruebas asíncronas usan un helper `drenarEfectos()` en vez de `act(async () => ...)`.
