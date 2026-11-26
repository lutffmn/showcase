import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

/**
 * Creates a Supabase client for use in the browser.
 *
 * Safe to call on the client; it stores the auth session in cookies so it stays
 * in sync with the server client created in `hooks.server.ts`.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
	return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
