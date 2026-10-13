<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Code Review Rules

- For changes to admin pages, server actions, or API routes, check that authorization is enforced on the server for the affected area. A hidden control or page guard alone does not protect a mutation; use the existing `requireArea` pattern.
- For stock changes, check that inventory quantities and the corresponding movement history stay consistent within a transaction. Preserve `onHand >= reserved` and nonnegative stock, including count adjustments.
- For public catalog or order changes, check that `HIDDEN` prices are not serialized to clients or shown as payable totals. Preserve the public price filtering used by product queries.
