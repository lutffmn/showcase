import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { FILE_BUCKET, THUMBNAIL_BUCKET } from '#lib/projects.js';
import {
	MAX_FILE_BYTES,
	MAX_THUMBNAIL_BYTES,
	readProjectForm,
	uploadToBucket,
	validateProjectValues
} from '#lib/server/projects.js';

export const load: PageServerLoad = async ({ locals: { safeGetSession }, url }) => {
	const { user } = await safeGetSession();

	if (!user) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		const formData = await request.formData();
		const values = readProjectForm(formData);

		if (!supabase || !user) {
			return fail(401, { ...values, error: 'You must be signed in to add a project.' });
		}

		const validationError = validateProjectValues(values);
		if (validationError) {
			return fail(400, { ...values, error: validationError });
		}

		let thumbnailUrl: string | null = null;
		let fileUrl: string | null = null;

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
		}

		const projectFile = formData.get('file');
		if (projectFile instanceof File && projectFile.size > 0) {
			try {
				fileUrl = await uploadToBucket(supabase, FILE_BUCKET, projectFile, user.id, MAX_FILE_BYTES);
			} catch (e) {
				return fail(400, { ...values, error: `File upload failed: ${(e as Error).message}` });
			}
		}

		const { data, error } = await supabase
			.from('projects')
			.insert({
				name: values.name,
				description: values.description || null,
				project_type: values.project_type,
				link: values.link,
				thumbnail_url: thumbnailUrl,
				file_url: fileUrl,
				created_by: user.id
			})
			.select('id')
			.single();

		if (error) {
			return fail(400, { ...values, error: error.message });
		}

		redirect(303, `/projects/${data.id}`);
	}
};
