import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const ROLES = ["ADMIN", "VENDEDOR", "STOCK"] as const;
export type Role = (typeof ROLES)[number];

export type Area = "orders" | "customers" | "quotes" | "products" | "inventory" | "settings";

const ACCESS: Record<Exclude<Role, "ADMIN">, Area[]> & { ADMIN: ["*"] } = {
  ADMIN: ["*"],
  VENDEDOR: ["orders", "customers", "quotes"],
  STOCK: ["products", "inventory"],
};

export function isRole(value: string | null | undefined): value is Role {
  return ROLES.includes(value as Role);
}

export function can(role: string | null | undefined, area: Area) {
  if (!isRole(role)) return false;
  if (role === "ADMIN") return true;
  return ACCESS[role].includes(area);
}

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireArea(area: Area) {
  const session = await getSession();
  const role = session?.user && "role" in session.user ? String(session.user.role) : null;
  if (!session || !can(role, area)) {
    throw new Error("No tenés permiso para esta acción.");
  }
  return { session, role: role as Role, userId: session.user.id };
}
