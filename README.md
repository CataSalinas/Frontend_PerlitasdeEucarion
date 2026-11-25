# Perlitas de Eucarión — Frontend de gestión interna

SPA de **gestión interna** construida con React + Vite + Bootstrap. No es la tienda pública: el objetivo es administrar productos, categorías, órdenes/boletas y usuarios del personal consumiendo una API REST.

- Repositorio: https://github.com/CataSalinas/Frontend_PerlitasdeEucarion
- Backend real: Spring Boot del compañero en otro repositorio ([ENLACE AL REPO DEL BACKEND]), contrato en `http://localhost:8080/api/v1`.
- Desarrollo sin backend: `mock-server/` (Express) implementa el mismo contrato.
- Acceso: solo personal autorizado, con roles `ADMIN` y `VENDEDOR`. No hay registro público.

Proyecto de la asignatura DSY1104 Desarrollo Fullstack II. Integrantes: Yuliana Calvucura, Francisco Riveros y Catalina Salinas.

## Roles

| Acción | ADMIN | VENDEDOR |
| --- | --- | --- |
| Ingresar, ver panel, listar productos y órdenes | Sí | Sí |
| Ver detalle de productos y boletas | Sí | Sí |
| Crear / editar / eliminar productos | Sí | No |
| Gestionar categorías | Sí | No |
| Registrar ventas, cambiar estados, anular boletas | Sí | No |
| Crear / editar / dar de baja usuarios | Sí | No |

La interfaz oculta los controles no permitidos, pero **la autoridad es el backend**: cualquier intento directo de escritura con rol `VENDEDOR` termina en `403`.

## Requisitos

- Node.js 18 o superior y npm.
- Opcional: backend Spring Boot en `http://localhost:8080/api/v1`. Si no está disponible, usar el mock.

## Puesta en marcha

```bash
cp .env.example .env          # en Windows: Copy-Item .env.example .env
npm install
npm run mock                  # terminal 1: API de desarrollo en :8080
npm run dev                   # terminal 2: Vite en :5173
```

Abrir `http://localhost:5173`. La aplicación siempre arranca en `/login`.

Usuarios del mock-server:

| Correo | Contraseña | Rol |
| --- | --- | --- |
| `admin@perlitas.cl` | `Admin123!` | `ADMIN` |
| `vendedor@perlitas.cl` | `Vendedor123!` | `VENDEDOR` |

Para apuntar al backend real basta con cambiar `VITE_API_URL` en `.env` y reiniciar Vite; no hay que tocar código:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

`.env` está ignorado por Git; solo se versiona `.env.example`. Ver más detalles en [`mock-server/README.md`](mock-server/README.md).

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo Vite. |
| `npm run build` | Empaquetado de producción en `dist/`. |
| `npm run preview` | Servir el `dist/` generado. |
| `npm run mock` | Levantar el mock-server (variables en `mock-server/.env`). |
| `npm test` | Jasmine + Karma con launcher `jsdom` y reporte de cobertura en `coverage/html`. |
| `npm run test:watch` | Modo observador. |
| `npm run test:chrome` | Igual que `npm test` pero con ChromeHeadless (requiere Chrome instalado). |

Hay **39 pruebas** en 8 archivos de especificación: capa API/refresh, sesión persistente, rutas por rol, navbar, login, productos, órdenes y validaciones.

## Rutas

| Ruta | Acceso | Pantalla |
| --- | --- | --- |
| `/login` | Público (redirige a `/panel` si hay sesión) | Ingreso |
| `/panel` | ADMIN, VENDEDOR | Resumen: productos, órdenes y stock bajo |
| `/productos`, `/productos/:id` | ADMIN, VENDEDOR | Listado con filtro y detalle |
| `/productos/nuevo`, `/productos/:id/editar` | Solo ADMIN | Alta y edición |
| `/categorias` | Solo ADMIN | Alta, edición y baja |
| `/ordenes`, `/ordenes/:id` | ADMIN, VENDEDOR | Listado y detalle de boletas |
| `/ordenes/nueva` | Solo ADMIN | Registrar venta |
| `/usuarios` | Solo ADMIN | Alta, edición y baja lógica |
| `/acceso-denegado` | Cualquiera | Pantalla 403 de la SPA |
| `*` | Cualquiera | Página no encontrada |

Sin sesión, cualquier ruta privada redirige a `/login`. Con sesión pero rol insuficiente se muestra `/acceso-denegado`.

## Estructura

```
src/
  main.jsx                  entrada: BrowserRouter + AuthProvider + Bootstrap
  App.jsx                   rutas y RutaProtegida
  config.js                 API_URL desde VITE_API_URL (o valor por defecto)
  context/AuthContext.jsx   sesión persistente, refresh, logout, sync entre pestañas
  services/
    api.js                  fetch + Authorization + refresh single-flight + errores
    authService.js          login / refresh / perfil
    productosService.js     /productos
    categoriasService.js    /categorias
    boletasService.js       /boletas
    usuariosService.js      /usuarios
  hooks/useRecurso.js       carga con estados carga/error/recarga
  components/               Navbar por rol, RutaProtegida, avisos, footer
  pages/                    pantallas de gestión
  utils/validaciones.js     validaciones y formato de precios/estados
mock-server/                API de desarrollo (no producción)
test/                       pruebas Jasmine + Karma
docs/                       manual, integración y guía de presentación
```

## Sesión y seguridad (trade-off)

Se guardan `accessToken`, `refreshToken` y el objeto `usuario` en `localStorage` con prefijo `perlitas_`. Eso permite que la sesión sobreviva a recargas y pestañas nuevas, como pide el enunciado.

**Trade-off:** `localStorage` es legible desde JavaScript, por lo que un XSS podría robar el token. Una cookie `HttpOnly` + `SameSite` sería más segura, pero el frontend no podría leerla y complicaría el contrato con el backend Spring Boot. Se acepta ese riesgo de forma explícita y se mitiga así:

- El backend valida todo: `401` / `403` son la única fuente de autoridad.
- Los tokens se envían solo por `Authorization: Bearer` a la API configurada.
- Ante un `401` se intenta **un solo refresh** (single-flight) y se reintenta la petición una vez; si falla, se limpia la sesión y se va a `/login`.
- Al recargar se decodifica el claim `exp`; si el access venció se renueva antes de mostrar la app.
- Cerrar sesión en una pestaña cierra la sesión en las demás mediante el evento `storage`.

No hay secretos versionados: `.env` y `node_modules/` están ignorados. La clave JWT del mock es de desarrollo.

## Decisiones y documentación

- [`ASSUMPTIONS.md`](ASSUMPTIONS.md): decisiones ante ambigüedades.
- [`docs/Manual_de_Usuario.md`](docs/Manual_de_Usuario.md): uso paso a paso por rol.
- [`docs/Documento_Integracion_Frontend.md`](docs/Documento_Integracion_Frontend.md): contrato REST, autenticación y permisos.
- [`docs/Guia_Presentacion.md`](docs/Guia_Presentacion.md): guion de demostración y preguntas frecuentes.
- [`CHECKLIST_RUBRICA.md`](CHECKLIST_RUBRICA.md): verificación final de la entrega.

Los commits siguen **Conventional Commits** (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). El repositorio tiene remoto en GitHub y se hizo push; el historial incluye varias ramas fusionadas.
