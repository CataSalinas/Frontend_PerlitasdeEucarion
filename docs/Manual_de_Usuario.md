# Manual de usuario — Gestión interna Perlitas de Eucarión

Aplicación para el personal de la tienda. Se usa con **correo y contraseña**; no existe registro público. Según el rol se muestran más o menos opciones.

## 1. Ingresar

1. Abrir `http://localhost:5173`. Verá la pantalla de **Ingreso** (`/login`).
2. Escribir el correo y la contraseña entregados por el administrador.
3. Presionar **Ingresar**.

Con el mock-server puede probar:

| Correo | Contraseña | Rol |
| --- | --- | --- |
| `admin@perlitas.cl` | `Admin123!` | ADMIN |
| `vendedor@perlitas.cl` | `Vendedor123!` | VENDEDOR |

Si las credenciales están mal aparece `Correo o contraseña incorrectos.` Si el servidor no responde: `No se pudo conectar con el servidor. Intente más tarde.`

Después de ingresar se abre el **Panel de gestión**. La barra superior muestra el nombre, el rol y el botón **Cerrar sesión**.

> La sesión queda guardada en el navegador: al recargar la página o abrir otra pestaña se mantiene. Si se cierra sesión en una pestaña, se cierra en todas.

## 2. Panel de gestión

Muestra tres tarjetas: cantidad de productos registrados, órdenes/boletas y productos con **stock bajo (menor a 5)**. Incluye accesos rápidos y un botón **Actualizar datos**.

Los accesos rápidos de categorías, usuarios, nuevo producto y registrar venta solo aparecen para **ADMIN**.

## 3. Productos (`/productos`)

- **Ver todos:** tabla con ID, nombre, categoría, precio actual, stock y acciones.
- **Filtrar:** elegir una categoría en `Filtrar por categoría` o dejar `Todas`.
- **Ver detalle:** botón **Ver** en la fila → `/productos/:id` muestra descripción, precios, stock y categoría.
- **ADMIN** además ve **Nuevo producto**, **Editar** y **Eliminar**.
  - `Nuevo producto` abre `/productos/nuevo`; `Editar` abre `/productos/:id/editar`.
  - Campos: nombre, descripción, categoría, precio anterior, precio actual y stock.
  - Validaciones: nombre y categoría obligatorios; precios y stock ≥ 0; el precio actual no puede superar al anterior.
  - **Guardar** muestra un mensaje de éxito en el listado. **Cancelar** vuelve sin cambios.
  - **Eliminar** pide confirmación. Si falla (por ejemplo, por restricciones del backend), se muestra el mensaje de error.
- **VENDEDOR:** solo puede listar y ver detalle; no ve los botones de escritura. Si intenta entrar a `/productos/nuevo` o `/productos/:id/editar`, ve la pantalla de **Acceso denegado**.

## 4. Categorías (`/categorias`, solo ADMIN)

- Escribir el nombre en **Nueva categoría** y presionar **Guardar**.
- **Editar** carga el nombre en el formulario; se puede **Cancelar**.
- **Eliminar** pide confirmación. Si la categoría tiene productos asociados, el backend responde `409` y se muestra ese mensaje: primero hay que mover o eliminar esos productos.

## 5. Órdenes / boletas (`/ordenes`)

El listado muestra número, fecha, cliente, vendedor, total, estado y acciones.

- **Ver** abre el detalle: datos del cliente y entrega, tabla de productos (cantidad, precio unitario y subtotal) y total calculado por el servidor.
- **VENDEDOR:** puede consultar el listado y el detalle.
- **ADMIN** además puede:
  - **Registrar venta** (`/ordenes/nueva`): elegir producto y cantidad, agregar items, completar nombre, apellidos, correo, calle, número, región, comuna e indicaciones opcionales, y presionar **Registrar venta**. El total mostrado es estimado; el definitivo lo calcula el servidor y se informa al volver al listado. No se pueden agregar más unidades que el stock disponible.
  - Cambiar el **estado** con el selector: `Pagado`, `En preparación`, `Entregado` o `Cancelado`.
  - **Anular** una boleta (pide confirmación). Devuelve el stock una sola vez. Las boletas ya canceladas no muestran el botón.

Si no hay stock suficiente al registrar, aparece un aviso como `Stock insuficiente para ...` y la venta no se crea.

## 6. Usuarios (`/usuarios`, solo ADMIN)

- **Nuevo usuario:** nombre, apellidos, correo, contraseña (mínimo 6 caracteres) y rol (`VENDEDOR` o `ADMIN`). Presionar **Crear usuario**.
- **Editar:** se convierten los campos de la fila en inputs; se puede cambiar nombre, apellidos, correo, rol y estado activo, y luego **Guardar** o **Cancelar**.
- **Dar de baja:** pide confirmación. Es una baja lógica: el usuario deja de estar activo y no puede iniciar sesión.
- No se puede desactivar ni dar de baja al usuario con el que se está trabajando (se muestra la etiqueta **Usted** y la acción queda deshabilitada).

Un VENDEDOR que intente abrir `/usuarios` ve **Acceso denegado**.

## 7. Cerrar sesión

Presionar **Cerrar sesión** en la barra superior. Se borran los datos guardados y se vuelve a `/login`. Para volver a entrar hay que ingresar credenciales nuevamente.

## 8. Mensajes frecuentes

| Situación | Mensaje / comportamiento |
| --- | --- |
| Sin sesión en una ruta privada | Redirección automática a `/login`. |
| Rol sin permiso | Pantalla **Acceso denegado** (403 de la SPA). |
| Token vencido | Se renueva solo; si no se puede, se cierra la sesión. |
| Error del servidor | Se muestra el `message` devuelto por la API en un aviso rojo. |
| Sin conexión | `No se pudo conectar con el servidor`. |
| Ruta inexistente | Página **No encontrado**. |
