# Mock-server (SOLO DESARROLLO)

Este servidor Express implementa el **contrato de API** del backend Spring Boot para poder desarrollar y probar el frontend sin depender de que el compañero termine el backend.

> **No es código de producción.** No tiene base de datos, los datos se reinician al detener el proceso y la clave JWT es de desarrollo. Para apuntar al backend real basta con cambiar `VITE_API_URL` en el `.env` del frontend (por ejemplo, `VITE_API_URL=http://localhost:8080/api/v1` apuntando al Spring Boot). El frontend no necesita ningún cambio de código.

## Levantar

```bash
cd mock-server
npm install
npm start
# o, desde la raíz del repositorio:
npm install
npm run mock
```

Escucha en `http://localhost:8080/api/v1` y permite CORS desde `http://localhost:5173`.

## Variables de entorno

Copiar `.env.example` a `.env` (ignorado por Git) dentro de `mock-server/`:

| Variable | Default | Uso |
| --- | --- | --- |
| `MOCK_PORT` | `8080` | Puerto HTTP. |
| `MOCK_ACCESS_MIN` | `15` | Minutos de duración del access token. Poner `1` para probar expiración y refresh. |
| `MOCK_JWT_SECRET` | `clave-desarrollo-perlitas-cambiar-en-produccion` | Clave de firma **de desarrollo**. Nunca usar en producción. |

## Usuarios sembrados

| Correo | Password | Rol |
| --- | --- | --- |
| `admin@perlitas.cl` | `Admin123!` | `ADMIN` |
| `vendedor@perlitas.cl` | `Vendedor123!` | `VENDEDOR` |

También hay 4 categorías, los 6 productos de `public/productos.json` del proyecto original y 2 boletas de ejemplo.

## Contrato implementado

- `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`.
- CRUD de `/productos`, `/categorias`, `/usuarios` (baja lógica).
- `GET /boletas`, `GET /boletas/:id`, `POST /boletas`, `PUT /boletas/:id/estado`, `DELETE /boletas/:id` (anula).
- Errores con `{timestamp, status, error, message, path}` y códigos 400, 401, 403, 404, 409, 500.
- 401 sin token/token inválido; 403 si el rol no tiene permiso; 409 si no hay stock al crear una boleta.
- El total de la boleta y los precios unitarios los calcula el servidor; al crear descuenta stock y al anular lo devuelve.

## Comprobación rápida

```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d "{\"correo\":\"admin@perlitas.cl\",\"password\":\"Admin123!\"}"

# Sin token -> 401
curl -i http://localhost:8080/api/v1/productos

# VENDEDOR creando categoría -> 403 (usar el token del vendedor)
curl -i -X POST http://localhost:8080/api/v1/categorias -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"nombre\":\"Prueba\"}"
```
