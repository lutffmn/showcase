import type { PageServerLoad } from './$types';
import type { Project } from '#lib/projects.js';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	if (!supabase) {
		return { projects: [] as Project[], error: 'Supabase is not configured.' };
	}

	const { data, error } = await supabase
		.from('projects')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		return { projects: [] as Project[], error: error.message };
	}

	return { projects: (data ?? []) as Project[], error: null };
};
