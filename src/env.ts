import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Declares the environment variables this app uses (see
 * https://svelte.dev/docs/kit/environment-variables). Variables marked `public`
 * are exposed to the browser through `$app/env/public`; anything else stays
 * server-only in `$app/env/private`.
 *
 * The `schema` functions deliberately tolerate a missing value by falling back
 * to an empty string, so the app can still boot and show a helpful message
 * instead of crashing. `src/lib/supabase/env.ts` performs the real validation
 * when a value is actually used.
 */
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		description: 'Supabase project URL, e.g. https://your-project-ref.supabase.co',
		schema: (value) => value ?? ''
	},
	PUBLIC_SUPABASE_ANON_KEY: {
		public: true,
		description: 'Supabase anon (public) API key',
		schema: (value) => value ?? ''
	}
});
