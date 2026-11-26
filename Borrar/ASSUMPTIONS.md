# Supuestos y decisiones (ASSUMPTIONS)

Este archivo registra las decisiones tomadas ante ambigüedades del enunciado, para poder defenderlas oralmente.

## Repositorio y origen

- El frontend base se copió del proyecto existente en `Frontend_PerlitasdeEucarion` (directorio de trabajo de la sesión), que contiene el mismo código que el proyecto de la tienda. No se creó una ruta distinta porque el directorio indicado en el enunciado no existe como subcarpeta, pero sí está disponible como proyecto raíz en el workspace.
- No se copió la carpeta `Documentacion/` del proyecto anterior: contiene informes de la Evaluación 2 (tienda pública) y no corresponden a este repositorio. La documentación nueva se escribe en `docs/`.
- Se conserva el commit inicial (`chore: inicializar repositorio`) con el código heredado; las vistas de tienda se eliminan en commits posteriores para que el historial muestre la migración.

## Enfoque de la aplicación

- "Órdenes" y "boletas" se tratan como el mismo concepto de negocio. En la UI se usa el término **Órdenes / boletas** y en la API el recurso `/boletas`.
- El estado inicial de una boleta creada es `PAGADO`, según los valores permitidos por el contrato.
- Para el panel se considera "stock bajo" un producto con `stock < 5`.
- La baja de usuarios es lógica (`activo: false`); el backend debe filtrarlos al autenticar.
- No existe registro público: el formulario de usuarios solo está disponible para ADMIN.

## Sesión

- Se guardan `accessToken`, `refreshToken` y el objeto `usuario` en `localStorage` bajo claves con prefijo `perlitas_`. Es la opción pedida para sobrevivir recargas. El trade-off (riesgo XSS frente a cookie HttpOnly) se documenta en el README.
- Al restaurar la sesión se decodifica el claim `exp` del JWT. Si el access token está vencido se intenta un único refresh; si falla se limpia la sesión y se envía a `/login`.
- No se llama a `/auth/me` en cada recarga: el claim `exp` y el refresh determinan si la sesión sigue viva. Esto evita una petición extra y hace la restauración predecible en pruebas. El backend sigue siendo la autoridad: cualquier 401 vuelve a disparar refresh/logout.
- Si el refresh falla **durante la restauración** (no durante una petición), `AuthContext` también limpia la sesión y redirige a `/login`: `apiFetch` solo cierra la sesión cuando hay un 401 en una petición, y al recargar todavía no existe esa petición.
- El mock-server usa una clave JWT **solo de desarrollo** configurable por `MOCK_JWT_SECRET`; el valor por defecto no es un secreto real y nunca debe usarse con el backend de producción.

## Permisos

- La restricción por rol en React es una capa de usabilidad: oculta enlaces y botones. La seguridad real la impone el backend con 401/403; el frontend no confía en el rol del localStorage para autorizar escrituras.
- VENDEDOR puede ver productos y órdenes (listado y detalle), pero no puede crear, editar, eliminar, cambiar estados ni acceder a categorías/usuarios.

## Pruebas

- No hay Chrome/Chromium instalado en el entorno, por lo que `npm test` se configura con el launcher `jsdom` (Jasmine + Karma se mantienen). Se conserva un script `test:chrome` para ejecutar con ChromeHeadless donde esté disponible.
- La suite final tiene 39 pruebas en 8 archivos de especificación. jsdom no implementa `MessageChannel`, que es lo que usa `act(async () => ...)`: las pruebas que esperan efectos asíncronos usan el helper `drenarEfectos()` de `test/helpers.jsx` en lugar de envolverlas en `act`. Por eso aparecen avisos de "update not wrapped in act" pero la suite pasa completa.
- `test/setup.js` limpia `localStorage` antes de cada prueba y el DOM después, porque karma-webpack compila cada spec por separado y los elementos de una prueba podían filtrarse en la siguiente.

## Mock-server

- Eliminar una categoría que tenga productos asociados responde 409 para no dejar productos huérfanos.
- Anular una boleta devuelve el stock una sola vez; si ya estaba anulada, la operación es idempotente.
- El mock-server reinicia sus datos al detenerlo: la persistencia en memoria es intencional, porque el backend real será la fuente de verdad.
