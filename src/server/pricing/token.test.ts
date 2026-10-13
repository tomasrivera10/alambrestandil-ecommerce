import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ saved: null as string | null, lock: vi.fn() }));
vi.mock("@/server/db", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        $executeRaw: state.lock,
        siteSetting: {
          findUnique: async () => (state.saved ? { value: state.saved } : null),
          upsert: async (data: { create: { value: string } }) => {
            state.saved = data.create.value;
          },
        },
      }),
  },
}));
import { marketToken } from "./token";
beforeEach(() => {
  state.saved = null;
  state.lock.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-13T09:00:00Z"));
  vi.stubEnv("BETTER_AUTH_SECRET", "local-testing-secret-with-at-least-32-characters");
  vi.stubEnv("MERCADOLIBRE_CLIENT_ID", "example-client");
  vi.stubEnv("MERCADOLIBRE_CLIENT_SECRET", "example-secret");
  vi.stubEnv("MERCADOLIBRE_REFRESH_TOKEN", "initial-refresh");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("persists rotating credentials encrypted and reuses an unexpired token", async () => {
  const fetchMock = vi.fn().mockImplementation(async () =>
    Response.json({
      access_token: "test-access-token",
      refresh_token: "rotated-refresh",
      expires_in: 3600,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  expect(await marketToken()).toBe("test-access-token");
  expect(state.saved).not.toContain("test-access-token");
  expect(state.saved).not.toContain("rotated-refresh");
  expect(await marketToken()).toBe("test-access-token");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(state.lock).toHaveBeenCalledTimes(1);
  vi.setSystemTime(new Date("2026-10-13T11:00:00Z"));
  await marketToken();
  expect((fetchMock.mock.calls[1][1].body as URLSearchParams).get("refresh_token")).toBe(
    "rotated-refresh",
  );
});
