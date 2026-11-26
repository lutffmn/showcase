import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/** Only allow same-site relative redirects to avoid open-redirect issues. */
function safeRedirect(target: string | null, fallback = '/dashboard'): string {
	if (target && target.startsWith('/') && !target.startsWith('//')) {
		return target;
	}
	return fallback;
}

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	// Already signed in? Skip the form.
	if (session) {
		redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	}

	return {
		redirectTo: url.searchParams.get('redirectTo') ?? '/dashboard',
		error: url.searchParams.get('error')
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');
		const redirectTo = safeRedirect(url.searchParams.get('redirectTo'));

		if (!supabase) {
			return fail(500, {
				error: 'Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
				email
			});
		}

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
		}

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(400, { error: error.message, email });
		}

		redirect(303, redirectTo);
	}
};
