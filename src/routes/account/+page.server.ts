import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 6;

/**
 * Account settings are only reachable while signed in.
 */
export const load: PageServerLoad = async ({ locals: { safeGetSession }, url }) => {
	const { user } = await safeGetSession();

	if (!user) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	return { user };
};

export const actions: Actions = {
	/** Update display name and/or email. */
	updateProfile: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();

		if (!supabase || !user) {
			return fail(401, { scope: 'profile', error: 'You must be signed in.', success: null });
		}

		const formData = await request.formData();
		const fullName = String(formData.get('full_name') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim();

		if (!email) {
			return fail(400, { scope: 'profile', error: 'Email is required.', success: null });
		}

		const attributes: { data?: { full_name: string }; email?: string } = {};

		if (fullName !== String(user.user_metadata?.full_name ?? '')) {
			attributes.data = { full_name: fullName };
		}
		if (email !== user.email) {
			attributes.email = email;
		}

		if (!attributes.data && !attributes.email) {
			return fail(400, { scope: 'profile', error: 'Nothing to update.', success: null });
		}

		const { error } = await supabase.auth.updateUser(attributes);

		if (error) {
			return fail(400, { scope: 'profile', error: error.message, success: null });
		}

		const success = attributes.email
			? `Saved. We sent a confirmation link to ${attributes.email} — confirm it to finish changing your email.`
			: 'Profile updated.';

		return { scope: 'profile', error: null, success };
	},

	/** Change the password, verifying the current one first. */
	updatePassword: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();

		if (!supabase || !user?.email) {
			return fail(401, { scope: 'password', error: 'You must be signed in.', success: null });
		}

		const formData = await request.formData();
		const current = String(formData.get('current_password') ?? '');
		const next = String(formData.get('new_password') ?? '');
		const confirm = String(formData.get('confirm_password') ?? '');

		if (!current || !next) {
			return fail(400, { scope: 'password', error: 'All fields are required.', success: null });
		}

		if (next.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				scope: 'password',
				error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
				success: null
			});
		}

		if (next !== confirm) {
			return fail(400, { scope: 'password', error: 'New passwords do not match.', success: null });
		}

		// Confirm the current password before letting it change.
		const { error: verifyError } = await supabase.auth.signInWithPassword({
			email: user.email,
			password: current
		});

		if (verifyError) {
			return fail(400, { scope: 'password', error: 'Current password is incorrect.', success: null });
		}

		const { error } = await supabase.auth.updateUser({ password: next });

		if (error) {
			return fail(400, { scope: 'password', error: error.message, success: null });
		}

		return { scope: 'password', error: null, success: 'Password updated.' };
	}
};
