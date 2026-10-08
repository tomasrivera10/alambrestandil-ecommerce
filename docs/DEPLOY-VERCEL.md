# Deploy en Vercel

## 1. Base de datos

Crear una base PostgreSQL en Neon y copiar la conexión con SSL (`sslmode=require`). Usar la conexión pooled para `DATABASE_URL`; en Prisma 6 Neon soporta migraciones con esa conexión. La base local de Prisma no sirve en Vercel.

Si ya hay datos locales que se quieran conservar, exportarlos e importarlos a Neon antes de desplegar. Las migraciones crean la estructura; el seed importa el catálogo del repositorio, no copia pedidos, clientes, stock ni cambios locales.

## 2. Variables del proyecto

En Vercel → proyecto → Settings → Environment Variables, configurar para **Production**:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL de Neon con SSL. |
| `BETTER_AUTH_SECRET` | Secreto nuevo generado con `openssl rand -base64 48`. |
| `BETTER_AUTH_URL` | Origen HTTPS exacto, por ejemplo `https://alambrestandil-ecommerce.vercel.app`, sin rutas. Confirmar el dominio asignado en Vercel. |
| `WHATSAPP_NUMBER` | Número internacional solo con dígitos: `5492494214973` o el definitivo del negocio. |
| `BLOB_READ_WRITE_TOKEN` | Token de un almacén Vercel Blob **público** conectado al proyecto. Necesario para subir fotos desde el panel. |
| `NEXT_PUBLIC_HERO_VIDEO_URL` | Opcional: URL HTTPS de video propio. Omitir si se usa la foto de respaldo. |

No copiar las credenciales de ejemplo. No agregar `NEXT_PUBLIC_` a secretos. Las variables se aplican al siguiente deployment.

Para Preview usar otra base, otro secreto y la URL HTTPS de ese entorno. El build no migra bases de Preview automáticamente: ejecutar `npm run db:deploy` contra esa base antes del deploy. No compartir la base de producción con previews.

## 3. Configuración y primer deploy

- Repositorio: `tomasrivera10/alambrestandil-ecommerce`, rama `main`.
- Framework: Next.js. Root Directory: `./`. Node.js: 22.x.
- Install Command: `npm ci`. Build Command: `npm run vercel-build`.
- Output Directory: dejar el valor predeterminado de Next.js.
- En la pantalla de la captura, **Prisma Postgres es opcional**: no hace falta agregarlo si usás Neon.

Subir los cambios de este repositorio a GitHub. Hacer Deploy en Vercel después de configurar las variables. `vercel.json` configura la instalación y el build; el build valida las variables, genera Prisma y aplica las migraciones pendientes únicamente en Production. No ejecuta seed en cada deploy.

## 4. Catálogo y primer administrador

Ejecutar una sola vez desde una terminal local, con `DATABASE_URL` apuntando a la base nueva de Neon. No ejecutar el seed sobre una base con catálogo personalizado sin revisar `prisma/import-catalog.ts` y `prisma/seed.ts`: actualiza productos y configuración existentes.

```bash
npm ci
# Configurar DATABASE_URL de Neon en el entorno local sin versionarla.
npm run db:deploy
read -r 'SEED_ADMIN_EMAIL?Email del administrador: '
export SEED_ADMIN_EMAIL
read -rs 'SEED_ADMIN_PASSWORD?Contraseña nueva del administrador: '
export SEED_ADMIN_PASSWORD
npm run db:seed
unset SEED_ADMIN_PASSWORD SEED_ADMIN_EMAIL
```

Los comandos `read` anteriores son para zsh (macOS). La contraseña debe tener al menos 8 caracteres; usar una larga y única. El seed crea el administrador si ese email no existe y no cambia la contraseña de un usuario existente. Estas credenciales no son necesarias en Vercel para el funcionamiento diario.

## 5. Verificación

Abrir la URL publicada y comprobar catálogo e imágenes. Entrar en `/admin/login` con el administrador creado. Crear un pedido de prueba, comprobar WhatsApp y subir una foto desde el panel. Confirmar que el pedido persiste tras recargar. Si cambia el dominio, actualizar `BETTER_AUTH_URL` y volver a desplegar.

Las fotos del repositorio se publican con la web; las fotos nuevas van a Blob. La API actual admite imágenes de hasta 8 MB localmente, pero los uploads del servidor en Vercel están sujetos al límite de cuerpo de sus Functions (4.5 MB, incluido el formulario): usar imágenes menores a 4 MB.

Referencias: [Prisma 6 en Vercel](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-vercel), [límites de Functions](https://vercel.com/docs/functions/limitations).
