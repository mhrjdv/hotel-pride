import { createClient } from '@supabase/supabase-js';
// SERVER-ONLY: uses the service-role key. Never import this from client components.

/**
 * Service-role Supabase client for trusted SERVER-SIDE operations only
 * (e.g. Storage uploads/signed URLs that would otherwise require storage.objects
 * RLS policies). It bypasses RLS, so it must NEVER be imported into client code.
 * Always authenticate/authorize the user with the regular server client first.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
