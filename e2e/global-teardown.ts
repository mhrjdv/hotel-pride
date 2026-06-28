import { cleanupE2EData } from './cleanup';

/**
 * Global TEARDOWN: after the suite finishes, delete every row created by the
 * tests (tagged via E2E_TAG / the reserved test phone range) in FK-safe order.
 * Resilient — wrapped so it never throws and never fails the run.
 */
async function globalTeardown(): Promise<void> {
  try {
    await cleanupE2EData('teardown');
  } catch (err) {
    console.warn(`[e2e teardown] cleanup failed: ${(err as Error).message}`);
  }
}

export default globalTeardown;
