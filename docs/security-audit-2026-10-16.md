# Auditoría de seguridad — 16 de octubre de 2026

Revisión estática del estado local, incluidos cambios sin commit. No se modificó el código de la aplicación ni se enviaron ataques a producción. Se revisaron autenticación, permisos, acciones del servidor, rutas API, consultas públicas, stock, archivos y configuración. Esto no certifica la infraestructura ni descarta vulnerabilidades adicionales.

## Hallazgos

### 1. Alta: el límite de formularios públicos depende de un teléfono controlado por el atacante

Ubicación: `src/server/orders/actions.ts:25-32` y `src/server/quotes/actions.ts:40-44`.

El único límite de creación es contar registros por teléfono en el último minuto. El teléfono no se verifica: basta alternar números de longitud válida para seguir creando clientes, pedidos, consultas e ítems. Además, contar y crear son operaciones separadas, por lo que solicitudes simultáneas pueden superar el límite del mismo teléfono. Impacto: spam administrativo, crecimiento de la base y consumo de recursos sin autenticación. El rate limit de Better Auth no protege estas acciones.

Corrección: limitador compartido y atómico por IP confiable y por teléfono, con presupuesto global de escritura; añadir un desafío antibot cuando se detecte abuso. Verificar qué cabecera de IP normaliza el proveedor de despliegue.

### 2. Alta si se usan los ejemplos: se aceptan credenciales públicas de configuración

Ubicación: `.env.example:2,6-7`, `src/server/env.ts:25-28`, `scripts/vercel-build.mjs:7` y `prisma/seed.ts:48-69`.

El secreto de ejemplo supera los 32 caracteres y no coincide con el único valor prohibido; pasa tanto la validación de producción como la del build. El seed también acepta la contraseña de ejemplo y crea una cuenta ADMIN con correo predecible si todavía no existe. Copiar estos valores y ajustar las URLs permite desplegar con credenciales conocidas. No se comprobó que producción las esté usando. Conocer el secreto no demuestra por sí solo poder fabricar una sesión válida, porque las sesiones también se consultan en base de datos.

Corrección: rechazar explícitamente los placeholders en build, runtime y seed; generar un secreto aleatorio y exigir una contraseña administrativa distinta del ejemplo. Si ya se usaron, rotar los valores reales, actualizar la contraseña de la cuenta existente e invalidar sesiones. El seed no actualiza contraseñas de usuarios existentes.

### 3. Media: cargas de proveedores sin límite previo al parseo del cuerpo

Ubicación: `src/app/api/admin/supplier-lists/route.ts:13` y `src/app/api/admin/supplier-lists/chunks/route.ts:14`.

Ambas rutas ejecutan `request.formData()` antes de comprobar el tamaño del archivo. Un usuario ADMIN o STOCK, o alguien con su sesión, puede enviar un multipart mucho mayor al permitido y consumir recursos antes del rechazo. La ruta de imágenes ya resuelve este problema con `readUploadForm`; las de proveedores no aplican ese patrón. La exposición real depende también del límite de cuerpo impuesto por el hosting.

Corrección: limitar los bytes leídos antes del parseo, también sin Content-Length, reutilizando el lector acotado. Añadir cuotas y límites de concurrencia para importaciones. El límite de 32 MB comprimidos tampoco establece por sí solo un presupuesto de memoria para XLSX/DOCX descomprimidos; evaluar el aislamiento y los límites del procesamiento como endurecimiento adicional.

### 4. Dependencias: alertas conocidas que requieren análisis de alcance

`npm audit --omit=dev --json` informó 8 paquetes afectados: 3 con severidad alta y 5 moderada, sin críticos. Son tres avisos raíz propagados por dependencias; no ocho fallos independientes ni ocho ataques remotos demostrados.

- `deepmerge-ts` → `@prisma/config` → `prisma`: agotamiento de pila con objetos recursivos. Prisma se utiliza durante generación y migraciones; no se demostró entrada pública capaz de alcanzar esa operación.
- `sprintf-js` → `argparse` → `mammoth`: denegación de servicio por precisión sin límite. No se demostró que un DOCX alcance la función vulnerable con ese parámetro.
- `uuid` → `exceljs`: comprobación insuficiente de límites cuando se proporciona un buffer a ciertas variantes de UUID. No se demostró que el importador invoque esa combinación.

Referencias: https://github.com/advisories/GHSA-ggr8-5vv4-36mx, https://github.com/advisories/GHSA-hp3w-g68c-fv3c, https://github.com/advisories/GHSA-w5hq-g745-h8pq.

Corrección: estudiar actualizaciones u overrides compatibles y probar importaciones, generación y migraciones. No ejecutar `npm audit fix --force` automáticamente: las soluciones propuestas incluyen cambio mayor de Prisma y retrocesos de ExcelJS/Mammoth.

## Controles observados

- `requireArea` verifica sesión y rol en el servidor en las mutaciones administrativas revisadas; las rutas de proveedores también lo usan. La carga de imágenes implementa una comprobación equivalente ADMIN/STOCK.
- Registro de cuentas público deshabilitado; rol no editable por la entrada de usuario; sesiones de ocho horas consultadas en base; cookies HttpOnly, SameSite y Secure en producción.
- Login limitado a cinco solicitudes por minuto según la configuración. Su resistencia real requiere validar la resolución de IP detrás del proxy.
- Consultas mediante Prisma y SQL etiquetado; no se encontraron usos de SQL raw inseguro ni ejecución de comandos con datos públicos en los caminos inspeccionados.
- Precios HIDDEN filtrados en las consultas públicas; el pedido no los suma al total público ni retorna sus líneas internas.
- Los movimientos, recuentos, ventas y transiciones de pedidos revisados usan transacciones Serializable, guardan historial y comprueban stock disponible o reservado.
- Origen comprobado en cargas; imágenes limitadas por bytes y firma básica; URLs de mercado restringidas a HTTPS y dominios permitidos, sin seguir redirecciones.
- Cabeceras contra framing, MIME sniffing y HSTS de producción. La CSP actual no restringe scripts: es una defensa parcial, no una mitigación completa de XSS.

## Verificación y límites

Pasaron 52 pruebas de seis archivos: RBAC, entorno, límites de imágenes, consultas/precios públicos, URLs de mercado y stock. Son pruebas existentes; no equivalen a una prueba de penetración ni reproducen todos los hallazgos anteriores.

La consulta npm inicialmente falló por DNS del entorno restringido; el reintento con acceso de red obtuvo el informe. No se inspeccionaron valores secretos reales ni el historial completo de Git. No se verificaron HTTPS/cabeceras desplegadas, WAF, límites del proxy, permisos de PostgreSQL, backups/restauración, logs y alertas. No se realizaron pruebas de carga ni explotación de archivos maliciosos.

Endurecimiento recomendado: MFA para administración, CSP con política de scripts compatible con Next.js y verificación operativa de backups, alertas e IP confiable. Estas recomendaciones no constituyen una explotación demostrada.
