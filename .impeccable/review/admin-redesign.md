# Panel de administración · primera etapa

Implementación del plan aprobado: navegación directa por rol, inicio orientado a tareas, catálogo compacto, stock con búsqueda global y confirmación, y ficha organizada por tareas con enlaces estables. Se conservan las rutas y acciones del servidor. La fotografía de materiales, el fondo claro cálido, el carbón y el rojo construyen la dirección «mostrador y materiales».

## Validación

- Compilación de producción con Webpack: correcta.
- TypeScript y ESLint de las áreas modificadas: correctos.
- Vitest: 22 archivos, 90 pruebas correctas; incluye aislamiento de consultas del inicio por rol y bloqueo de acciones directas de inventario para VENDEDOR.
- Navegador: ADMIN, VENDEDOR y STOCK; menú correspondiente a cada rol y tareas autorizadas. Los accesos de pendientes del inicio aplican el filtro correspondiente en pedidos.
- Catálogo: búsqueda por nombre y filtros, producto sin foto y producto sin presentaciones. La ficha conserva datos sin guardar al pasar de Datos a Fotos y regresar.
- Stock: búsqueda global sin elegir categoría, sin resultados y navegación por teclado hacia el filtro de categoría. Físico, reservado y disponible visibles en móvil.
- Transacción de ingreso real en base local: físico 20 → 24, reservado 3, disponible 17 → 21; movimiento de 4 registrado en historial.
- Recuento local rechazado por quedar bajo la reserva: saldo e historial conservados. El formulario también bloquea el recuento e informa la reserva.
- Anchos comprobados: 1440 px y 390 px, sin desborde del documento. Catálogo y stock se apilan en móvil; historial conserva desplazamiento horizontal dentro de su región.
- Detector de diseño: sin hallazgos bloqueantes; 93 avisos sobre valores respecto de la dirección anterior. Se documentó la dirección aprobada y su escala en DESIGN.md y en el brief del panel.

Las capturas usan únicamente datos sintéticos en una base PostgreSQL local aislada. No se escribieron datos en la base remota. El servidor y la base de prueba se detuvieron al terminar. No se realizó despliegue.

## Capturas

- admin-redesign-catalog-desktop.jpg
- admin-redesign-catalog-mobile.jpg
- admin-redesign-stock-mobile.jpg
