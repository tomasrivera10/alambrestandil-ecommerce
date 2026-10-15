import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { getSession, orderCount, inventoryRead, supplierCount, productCount } = vi.hoisted(() => ({
  getSession: vi.fn(),
  orderCount: vi.fn(),
  inventoryRead: vi.fn(),
  supplierCount: vi.fn(),
  productCount: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/server/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("@/server/db", () => ({
  prisma: {
    order: { count: orderCount },
    inventory: { findMany: inventoryRead },
    supplierPriceList: { count: supplierCount },
    product: { count: productCount },
  },
}));
import DashboardPage from "@/app/admin/(panel)/page";
import { staleOrderFilter } from "./orders/attention";

beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.clearAllMocks();
  orderCount.mockResolvedValue(0);
  inventoryRead.mockResolvedValue([]);
  supplierCount.mockResolvedValue(0);
  productCount.mockResolvedValue(0);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("dashboard area access", () => {
  it("only loads commercial tasks for VENDEDOR", async () => {
    getSession.mockResolvedValue({ user: { id: "sales", name: "Ventas", role: "VENDEDOR" } });
    await DashboardPage();
    expect(orderCount).toHaveBeenCalledTimes(2);
    expect(inventoryRead).not.toHaveBeenCalled();
    expect(supplierCount).not.toHaveBeenCalled();
    expect(productCount).not.toHaveBeenCalled();
  });
  it("loads inventory and catalog tasks for STOCK without reading orders", async () => {
    getSession.mockResolvedValue({ user: { id: "warehouse", name: "Depósito", role: "STOCK" } });
    await DashboardPage();
    expect(orderCount).not.toHaveBeenCalled();
    expect(inventoryRead).toHaveBeenCalledOnce();
    expect(supplierCount).toHaveBeenCalledOnce();
    expect(productCount).toHaveBeenCalledTimes(2);
  });
  it("loads all task areas for ADMIN", async () => {
    getSession.mockResolvedValue({ user: { id: "admin", name: "Administración", role: "ADMIN" } });
    await DashboardPage();
    expect(orderCount).toHaveBeenCalledTimes(2);
    expect(inventoryRead).toHaveBeenCalledOnce();
    expect(supplierCount).toHaveBeenCalledOnce();
    expect(productCount).toHaveBeenCalledTimes(2);
  });
  it("rejects anonymous access before reading task data", async () => {
    getSession.mockResolvedValue(null);
    await expect(DashboardPage()).rejects.toThrow("No tenés permiso");
    expect(orderCount).not.toHaveBeenCalled();
    expect(inventoryRead).not.toHaveBeenCalled();
  });
});

it("uses the same 48-hour cutoff and actionable states for the task and its destination", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-15T12:00:00Z"));
  expect(staleOrderFilter()).toEqual({
    status: { in: ["NUEVO", "ENVIADO_A_WHATSAPP", "CONTACTADO"] },
    updatedAt: { lt: new Date("2026-10-13T12:00:00Z") },
  });
});
