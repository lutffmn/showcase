import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Handles the redirect from a Supabase email confirmation link.
 *
 * Supabase appends either:
 *  - `?code=...`                      (PKCE flow — the default)
 *  - `?token_hash=...&type=email`     (if you customise the email template)
 *
 * Both are exchanged for a session here, after which the user is redirected
 * onward to `next` (defaults to the dashboard).
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');
	const next = url.searchParams.get('next') ?? '/dashboard';

	if (!supabase) {
		redirect(303, '/login?error=Supabase+is+not+configured');
	}

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, next);
		}
	} else if (tokenHash && type) {
		const { error } = await supabase.auth.verifyOtp({
			type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
			token_hash: tokenHash
		});
		if (!error) {
			redirect(303, next);
		}
	}

	redirect(303, '/login?error=' + encodeURIComponent('Could not verify your email link.'));
};
