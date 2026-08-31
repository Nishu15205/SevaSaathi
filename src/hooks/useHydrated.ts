"use client";

import { useSyncExternalStore } from "react";

// Stable subscription for hydration-safe mounted detection.
// Returns false on the server (SSR snapshot) and true on the client.
// Use this to defer any rendering that depends on client-only state (e.g. localStorage).
const emptySubscribe = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
