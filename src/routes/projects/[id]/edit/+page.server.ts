import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { FILE_BUCKET, THUMBNAIL_BUCKET, isUuid, type Project } from '#lib/projects.js';
import {
	MAX_FILE_BYTES,
	MAX_THUMBNAIL_BYTES,
	deleteFileByUrl,
	deleteGameExport,
	readProjectForm,
	uploadGameExport,
	uploadToBucket,
	validateProjectValues
} from '#lib/server/projects.js';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession }, url }) => {
	const { user } = await safeGetSession();

	if (!user) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	if (!supabase) {
		error(500, 'Supabase is not configured.');
	}

	if (!isUuid(params.id)) {
		error(404, 'Project not found');
	}

	const { data, error: fetchError } = await supabase
		.from('projects')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();

	if (fetchError) {
		error(500, fetchError.message);
	}

	if (!data) {
		error(404, 'Project not found');
	}

	if (data.created_by !== user.id) {
		error(403, 'You can only edit your own projects.');
	}

	return { project: data as Project };
};

export const actions: Actions = {
	default: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		const formData = await request.formData();
		const values = readProjectForm(formData);

		if (!supabase || !user) {
			return fail(401, { ...values, error: 'You must be signed in.' });
		}

		if (!isUuid(params.id)) {
			return fail(404, { ...values, error: 'Project not found.' });
		}

		const { data: existing, error: fetchError } = await supabase
			.from('projects')
			.select('created_by, thumbnail_url, file_url, game_path')
			.eq('id', params.id)
			.maybeSingle();

		if (fetchError) {
			return fail(500, { ...values, error: fetchError.message });
		}
		if (!existing) {
			return fail(404, { ...values, error: 'Project not found.' });
		}
		if (existing.created_by !== user.id) {
			return fail(403, { ...values, error: 'You can only edit your own projects.' });
		}

		const gameExport = formData.get('game_export');
		const hasGameExport = gameExport instanceof File && gameExport.size > 0;

		const validationError = validateProjectValues(values, {
			hasGameExport: hasGameExport || Boolean(existing.game_path)
		});
		if (validationError) {
			return fail(400, { ...values, error: validationError });
		}

		if (hasGameExport && values.project_type !== 'construct3') {
			return fail(400, {
				...values,
				error: 'Game exports are only supported for Construct 3 projects.'
			});
		}

		let thumbnailUrl: string | null = existing.thumbnail_url;
		let fileUrl: string | null = existing.file_url;
		let gamePath: string | null = existing.game_path;

		const thumbnail = formData.get('thumbnail');
		if (thumbnail instanceof File && thumbnail.size > 0) {
			if (!thumbnail.type.startsWith('image/')) {
				return fail(400, { ...values, error: 'Thumbnail must be an image file.' });
			}
			try {
				thumbnailUrl = await uploadToBucket(
					supabase,
					THUMBNAIL_BUCKET,
					thumbnail,
					user.id,
					MAX_THUMBNAIL_BYTES
				);
			} catch (e) {
				return fail(400, { ...values, error: `Thumbnail upload failed: ${(e as Error).message}` });
			}
		} else if (formData.get('remove_thumbnail') === 'on') {
			thumbnailUrl = null;
		}

		const projectFile = formData.get('file');
		if (projectFile instanceof File && projectFile.size > 0) {
			try {
				fileUrl = await uploadToBucket(supabase, FILE_BUCKET, projectFile, user.id, MAX_FILE_BYTES);
			} catch (e) {
				return fail(400, { ...values, error: `File upload failed: ${(e as Error).message}` });
			}
		} else if (formData.get('remove_file') === 'on') {
			fileUrl = null;
		}

		if (hasGameExport) {
			try {
				({ game_path: gamePath } = await uploadGameExport(supabase, gameExport as File, user.id));
			} catch (e) {
				return fail(400, { ...values, error: `Game export upload failed: ${(e as Error).message}` });
			}
		} else if (formData.get('remove_game_export') === 'on') {
			gamePath = null;
		}

		const { error: updateError } = await supabase
			.from('projects')
			.update({
				name: values.name,
				description: values.description || null,
				project_type: values.project_type,
				link: values.link,
				thumbnail_url: thumbnailUrl,
				file_url: fileUrl,
				game_path: gamePath
			})
			.eq('id', params.id);

		if (updateError) {
			// Roll back a freshly uploaded export if the row couldn't be updated.
			if (gamePath !== existing.game_path) {
				await deleteGameExport(supabase, gamePath);
			}
			return fail(400, { ...values, error: updateError.message });
		}

		// Best-effort cleanup of assets the project no longer references.
		if (thumbnailUrl !== existing.thumbnail_url) {
			await deleteFileByUrl(supabase, existing.thumbnail_url);
		}
		if (fileUrl !== existing.file_url) {
			await deleteFileByUrl(supabase, existing.file_url);
		}
		if (gamePath !== existing.game_path) {
			await deleteGameExport(supabase, existing.game_path);
		}

		redirect(303, `/projects/${params.id}`);
	}
};
