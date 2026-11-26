# Perlitas de Eucarión — Frontend

SPA de **tienda pública y gestión interna** construida con React + Vite + Bootstrap. Administra productos, categorías, órdenes/boletas y usuarios del personal consumiendo la API REST real de Spring Boot. Incluye catálogo, carrito y compra sin registro, con pago al recibir. Se verificó el registro de una compra como invitado y su resumen, con persistencia en el sistema administrativo.

- Repositorio: https://github.com/CataSalinas/Frontend_PerlitasdeEucarion
- Backend real: https://github.com/Yulianacalvucura/Backend-Perlitas-de-Eucarion, disponible en `http://localhost:9090/api/v1`.
- Acceso público para clientes sin cuenta y acceso del personal con roles `ADMIN` y `VENDEDOR`.

Proyecto de la asignatura DSY1104 Desarrollo Fullstack II. Integrantes: Yuliana Calvucura, Francisco Riveros y Catalina Salinas.

## Roles

| Acción | ADMIN | VENDEDOR | CLIENTE (invitado) |
| --- | --- | --- | --- |
| Acceder a tienda y comprar sin registro | Sí | Sí | Sí |
| Ingresar, ver panel, listar productos y órdenes | Sí | Sí | No |
| Ver detalle de productos y boletas internas | Sí | Sí | No |
| Crear / editar / eliminar productos | Sí | No | No |
| Gestionar categorías | Sí | No | No |
| Registrar ventas, cambiar estados, anular boletas | Sí | No | No |
| Crear / editar / dar de baja usuarios | Sí | No | No |

La interfaz oculta los controles no permitidos, pero **la autoridad es el backend**: las operaciones administrativas están restringidas por el Gateway y Spring Security. Se comprobó que una petición `PUT` de productos con JWT de vendedor devuelve `403`.

## Requisitos

- Node.js 24 (versión utilizada en las pruebas del equipo) y npm.
- Backend Spring Boot iniciado, Gateway en `http://localhost:9090/api/v1` y MySQL/MariaDB activo (ver README del backend).

## Puesta en marcha

Primero iniciar MySQL desde XAMPP y, desde la raíz del repositorio backend, ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\iniciar.ps1
```

Después, desde la raíz de este repositorio frontend:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

El archivo `.env` debe contener:

```env
VITE_API_URL=/api/v1
```

Vite utiliza un proxy hacia `http://localhost:9090` y conserva el prefijo `/api/v1`.

Abrir `http://localhost:5173`. La página principal abre `/tienda`. Desde «Acceso del personal» se ingresa a `/login` o al panel si hay sesión.

Usuarios de desarrollo inicializados por el backend:

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `admin123` | `ADMIN` |
| `vendedor` | `vendedor123` | `VENDEDOR` |

Las cuentas nuevas del personal pueden iniciar sesión con su correo registrado. Estas credenciales de ejemplo son solo para desarrollo local; no deben utilizarse en producción.

`.env` está ignorado por Git; solo se versiona `.env.example`. Ver también [`INTEGRACION_LOCAL.md`](INTEGRACION_LOCAL.md).

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo Vite. |
| `npm run build` | Empaquetado de producción en `dist/`. |
| `npm run preview` | Servir el `dist/` generado. |
| `npm test` | Jasmine + Karma con launcher `jsdom` y reporte de cobertura en `coverage/html`. |
| `npm run test:watch` | Modo observador. |
| `npm run test:chrome` | Igual que `npm test` pero con ChromeHeadless (requiere Chrome instalado). |

Las pruebas con Jasmine y Karma simulan las respuestas de `fetch` según el contrato REST real. No requieren un servidor mock independiente ni sustituyen las pruebas de integración manuales.

Cobertura registrada el 26-11-2026, antes de la limpieza:

| Métrica | Cobertura |
| --- | ---: |
| Statements | 70,66 % |
| Branches | 65,56 % |
| Functions | 70,54 % |
| Lines | 74,50 % |

Ejecutar `npm test` para obtener el total de pruebas exitosas y la cobertura actualizada.

## Rutas

| Ruta | Acceso | Pantalla |
| --- | --- | --- |
| `/`, `/tienda` | Público | Catálogo, carrito y checkout sin registro |
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
  context/AuthContext.jsx   sesión persistente, expiración, logout, sync entre pestañas
  services/
    api.js                  fetch + Authorization + manejo de errores y cierre de sesión
    authService.js          login / logout
    productosService.js     /productos y /categorias/relaciones
    categoriasService.js    /categorias
    boletasService.js       /ventas
    usuariosService.js      /auth/usuarios
    tiendaService.js        catálogo y compra pública
  hooks/useRecurso.js       carga con estados carga/error/recarga
  components/               Navbar por rol, RutaProtegida, avisos, footer
  pages/                    pantallas de gestión y tienda pública
  utils/validaciones.js     validaciones y formato de precios/estados
test/                       pruebas Jasmine + Karma
```

## Sesión y seguridad (trade-off)

Se guardan `accessToken` y el objeto `usuario` en `localStorage` con prefijo `perlitas_`. Esto permite mantener la sesión al recargar. El login utiliza `nombreUsuario` y `contrasena` y recibe un JWT de texto plano; el frontend lee los claims `sub`, `roles` y `exp` para gestionar la sesión y la interfaz.

**Trade-off:** `localStorage` es legible desde JavaScript, por lo que un XSS podría robar el token. La validación de la firma y la autorización real corresponden al backend.

- Las peticiones protegidas envían `Authorization: Bearer` al Gateway.
- Ante un `401` de la sesión activa, se limpia la sesión y se redirige a `/login`. Un `403` indica falta de permisos.
- Al recargar se verifica el claim `exp`; al expirar, se debe volver a iniciar sesión. No se utilizan refresh tokens.
- Cerrar sesión en una pestaña se sincroniza con las demás mediante el evento `storage`.
- El Gateway comprueba la cuenta activa y el rol actual en las peticiones protegidas.

`.env` y `node_modules/` están ignorados por Git. El backend incluye configuraciones de desarrollo que no deben utilizarse para producción.

## Integración y alcance actual

- Productos y categorías se consultan y modifican en la base de datos mediante REST. `productosService.js` adapta `precioVenta` y `stockDisponible` a los campos de la interfaz y consulta las relaciones de categorías.
- El registro de una venta por ADMIN envía los datos del cliente, el método de pago y los identificadores/cantidades de productos a `/api/v1/ventas/registro`. El backend calcula el total y descuenta el stock.
- Las órdenes se consultan desde `/api/v1/ventas`. El administrador puede cambiar su estado o anularlas, lo que devuelve stock.
- El personal se gestiona a través de `/api/v1/auth/usuarios`.
- Se comprobaron manualmente el login de ambos roles, categorías, CRUD de productos, registro de venta, detalle de orden, descuento y devolución de stock, y la pantalla de acceso denegado del vendedor.

- La tienda usa `GET /api/v1/productos/tienda`, `GET /api/v1/categorias/tienda` y `POST /api/v1/ventas/compra` sin JWT. La compra queda `PENDIENTE` con pago en efectivo al recibir. El servidor valida stock y precios, y devuelve un resumen con productos, cantidades, precios unitarios y total.

Se comprobó la compra pública y la visualización de su detalle desde administración. Queda comprobar edición/baja de usuarios y sesiones previas, confirmar con el docente el alcance del cliente invitado y finalizar los documentos de entrega.

## Documentación

- [`INTEGRACION_LOCAL.md`](INTEGRACION_LOCAL.md): ejecución e integración local.
- Entrega: ERS, manual de usuario, documentación de APIs y documento de APIs e integración.

Los commits documentan los cambios del proyecto. Los borradores del contrato simulado se archivaron fuera del repositorio, ya que no describen la API actual.
