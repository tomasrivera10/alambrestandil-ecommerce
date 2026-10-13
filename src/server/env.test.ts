import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("refuses the development fallback secret in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("BETTER_AUTH_SECRET", undefined);
  vi.stubEnv("BETTER_AUTH_URL", "https://example.com");
  const { authSecret } = await import("./env");
  expect(authSecret).toThrow("BETTER_AUTH_SECRET");
});

it("refuses HTTP authentication in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("BETTER_AUTH_SECRET", "a".repeat(48));
  vi.stubEnv("BETTER_AUTH_URL", "http://example.com");
  const { authSecret } = await import("./env");
  expect(authSecret).toThrow("HTTPS");
});

it("accepts an explicit production secret and HTTPS origin", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("BETTER_AUTH_SECRET", "a".repeat(48));
  vi.stubEnv("BETTER_AUTH_URL", "https://example.com");
  const { authSecret } = await import("./env");
  expect(authSecret()).toBe("a".repeat(48));
});
