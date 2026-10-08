# Auditoría de Neon y Vercel — 8 de octubre de 2026

**Dictamen: no aprobar todavía el pase a producción del conjunto actual.**

Se revisaron el despliegue activo `6ea6639`, los cambios locales de integración y las nuevas operaciones administrativas presentes en el directorio. Estos últimos archivos cambiaron durante la auditoría; el resultado debe repetirse sobre un commit cerrado antes de publicar. Esta auditoría no aplicó migraciones, no ejecutó el seed y no modificó datos ni variables de Vercel.

## Hallazgos

### 1. P1 — El despliegue activo no incluye el motor de Prisma

Los logs de Vercel registran `PrismaClientInitializationError`: falta `libquery_engine-rhel-openssl-3.0.x.so.node`. El catálogo devuelve HTTP 200 con el mensaje de indisponibilidad; comprobar únicamente el estado HTTP no detecta esta caída.

La corrección existe localmente en `prisma/schema.prisma:4` y `next.config.ts:6`, pero no está en el commit publicado. La compilación alternativa con Webpack incluyó el motor en las 38 trazas de páginas y route handlers examinadas. Esto valida ese artefacto local; falta verificar el paquete generado por el build habitual de Vercel y su ejecución real.

Acción: publicar la corrección en un despliegue de validación y comprobar productos reales, categorías, detalle y búsqueda, además de ausencia del error en los logs.

### 2. P2 — Las subidas prometen tamaños que Vercel rechaza

`src/app/api/upload/route.ts:33` admite fotos de 8 MiB, y `src/app/api/admin/supplier-lists/route.ts:16` admite documentos de 12 MiB. Ambas interfaces anuncian esos tamaños y envían el archivo a una Function. Vercel limita el cuerpo a 4,5 MB, incluido multipart; un archivo de 6 MB falla antes de alcanzar las validaciones de la aplicación. Los clientes intentan interpretar la respuesta como JSON, lo que además puede mostrar un error de parseo.

Acción: limitar archivos a un tamaño conservador menor al límite del cuerpo y validar antes de enviarlos, o implementar subida directa a Blob con autorización. Manejar respuestas no JSON del proveedor.

Referencia: https://vercel.com/docs/functions/limitations

### 3. P2 — Las operaciones con muchas filas conservan el timeout de transacción de 5 segundos

`src/features/suppliers/actions.ts:18` aprueba una lista mediante un `upsert` secuencial por fila dentro de una transacción sin timeout explícito. `src/features/crm/actions.ts:12` también procesa secuencialmente los movimientos de cada línea de un pedido. El cliente compartido en `src/lib/db.ts` no cambia las opciones de transacción. El timeout de 300 segundos del seed sólo pertenece al cliente de ese script.

Cuando el lote y la latencia de Neon suman más de 5 segundos, Prisma cancela y revierte la operación. Es un fallo condicionado al volumen y la latencia, identificado por inspección; no se provocaron escrituras ni aprobaciones en producción para reproducirlo.

Acción: reducir viajes mediante operaciones por lotes, limitar el tamaño de las operaciones y fijar un presupuesto de tiempo explícito compatible con la Function. Probar una lista representativa en una base de ensayo.

Referencia: https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions#transaction-options

### 4. P2 — Conflictos de transacciones serializables sin reintento

`src/features/inventory/ledger.ts:48`, `src/features/crm/actions.ts:27` y `src/features/sales/actions.ts:35` usan aislamiento `Serializable`, pero no manejan `P2034`. Dos operadores que modifican el mismo inventario pueden provocar que una operación legítima falle por conflicto. El aislamiento protege los datos, pero no completa automáticamente la operación rechazada.

Acción: añadir reintentos limitados de la transacción completa para `P2034`, conservando la validación del estado en cada intento. Probar concurrencia en una base aislada.

Referencia: https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions#transaction-timing-issues

### 5. P1 — Un pedido puede persistir aunque el cliente reciba un error

`src/features/orders/actions.ts:102` confirma la creación del pedido. Después realiza otra escritura en `:117` y una lectura de configuración al construir la respuesta en `:136`. Si Neon falla en cualquiera de estas operaciones posteriores, la acción rechaza la solicitud aunque el pedido ya exista. Reenviar el formulario genera otro número: no hay clave de idempotencia. El límite por teléfono no elimina los duplicados.

Acción: completar las escrituras necesarias en una única transacción, resolver la configuración antes del commit o con una alternativa segura, y hacer idempotente el envío para tolerar también la pérdida de la respuesta. Este riesgo ya estaba en el flujo; importa al evaluar su uso con una base remota. No se crearon pedidos para reproducirlo en producción.

### 6. P2 — Preview no tiene las variables obligatorias

En el panel de Vercel, `DATABASE_URL`, `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` están asignadas a Production. `scripts/vercel-build.mjs:4` exige las tres en cualquier entorno, por lo que un Preview con la configuración observada falla antes de compilar. Blob sí aparece asignado a Production y Preview.

Acción: configurar una base/branch de Neon y credenciales de autenticación de ensayo para Preview, con su origen HTTPS, y aplicar allí las migraciones explícitamente. El script sólo migra automáticamente Production.

## Verificaciones realizadas

- Neon respondió a consultas de sólo lectura: 31 productos, 94 variantes, 86 variantes activas, 15 imágenes y un administrador.
- No se encontraron inventarios negativos ni existencias físicas menores a las reservadas.
- Ninguna imagen de la base consultada apunta a `/uploads/`, que no sería persistente en Vercel.
- Las cuatro migraciones aplicadas terminaron correctamente y sus checksums coinciden con los archivos locales.
- Está pendiente `20261008190000_admin_operations`. Es una condición de despliegue del panel nuevo, no evidencia de una migración fallida. Su SQL agrega tablas; no elimina las existentes.
- Las variables obligatorias y el token de Blob están presentes para Production. No se revelaron sus valores; no se certificó su contenido ni el acceso público del almacén mediante una subida.
- 49 pruebas pasaron. TypeScript, Prisma Validate, ESLint y `git diff --check` pasaron en sus últimas ejecuciones. El primer ESLint detectó un error en métricas que desapareció tras una modificación concurrente.
- `next build` con Turbopack no pudo validarse en este entorno: falló al abrir un puerto para procesar CSS (`Operation not permitted`). Es una limitación de la ejecución de auditoría, no un bug demostrado de Vercel.
- `next build --webpack` terminó correctamente con un secreto efímero y un origen HTTPS de validación, sin modificar `.env`. Las 38 trazas de páginas/rutas incluyen el motor Linux de Prisma.
- `npm audit --omit=dev` devuelve 8 entradas: 3 altas y 5 moderadas. Varias son cadenas de dependencias de una misma alerta. Las altas corresponden a `deepmerge-ts` vía la herramienta Prisma; las moderadas incluyen `uuid` vía ExcelJS y `sprintf-js` vía Mammoth. No se demostró explotación desde una entrada pública. Los downgrades incompatibles sugeridos por npm no se aplicaron.

## Condiciones para aprobar

1. Cerrar un commit con la corrección del motor y la migración correspondiente al código que se publicará.
2. Corregir los límites de subida y los fallos de transacciones/envío de pedidos indicados arriba.
3. Desplegar y probar con una base aislada de producción, incluyendo listas grandes, concurrencia y reenvíos de pedidos.
4. Validar el build habitual de Vercel, la inclusión del motor y el contenido real del catálogo; un deployment Ready o un HTTP 200 no bastan.
5. Verificar login/logout, permisos de roles, subida/persistencia de una imagen en Blob y un flujo completo de pedido en el entorno de ensayo.
6. Revisar las alertas de dependencias y verificar recuperación/copia de seguridad en Neon antes del cambio productivo. No se comprobó la política de backups ni se ejecutó una restauración durante esta auditoría.
