import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

/**
 * Creates a Supabase client bound to a single request.
 *
 * The client reads and writes the auth session through SvelteKit's cookie API,
 * which lets us keep the session on the server without exposing tokens to the
 * client bundle.
 */
export function createSupabaseServerClient(event: RequestEvent): SupabaseClient {
	return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { ...options, path: '/' });
				}
			}
		}
	});
}
