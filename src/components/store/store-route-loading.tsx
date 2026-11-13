"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { StoreLoading } from "./store-loading";

export function StoreRouteLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Replay on entry, links, searches, filters and browser back/forward,
  // including prefetched routes that never show Next's Suspense fallback.
  // CSS controls the duration; navigation and data requests are never delayed.
  return <StoreLoading key={`${pathname}?${searchParams.toString()}`} transition />;
}
