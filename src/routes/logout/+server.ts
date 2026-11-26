import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Sign the user out. Used by the POST form in the layout nav. */
export const POST: RequestHandler = async ({ locals: { supabase } }) => {
	await supabase?.auth.signOut();
	redirect(303, '/');
};
