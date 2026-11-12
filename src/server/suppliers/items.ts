"use server";

import { z } from "zod";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";

const inputSchema = z.object({
  supplierId: z.string().min(1),
  query: z.string(),
  after: z
    .object({ name: z.string(), id: z.string().min(1) })
    .nullable()
    .default(null),
});

export async function loadSupplierItems(input: z.input<typeof inputSchema>) {
  await requireArea("suppliers");
  const { supplierId, query, after } = inputSchema.parse(input);
  const rows = await prisma.supplierItem.findMany({
    where: {
      supplierId,
      AND: [
        ...(query
          ? [
              {
                OR: [
                  { name: { contains: query, mode: "insensitive" as const } },
                  { code: { contains: query, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
        ...(after
          ? [{ OR: [{ name: { gt: after.name } }, { name: after.name, id: { gt: after.id } }] }]
          : []),
      ],
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 21,
    select: {
      id: true,
      name: true,
      code: true,
      unit: true,
      purchased: true,
      updatedAt: true,
      listPrice: true,
      variant: {
        select: {
          productId: true,
          inventory: { select: { onHand: true, reserved: true, minStock: true } },
          product: {
            select: {
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
            },
          },
        },
      },
    },
  });
  const items = rows.slice(0, 20).map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    unit: item.unit,
    purchased: item.purchased,
    updatedAt: item.updatedAt.toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
    }),
    cost: item.listPrice == null ? null : Number(item.listPrice),
    productId: item.variant?.productId ?? null,
    image: item.variant?.product.images[0] ?? null,
    inventory: item.variant?.inventory ?? null,
  }));
  const last = items.at(-1);
  return { items, next: rows.length > 20 && last ? { name: last.name, id: last.id } : null };
}

export type SupplierItemsBatch = Awaited<ReturnType<typeof loadSupplierItems>>;
