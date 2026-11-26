import type { SupabaseClient } from '@supabase/supabase-js';
import { PROJECT_TYPES, type ProjectType } from '#lib/projects.js';

export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

const VALID_TYPES = PROJECT_TYPES.map((t) => t.value);

export interface ProjectFormValues {
	error: string | null;
	name: string;
	description: string;
	project_type: string;
	link: string;
}

export function readProjectForm(formData: FormData): ProjectFormValues {
	return {
		error: null,
		name: String(formData.get('name') ?? '').trim(),
		description: String(formData.get('description') ?? '').trim(),
		project_type: String(formData.get('project_type') ?? '').trim(),
		link: String(formData.get('link') ?? '').trim()
	};
}

/** Returns an error message, or `null` when the values are valid. */
export function validateProjectValues(values: ProjectFormValues): string | null {
	if (!values.name) {
		return 'Project name is required.';
	}
	if (!VALID_TYPES.includes(values.project_type as ProjectType)) {
		return 'Choose a valid project type.';
	}
	if (!values.link) {
		return 'Project link is required.';
	}
	try {
		new URL(values.link);
	} catch {
		return 'Project link must be a valid URL.';
	}
	return null;
}

export async function uploadToBucket(
	supabase: SupabaseClient,
	bucket: string,
	file: File,
	userId: string,
	maxBytes: number
): Promise<string> {
	if (file.size > maxBytes) {
		throw new Error(`File exceeds the ${Math.round(maxBytes / 1024 / 1024)}MB limit.`);
	}

	const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
	const path = `${userId}/${crypto.randomUUID()}${ext}`;

	const { error } = await supabase.storage
		.from(bucket)
		.upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });

	if (error) {
		throw new Error(error.message);
	}

	const { data } = supabase.storage.from(bucket).getPublicUrl(path);
	return data.publicUrl;
}

/** Best-effort removal of a storage object given its public URL. */
export async function deleteFileByUrl(supabase: SupabaseClient, publicUrl: string | null): Promise<void> {
	if (!publicUrl) {
		return;
	}

	const marker = '/storage/v1/object/public/';
	const markerIndex = publicUrl.indexOf(marker);
	if (markerIndex === -1) {
		return;
	}

	const rest = publicUrl.slice(markerIndex + marker.length);
	const slashIndex = rest.indexOf('/');
	if (slashIndex === -1) {
		return;
	}

	const bucket = rest.slice(0, slashIndex);
	const path = decodeURIComponent(rest.slice(slashIndex + 1));

	try {
		await supabase.storage.from(bucket).remove([path]);
	} catch {
		// Cleanup is best-effort; ignore failures (e.g. missing delete policy).
	}
}
