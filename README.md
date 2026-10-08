# Alambres Tandil

Plataforma comercial de La Casa del Alambrado. Catálogo, pedido y cierre por WhatsApp. No cobra en el sitio.

## Requisitos

- Node 22
- npm 10 (incluido con Node)
- PostgreSQL (Neon en producción)

## Puesta en marcha

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Para trabajar en esta máquina con la base local existente, basta con:

```bash
npm run dev
```

El paso `predev` inicia automáticamente la base Prisma local `alambrestandil` cuando `DATABASE_URL` apunta a los puertos locales 51213/51214. Si ya está encendida, continúa directamente. Con una base externa, usa la conexión configurada sin iniciar Prisma local.

La base queda en segundo plano al cerrar la web con `Ctrl + C`. Para apagarla: `npm run db:stop`. Para iniciarla por separado: `npm run db:start`.

En una máquina nueva, primero configurá PostgreSQL y el archivo `.env` siguiendo la puesta en marcha. El arranque automático usa la base local existente; no recrea ni carga datos.

`SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` crean el usuario administrador. El alta pública está cerrada.

## Scripts

- `npm run dev` desarrollo
- `npm run lint` eslint
- `npm run typecheck` TypeScript
- `npm test` Vitest
- `npm run build` genera el cliente Prisma y compila

## Datos

El stock solo cambia con un movimiento. Un pedido nuevo no reserva: la reserva empieza al pasar a confirmado. El número de WhatsApp sale de Configuración, después de `WHATSAPP_NUMBER`, y por último del teléfono de línea.

## Seguridad del panel

Acceso desde “Administración” en el footer, en `/admin/login`. No hay registro público. Cada página con datos internos y cada acción administrativa comprueba sesión y rol en el servidor. STOCK entra a inventario; VENDEDOR accede a pedidos, clientes y cotizaciones; ADMIN tiene acceso completo. “Cerrar sesión” revoca la sesión en el servidor.

Antes de producción:

- Configurar `BETTER_AUTH_URL` con el dominio HTTPS exacto y `BETTER_AUTH_SECRET` aleatorio y único de al menos 32 caracteres (por ejemplo, `openssl rand -base64 48`). No compartirlo ni versionarlo. El servidor rechaza la configuración insegura.
- Ejecutar `npx prisma migrate deploy` antes de iniciar la versión nueva. Incluye `RateLimit`, necesaria para limitar el login entre instancias (5 intentos por minuto por IP). El proxy de despliegue debe sobrescribir los encabezados IP de clientes; no aceptar un `X-Forwarded-For` arbitrario desde Internet.
- Usar una contraseña administrativa única y larga. Retirar `SEED_ADMIN_PASSWORD` del entorno después del alta y rotarla si alguna vez se compartió. No usar las credenciales de ejemplo en producción.
- Mantener HTTPS, base de datos sin acceso público innecesario, copias de seguridad, acceso restringido a logs y revisión periódica de dependencias con `npm audit`.

Las sesiones duran como máximo 8 horas sin renovación automática y usan cookies HttpOnly, SameSite y Secure en producción. Los precios HIDDEN se eliminan de los datos públicos antes de serializarlos. Los formularios públicos no modifican perfiles de clientes existentes. Las subidas verifican sesión, rol, origen, tamaño y firma JPG/PNG/WebP.

Estas medidas no equivalen a una auditoría externa ni garantizan ausencia de vulnerabilidades. El límite por teléfono en formularios públicos no sustituye protección contra bots en el perímetro. La CSP actual protege contra marcos, objetos y cambios de base/formulario; no es una política estricta de scripts con nonce. MFA y protección distribuida contra abuso de formularios quedan como mejoras pendientes.

Revisión del 7 de octubre de 2026: `npm audit --omit=dev` informa 3 entradas de severidad alta (`prisma`, `@prisma/config`, `deepmerge-ts`), provenientes de una misma alerta de agotamiento de pila al combinar objetos recursivos: https://github.com/advisories/GHSA-ggr8-5vv4-36mx. La ruta observada es la herramienta de configuración de Prisma, no un formulario público. No se aplicó el downgrade incompatible sugerido por npm. Debe revisarse una actualización compatible de Prisma antes de declarar cerrada la auditoría. shadcn se clasificó como herramienta de desarrollo; eso reduce el alcance de producción, pero no elimina las alertas de las herramientas en la auditoría completa.

## Deploy en Vercel

Ver [la guía de despliegue](docs/DEPLOY-VERCEL.md) para Neon, variables, Vercel Blob y carga inicial. El build de Vercel aplica las migraciones en Production; el catálogo y el administrador se cargan una sola vez desde una terminal.
