import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("@/lib/db", () => ({ prisma: {}, safeQuery: vi.fn() }));

import { can, requireArea, type Area } from "./rbac";

beforeEach(() => getSession.mockReset());

describe("server authorization", () => {
  it.each([null, undefined, "admin", "OWNER", "", "toString"])(
    "rejects unknown role %s",
    (role) => {
      expect(can(role, "settings")).toBe(false);
    },
  );

  it.each(["orders", "customers", "quotes", "products", "inventory", "settings"] as Area[])(
    "rejects anonymous access to %s",
    async (area) => {
      getSession.mockResolvedValue(null);
      await expect(requireArea(area)).rejects.toThrow("No tenés permiso");
    },
  );

  it("keeps sales and warehouse permissions separate", () => {
    expect(can("STOCK", "customers")).toBe(false);
    expect(can("STOCK", "orders")).toBe(false);
    expect(can("VENDEDOR", "inventory")).toBe(false);
    expect(can("VENDEDOR", "settings")).toBe(false);
    expect(can("ADMIN", "settings")).toBe(true);
  });

  it.each([
    ["../app/admin/(panel)/pedidos/page", "STOCK"],
    ["../app/admin/(panel)/pedidos/[id]/page", "STOCK"],
    ["../app/admin/(panel)/clientes/page", "STOCK"],
    ["../app/admin/(panel)/clientes/[id]/page", "STOCK"],
    ["../app/admin/(panel)/cotizaciones/page", "STOCK"],
    ["../app/admin/(panel)/stock/page", "VENDEDOR"],
    ["../app/admin/(panel)/configuracion/page", "VENDEDOR"],
  ])("blocks direct page access to %s for %s before reading data", async (path, role) => {
    getSession.mockResolvedValue({ user: { id: "user", role } });
    const page = await import(path);
    await expect(
      page.default({
        params: Promise.resolve({ id: "private-record" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("No tenés permiso");
  });
});
