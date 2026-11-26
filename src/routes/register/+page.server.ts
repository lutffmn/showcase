import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 6;

export const load: PageServerLoad = async () => {
	// The registration form renders regardless of auth state; the layout nav
	// already reflects whether a user is signed in.
	return {};
};

export const actions: Actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!supabase) {
			return fail(500, {
				error: 'Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
				success: null,
				email
			});
		}

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', success: null, email });
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
				success: null,
				email
			});
		}

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				// Where Supabase sends the user after they confirm their email.
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, { error: error.message, success: null, email });
		}

		// When email confirmation is disabled in the Supabase dashboard, a
		// session is returned immediately and we can log the user straight in.
		if (data.session) {
			redirect(303, '/dashboard');
		}

		return {
			error: null,
			success: `We sent a confirmation link to ${email}. Check your inbox to finish signing up.`,
			email
		};
	}
};
