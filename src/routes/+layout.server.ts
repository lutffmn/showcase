import type { LayoutServerLoad } from './$types';

/**
 * Makes the current session available to every page. `event.locals.safeGetSession`
 * comes from `hooks.server.ts`.
 */
export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	return { session, user };
};
