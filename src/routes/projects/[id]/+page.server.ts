import { error as httpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isUuid, type Project } from '#lib/projects.js';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	if (!supabase) {
		httpError(500, 'Supabase is not configured.');
	}

	if (!isUuid(params.id)) {
		httpError(404, 'Project not found');
	}

	const { data, error } = await supabase
		.from('projects')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();

	if (error) {
		httpError(500, error.message);
	}

	if (!data) {
		httpError(404, 'Project not found');
	}

	return { project: data as Project };
};
