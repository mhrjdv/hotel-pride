import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Browser Supabase client (for client components).
 * Synchronous factory. A singleton `supabase` instance is also exported for
 * convenience; most call sites use that.
 */
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export const supabase = createClient();
