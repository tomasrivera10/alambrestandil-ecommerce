import { beforeEach, expect, it, vi } from "vitest";
import { pdfFixture } from "./pdf-fixture";

const mock = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn() }));
vi.mock("@/server/rbac", () => ({ requireArea: mock.auth }));
vi.mock("@/server/db", () => ({ prisma: { supplierPriceList: { findUnique: mock.list } } }));
import { GET } from "@/app/api/admin/supplier-lists/[id]/crop/route";
const context = () => ({ params: Promise.resolve({ id: "list" }) });
beforeEach(() => {
  vi.clearAllMocks();
  mock.auth.mockResolvedValue({ userId: "admin" });
  mock.list.mockResolvedValue({
    filename: "list.pdf",
    content: pdfFixture("PUERTA 0.90 X 1.00 $60102"),
    rows: [{ page: 1, documentY: 180 }],
  });
});
it("denies source images without supplier authorization", async () => {
  mock.auth.mockRejectedValue(new Error("Forbidden"));
  expect((await GET(new Request("http://localhost/crop?row=0"), context())).status).toBe(403);
  expect(mock.list).not.toHaveBeenCalled();
});
it("renders a private PNG strip of the original PDF", async () => {
  const response = await GET(new Request("http://localhost/crop?row=0"), context());
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("Content-Type")).toBe("image/png");
  const png = Buffer.from(await response.arrayBuffer());
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(20)).toBe(64);
});
it("requires a valid index and source coordinates", async () => {
  expect((await GET(new Request("http://localhost/crop?row=-1"), context())).status).toBe(400);
  expect((await GET(new Request("http://localhost/crop?row=2"), context())).status).toBe(404);
});
