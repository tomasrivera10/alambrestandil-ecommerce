import { createHash } from "node:crypto";
export function supplierReviewRevision(rows: unknown) {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}
