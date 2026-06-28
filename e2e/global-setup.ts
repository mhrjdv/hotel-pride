import { cleanupE2EData } from './cleanup';

/**
 * Global SETUP: before the suite runs, delete any leftover E2ETEST rows from a
 * prior (possibly crashed) run so the suite self-heals and starts from a clean
 * slate. Never throws — a failure here must not block the run.
 */
async function globalSetup(): Promise<void> {
  try {
    await cleanupE2EData('pre-run setup');
  } catch (err) {
    console.warn(`[e2e setup] cleanup failed (continuing): ${(err as Error).message}`);
  }
}

export default globalSetup;
