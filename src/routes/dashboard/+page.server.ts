import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Project } from '#lib/projects.js';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase }, url }) => {
	const { user } = await safeGetSession();

	if (!user) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	if (!supabase) {
		return { projects: [] as Project[], error: 'Supabase is not configured.' };
	}

	const { data, error } = await supabase
		.from('projects')
		.select('*')
		.eq('created_by', user.id)
		.order('created_at', { ascending: false });

	return { projects: (data ?? []) as Project[], error: error?.message ?? null };
};
