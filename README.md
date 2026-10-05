# Alambres Tandil

Plataforma comercial de La Casa del Alambrado. Catálogo, pedido y cierre por WhatsApp. No cobra en el sitio.

## Requisitos

- Node 22
- pnpm 10
- PostgreSQL (Neon en producción)

## Puesta en marcha

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` crean el usuario administrador. El alta pública está cerrada.

## Scripts

- `pnpm dev` desarrollo
- `pnpm lint` eslint
- `pnpm typecheck` TypeScript
- `pnpm test` Vitest
- `pnpm build` genera el cliente Prisma y compila

## Datos

El stock solo cambia con un movimiento. Un pedido nuevo no reserva: la reserva empieza al pasar a confirmado. El número de WhatsApp sale de Configuración, después de `WHATSAPP_NUMBER`, y por último del teléfono de línea.
