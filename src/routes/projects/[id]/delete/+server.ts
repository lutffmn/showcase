import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isUuid } from '#lib/projects.js';
import { deleteFileByUrl, deleteGameExport } from '#lib/server/projects.js';

/** Deletes a project (and its stored assets). Owner-only. */
export const POST: RequestHandler = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();

	if (!supabase || !user) {
		redirect(303, '/login?redirectTo=%2Fdashboard');
	}

	if (!isUuid(params.id)) {
		redirect(303, '/dashboard');
	}

	const { data: existing, error: fetchError } = await supabase
		.from('projects')
		.select('created_by, thumbnail_url, file_url, game_path')
		.eq('id', params.id)
		.maybeSingle();

	if (fetchError) {
		error(500, fetchError.message);
	}

	if (!existing) {
		redirect(303, '/dashboard');
	}

	if (existing.created_by !== user.id) {
		error(403, 'You can only delete your own projects.');
	}

	const { error: deleteError } = await supabase.from('projects').delete().eq('id', params.id);

	if (deleteError) {
		error(400, deleteError.message);
	}

	await deleteFileByUrl(supabase, existing.thumbnail_url);
	await deleteFileByUrl(supabase, existing.file_url);
	await deleteGameExport(supabase, existing.game_path);

	redirect(303, '/dashboard');
};
