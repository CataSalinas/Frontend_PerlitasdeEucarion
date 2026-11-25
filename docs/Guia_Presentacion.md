# Guía de presentación — Gestión interna Perlitas de Eucarión

Guion para demostrar el trabajo en 5–7 minutos. Todo se hace en el navegador; no hace falta mostrar código salvo en los momentos indicados.

## Antes de empezar

```bash
npm install
npm run mock     # terminal 1
npm run dev      # terminal 2
npm test         # comprobar: 39 SUCCESS
npm run build    # comprobar: build correcto
```

Tener a mano las credenciales:

- ADMIN: `admin@perlitas.cl` / `Admin123!`
- VENDEDOR: `vendedor@perlitas.cl` / `Vendedor123!`

Si se quiere mostrar refresh, antes de levantar el mock poner `MOCK_ACCESS_MIN=1` en `mock-server/.env`.

## Guion

### 1. Planteamiento (30 s)

"El proyecto anterior era la tienda pública con datos en `localStorage`. Esta entrega es el **frontend de gestión interna**: React + Vite + Bootstrap, sin carrito ni registro público, conectado por REST al backend Spring Boot. Mientras el backend no está disponible usamos un mock-server con el mismo contrato."

### 2. Acceso y sesión (1 min)

1. Abrir `http://localhost:5173` → muestra `/login`.
2. Ingresar como ADMIN → panel.
3. **Recargar** (`F5`) → sigue dentro, sin volver al login.
4. Abrir una segunda pestaña en `/panel` → también dentro. Cerrar sesión en una → la otra vuelve al login.

Mensaje clave: "La sesión persiste con tokens en `localStorage`; cerrar sesión se sincroniza entre pestañas con el evento `storage`."

### 3. Panel y productos (1 min)

1. Mostrar las tres tarjetas del panel (productos, órdenes, stock bajo).
2. Ir a **Productos**, filtrar por categoría, entrar a **Ver**.
3. Como ADMIN, crear un producto nuevo con datos válidos y mostrar el mensaje de éxito.
4. Intentar guardar con precio actual mayor al anterior → mostrar la validación.

Mensaje clave: "Los formularios validan en el cliente, pero el servidor vuelve a validar y devuelve errores con `message`."

### 4. Roles (1 min) — momento fuerte

1. Cerrar sesión e ingresar como **VENDEDOR**.
2. Mostrar que el navbar solo tiene Panel, Productos y Órdenes.
3. Escribir en la barra de direcciones `/usuarios` → **Acceso denegado**.
4. Escribir `/productos/nueva` (o `/productos/nuevo`) → **Acceso denegado**.
5. En `/ordenes`, mostrar que no hay selector de estado ni botón **Anular**.

Mensaje clave: "React oculta controles por usabilidad; la seguridad real la impone el backend con 401/403. Si el vendedor llama a la API por consola, el servidor responde 403."

### 5. Órdenes (1 min)

1. Volver a login como ADMIN.
2. **Registrar venta**: agregar un producto, completar cliente y entrega, registrar.
3. Mostrar el mensaje con el total confirmado por el servidor y la boleta en el listado.
4. Cambiar el estado a `En preparación` y después anular; mostrar que el stock se devuelve.

Mensaje clave: "El total lo calcula el servidor; el frontend solo muestra un estimado. Al anular se devuelve el stock una sola vez."

### 6. Categorías y usuarios (30 s)

1. Crear una categoría y editarla.
2. En **Usuarios**, crear un usuario VENDEDOR y dar de baja a otro. Mostrar que el propio usuario no puede desactivarse.

### 7. Integración y pruebas (1 min)

1. Mostrar `.env.example` con `VITE_API_URL`.
2. Mostrar el contrato en `docs/Documento_Integracion_Frontend.md`: tabla de endpoints y modelo de error.
3. Mostrar la salida de `npm test` (39 pruebas) y el reporte de cobertura en `coverage/html/index.html`.
4. Mostrar `git log --oneline`: commits pequenos y en Conventional Commits, sin push.

Mensaje clave: "Cambiar `VITE_API_URL` permite apuntar al Spring Boot sin tocar código; las pruebas mockean `fetch`, así que son independientes del servidor."

### 8. Cierre (30 s)

"Decisiones relevantes están en `ASSUMPTIONS.md`. El trade-off de `localStorage` frente a cookie HttpOnly está documentado en el README: se acepta para cumplir la persistencia pedida y se mitiga con validación en el backend, refresh único y cierre forzado ante 401."

## Preguntas probables

| Pregunta | Respuesta corta |
| --- | --- |
| ¿Por qué `localStorage` y no cookies? | Persiste recargas sin cambiar el contrato del backend. Es legible por JS (riesgo XSS), por eso el backend es la autoridad. |
| ¿Cómo se renueva el token? | Un `refresh` single-flight ante 401 o al detectar `exp` vencido al recargar; se reintenta la petición una sola vez. |
| ¿El frontend puede crear un producto siendo vendedor? | La UI no lo deja y el backend responde 403. Ocultar botones no es la seguridad. |
| ¿Qué pasa si el backend no está? | Se levanta `npm run mock`; implementa el mismo contrato. |
| ¿Hay base de datos? | No en el frontend ni en el mock; el backend real será la fuente de verdad. |
| ¿Cómo se cambia a producción? | `npm run build` y `VITE_API_URL` apuntando al backend. No hay secretos versionados. |
| ¿Qué cubren las pruebas? | API/refresh, sesión, rutas por rol, navbar, login, listados y validaciones. |

## Checklist express antes de presentar

- [ ] `npm test` en verde (39/39).
- [ ] `npm run build` en verde.
- [ ] Mock-server corriendo y credenciales probadas.
- [ ] `MOCK_ACCESS_MIN=1` solo si se va a demostrar refresh.
- [ ] Pestaña limpia: cerrar sesión antes de empezar.
