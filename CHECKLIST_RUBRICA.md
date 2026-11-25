# Checklist de verificación — Entrega frontend Gestión Perlitas de Eucarión

Estado final: **verificado**. Repositorio `perlitas-gestion-frontend`, rama `main`, 7 commits, sin remotos y sin push.

## Fase 0 — Repositorio base

- [x] Repositorio Git nuevo creado como carpeta hermana del proyecto fuente.
- [x] `main` con commit inicial `chore: inicializar repositorio`.
- [x] `.gitignore` con `node_modules/`, `dist/`, `coverage/`, `.env`, `.env.*` (excepto `.env.example`) y `mock-server/.env`.
- [x] Sin secretos versionados: `git ls-files` no muestra `.env`, claves ni certificados.
- [x] Sin remotos: `git remote -v` vacío; no se hizo push.

## Fase 1 — Mock-server

- [x] `npm run mock` levanta `http://localhost:8080/api/v1` (Express + CORS + JWT).
- [x] Contrato implementado: `/auth/login`, `/auth/refresh`, `/auth/me`, CRUD de `/productos`, `/categorias`, `/usuarios` y `/boletas` con `PUT /:id/estado` y `DELETE /:id` (anula).
- [x] Errores `{timestamp, status, error, message, path}` con 400/401/403/404/409/500.
- [x] Usuarios sembrados ADMIN y VENDEDOR; stock y totales calculados en servidor.
- [x] Evidencia (script `verificar_mock.ps1`): login ADMIN/VENDEDOR OK, sin token → 401, VENDEDOR `POST /categorias` → 403, VENDEDOR `GET /usuarios` → 403, ADMIN `GET /usuarios` → 200, boleta creada con total y estado `PAGADO`, sin stock → 409, anulación → 204.

## Fase 2 — API y sesión persistente

- [x] `src/config.js` toma `VITE_API_URL` (`.env.example` incluido; `.env` ignorado).
- [x] `src/services/api.js`: URL base, `Authorization: Bearer`, normalización de errores y refresh **single-flight** con reintento único.
- [x] Servicios REST por recurso y `AuthContext` con login, logout, restauración, refresh y sincronización `storage`.
- [x] Sin registro público y sin llamada a `/auth/me` en cada recarga (decisión en `ASSUMPTIONS.md`).
- [x] Pruebas de la capa API y de sesión incluidas en la suite.

## Fase 3 — Rutas por rol

- [x] La app abre en `/login`; sin sesión, las rutas privadas redirigen a `/login`.
- [x] `RutaProtegida` agrupa rutas comunes (ADMIN + VENDEDOR) y exclusivas de ADMIN.
- [x] Pantalla propia para 403 (`/acceso-denegado`) y para 404.
- [x] Navbar filtra enlaces con `hasRole`: VENDEDOR ve Panel, Productos y Órdenes; ADMIN ve todos.
- [x] Verificado por pruebas de `RutaProtegida` y `Navbar`.

## Fase 4 — Pantallas de gestión

- [x] Panel con resumen y stock bajo (`stock < 5`).
- [x] Productos: listado, filtro, detalle, alta, edición, baja y validaciones.
- [x] Categorías: alta, edición y baja (409 si tienen productos).
- [x] Órdenes: listado, detalle, registrar venta, cambiar estado y anular con devolución de stock.
- [x] Usuarios: alta, edición y baja lógica; el propio usuario no puede desactivarse.
- [x] Todas las pantallas consumen REST; no quedan contextos ni JSON local de la tienda antigua.
- [x] Verificado por pruebas de Login, Productos y Órdenes.

## Fase 5 — Pruebas Jasmine/Karma

- [x] `npm test` → **TOTAL: 39 SUCCESS**, 0 fallos.
- [x] 8 archivos de especificación: API, sesión, rutas, navbar, login, productos, órdenes y validaciones.
- [x] Reporte de cobertura generado en `coverage/html` e ignorado por Git.
- [x] `jsdom` por defecto (sin Chrome instalado); script `test:chrome` disponible para otro entorno.
- [x] Corrección aplicada durante la fase: `AuthContext` ahora limpia la sesión y redirige a `/login` si el refresh falla al restaurar (antes solo se hacía ante un 401 en una petición).

## Fase 6 — Documentación

- [x] `README.md` reescrito para el proyecto de gestión (roles, arranque, rutas, estructura, seguridad).
- [x] `docs/Manual_de_Usuario.md` con flujos por rol y mensajes frecuentes.
- [x] `docs/Documento_Integracion_Frontend.md` con endpoints, modelos, errores y permisos.
- [x] `docs/Guia_Presentacion.md` con guion, preguntas probables y checklist express.
- [x] `ASSUMPTIONS.md` actualizado con decisiones, trade-off de `localStorage` y detalles de pruebas.
- [x] `mock-server/README.md` con credenciales, variables y comprobación con `curl`.

## Fase 7 — Verificación final

- [x] `npm run build` → **✓ built in 5.51s**, 65 módulos, sin errores.
- [x] `npm test` → **39/39 OK** tras la documentación.
- [x] Mock-server levantado con `MOCK_ACCESS_MIN=1` (access de 60 s). Evidencia:

| Comprobación | Resultado |
| --- | --- |
| Login ADMIN / VENDEDOR | Roles `ADMIN` y `VENDEDOR`, tokens emitidos |
| `GET /productos` sin token | HTTP 401 |
| VENDEDOR `POST /categorias` | HTTP 403 |
| VENDEDOR `GET /usuarios` | HTTP 403 |
| ADMIN `GET /usuarios` | HTTP 200 |
| Access al expirar (65 s) | HTTP 401 |
| `POST /auth/refresh` con refresh token | 200, token nuevo y distinto |
| `GET /productos` con token renovado | HTTP 200 |
| `POST /auth/refresh` con refresh inválido | HTTP 401 |

- [x] Persistencia tras "recarga" (desmontar/montar), logout y cierre entre pestañas: cubiertos por `AuthContext.spec.jsx`.
- [x] Acceso denegado a `/usuarios` y `/productos/nuevo` para VENDEDOR: cubierto por `RutaProtegida.spec.jsx`.
- [x] Sin secretos en el historial; `node_modules`, `dist` y `coverage` no versionados.
- [x] Historial en Conventional Commits:

```
b8462c8 docs: agregar manual, integracion, guia de presentacion y README actualizado
1d0f6b4 test: agregar suite de API, sesion, roles y pantallas
18da9c0 feat(gestion): migrar pantallas a REST con rutas y permisos por rol
c0691c4 feat(auth): sesion persistente con refresh y cierre entre pestanas
8f4cb1b feat(api): capa fetch con refresh unico y servicios REST
4bd28d2 feat: agregar servidor mock con contrato REST y permisos por rol
0e4513d chore: inicializar repositorio
```

## Observaciones

- No se construyó el backend real: el mock-server es solo de desarrollo y se sustituye cambiando `VITE_API_URL`.
- `localStorage` se eligió para cumplir la persistencia pedida; el riesgo XSS y su mitigación están documentados en README y ASSUMPTIONS.
- Los avisos de React "not wrapped in act" aparecen por limitación de jsdom (`MessageChannel` no implementado); no afectan el resultado de la suite.
