import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Shared E2E data-isolation + cleanup utilities.
 *
 * The suite now runs against a REAL Supabase project, so every test that creates
 * data MUST tag it with `E2E_TAG` and use a phone number in the reserved test
 * range (`TEST_PHONE_PREFIX`). The global setup/teardown then delete exactly the
 * rows carrying those markers — nothing else — so the cloud project is never
 * polluted by a test run (or a crashed prior run).
 */

/** Greppable marker prefixed onto every test-created customer/invoice name. */
export const E2E_TAG = 'E2ETEST';

/**
 * Reserved phone prefix for test customers. The app stores phones as
 * `+91XXXXXXXXXX`; real Indian numbers never start with `+9990000`, so these
 * cannot collide with a genuine guest. (Length is kept at the +91 + 10-digit
 * format the customer form validates.)
 */
export const TEST_PHONE_PREFIX = '+9990000';

/** Build a unique, tagged customer name, e.g. `E2ETEST 1719580000000 4821`. */
export function tagName(label?: string): string {
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const base = `${E2E_TAG} ${Date.now()} ${rand}`;
  return label ? `${base} ${label}` : base;
}

/**
 * Build a tagged phone in the reserved range. The customer form expects
 * `+91` + 10 digits; we instead use the reserved `+9990000` prefix (8 chars)
 * plus 7 random-ish digits = `+9990000` + 7 = 15 chars total, matching the
 * VARCHAR(15) column. Real phone validation in the app accepts `+91...`, so for
 * the form we still pass a `+91` number when the form enforces it; the reserved
 * prefix is mainly the teardown safety net for any directly-inserted rows.
 */
export function tagPhone(): string {
  const rand = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${TEST_PHONE_PREFIX}${rand}`;
}

/**
 * Minimal `.env.local` loader. Global setup/teardown run in a plain Node
 * context (not through Next.js), so the env vars from `.env.local` are not
 * auto-loaded and we have no `dotenv` dependency available. We parse the file
 * ourselves and merge into `process.env` (without clobbering existing values).
 */
export function loadEnvLocal(): void {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    try {
      const full = path.resolve(process.cwd(), file);
      const raw = readFileSync(full, 'utf8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        // Strip surrounding quotes.
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (key && !(key in process.env)) {
          process.env[key] = value;
        }
      }
    } catch {
      // File may not exist; ignore and try the next candidate.
    }
  }
}

/** Create a service-role Supabase client that bypasses RLS for cleanup. */
export function createServiceClient(): SupabaseClient {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (checked process.env and .env.local).'
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type DeletionCounts = Record<string, number>;

/**
 * Delete every row created by the E2E suite, in FK-safe order. A row is
 * considered test data if it is (transitively) attached to a customer whose
 * name starts with `E2E_TAG` or whose phone starts with `TEST_PHONE_PREFIX`, or
 * (for free-text invoices that have no customer_id) whose `customer_name` starts
 * with `E2E_TAG`.
 *
 * Resilient by design: every step is wrapped so a single failure (e.g. a table
 * that does not exist in this project) never aborts the rest of the cleanup, and
 * the function never throws.
 */
export async function cleanupE2EData(label = 'cleanup'): Promise<DeletionCounts> {
  const counts: DeletionCounts = {};
  let supabase: SupabaseClient;
  try {
    supabase = createServiceClient();
  } catch (err) {
    console.warn(`[e2e ${label}] skipped — ${(err as Error).message}`);
    return counts;
  }

  const namePattern = `${E2E_TAG}%`;
  const phonePattern = `${TEST_PHONE_PREFIX}%`;

  // Helper: fetch ids from a table with a filter callback, swallowing errors.
  async function ids(
    table: string,
    apply: (q: ReturnType<SupabaseClient['from']>) => unknown
  ): Promise<string[]> {
    try {
      const query = supabase.from(table).select('id') as unknown as ReturnType<SupabaseClient['from']>;
      const { data, error } = (await apply(query)) as {
        data: Array<{ id: string }> | null;
        error: unknown;
      };
      if (error) throw error;
      return (data ?? []).map((r) => r.id);
    } catch (err) {
      console.warn(`[e2e ${label}] could not read ${table}: ${(err as Error).message}`);
      return [];
    }
  }

  // Helper: delete rows by id list from a table, recording the count.
  async function delByIds(table: string, idList: string[]): Promise<void> {
    if (idList.length === 0) return;
    try {
      const { error, count } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .in('id', idList);
      if (error) throw error;
      counts[table] = (counts[table] ?? 0) + (count ?? idList.length);
    } catch (err) {
      console.warn(`[e2e ${label}] could not delete from ${table}: ${(err as Error).message}`);
    }
  }

  // Helper: delete rows from a table by a FK column matching an id list.
  async function delByFk(table: string, fkColumn: string, idList: string[]): Promise<void> {
    if (idList.length === 0) return;
    try {
      const { error, count } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .in(fkColumn, idList);
      if (error) throw error;
      counts[table] = (counts[table] ?? 0) + (count ?? 0);
    } catch (err) {
      console.warn(`[e2e ${label}] could not delete from ${table}: ${(err as Error).message}`);
    }
  }

  // 1. Identify tagged customers (by name OR reserved phone range).
  const customerIds = await ids('customers', (q) =>
    // @ts-expect-error chained PostgREST filter typing is loose here
    q.or(`name.ilike.${namePattern},phone.ilike.${phonePattern}`)
  );

  // 2. Bookings tied to those customers (primary_customer_id).
  const bookingIds =
    customerIds.length > 0
      ? await ids('bookings', (q) =>
          // @ts-expect-error loose chained filter typing
          q.in('primary_customer_id', customerIds)
        )
      : [];

  // 3. Invoices: tied either to tagged customers OR carrying a tagged free-text
  //    customer_name (invoices created in the UI have no customer_id).
  const invoiceIdsByCustomer =
    customerIds.length > 0
      ? await ids('invoices', (q) =>
          // @ts-expect-error loose chained filter typing
          q.in('customer_id', customerIds)
        )
      : [];
  const invoiceIdsByName = await ids('invoices', (q) =>
    // @ts-expect-error loose chained filter typing
    q.ilike('customer_name', namePattern)
  );
  const invoiceIdsByBooking =
    bookingIds.length > 0
      ? await ids('invoices', (q) =>
          // @ts-expect-error loose chained filter typing
          q.in('booking_id', bookingIds)
        )
      : [];
  const invoiceIds = Array.from(
    new Set([...invoiceIdsByCustomer, ...invoiceIdsByName, ...invoiceIdsByBooking])
  );

  // 4. Delete invoice children -> invoices (line_items/payments cascade on FK,
  //    but we delete explicitly so the counts are reported and we don't rely on
  //    cascade being configured).
  await delByFk('invoice_payments', 'invoice_id', invoiceIds);
  await delByFk('invoice_line_items', 'invoice_id', invoiceIds);
  await delByIds('invoices', invoiceIds);

  // 5. Delete booking children -> bookings.
  await delByFk('payments', 'booking_id', bookingIds);
  await delByFk('booking_guests', 'booking_id', bookingIds);
  await delByIds('bookings', bookingIds);

  // 6. Any remaining booking_guests that reference tagged customers directly.
  await delByFk('booking_guests', 'customer_id', customerIds);

  // 7. Finally the customers themselves.
  await delByIds('customers', customerIds);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    console.log(`[e2e ${label}] no E2ETEST rows to delete.`);
  } else {
    const summary = Object.entries(counts)
      .map(([t, c]) => `${t}=${c}`)
      .join(', ');
    console.log(`[e2e ${label}] deleted ${total} row(s): ${summary}`);
  }
  return counts;
}
