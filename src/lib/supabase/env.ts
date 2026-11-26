import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';

/**
 * Reads and validates a required public environment variable.
 *
 * Validation is lazy (called when a client is created) so the app can start
 * without the variables set and surface a helpful message instead of a cryptic
 * `undefined` error. The variables are declared in `src/env.ts`.
 */
function requirePublic(name: string, value: string): string {
	if (!value) {
		throw new Error(
			`Missing environment variable "${name}". ` +
				'Copy .env.example to .env and fill in your Supabase project details.'
		);
	}
	return value;
}

export function getSupabaseUrl(): string {
	return requirePublic('PUBLIC_SUPABASE_URL', PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
	return requirePublic('PUBLIC_SUPABASE_ANON_KEY', PUBLIC_SUPABASE_ANON_KEY);
}
