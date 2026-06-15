/**
 * Simulates network latency so the mock repositories behave like real
 * async data sources. Swap the repository internals for Supabase/Postgres
 * later without touching consumers.
 */
export const NETWORK_DELAY_MS = 300;

export function simulateLatency(ms: number = NETWORK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
