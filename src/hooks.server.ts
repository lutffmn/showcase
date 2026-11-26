import type { Handle } from '@sveltejs/kit/hooks';
import type { Session, User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '#lib/supabase/server.js';

/**
 * Runs on every request. It:
 *  1. attaches a request-scoped Supabase client to `event.locals`
 *  2. exposes `safeGetSession`, which validates the session with the Supabase
 *     Auth server (never trust `getSession()` alone on the server)
 *  3. keeps the response streaming while allowing the headers Supabase needs
 */
export const handle: Handle = async ({ event, resolve }) => {
	try {
		event.locals.supabase = createSupabaseServerClient(event);
	} catch (error) {
		// Most commonly thrown when the PUBLIC_SUPABASE_* env vars are missing.
		// Leave the client null so the app still boots and pages can show a
		// helpful "not configured" message instead of a hard 500.
		console.warn(`[supabase] failed to create server client: ${(error as Error).message}`);
		event.locals.supabase = null;
	}

	event.locals.safeGetSession = async (): Promise<{ session: Session | null; user: User | null }> => {
		if (!event.locals.supabase) {
			return { session: null, user: null };
		}

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		// Re-validate the JWT against the Auth server, since the cookie value
		// could have been tampered with.
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
