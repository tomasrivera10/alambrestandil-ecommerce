import { timingSafeEqual } from "node:crypto";
import { refreshMarketReferences } from "@/server/pricing/market";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return Response.json({ error: "No autorizado" }, { status: 401 });
  return Response.json(await refreshMarketReferences());
}
