import type { SupabaseClient } from '@supabase/supabase-js';
import { unzipSync } from 'fflate';
import { GAME_BUCKET, GAME_INDEX_FILE, PROJECT_TYPES, type ProjectType } from '#lib/projects.js';

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
export function validateProjectValues(
	values: ProjectFormValues,
	options: { hasGameExport?: boolean } = {}
): string | null {
	if (!values.name) {
		return 'Project name is required.';
	}
	if (!VALID_TYPES.includes(values.project_type as ProjectType)) {
		return 'Choose a valid project type.';
	}

	// A Construct 3 project can be provided purely as an uploaded HTML export,
	// in which case an external link is optional.
	const hasHostedGame = values.project_type === 'construct3' && Boolean(options.hasGameExport);

	if (!values.link && !hasHostedGame) {
		return 'Project link is required.';
	}
	if (values.link) {
		try {
			new URL(values.link);
		} catch {
			return 'Project link must be a valid URL.';
		}
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

/* ---------------------------------------------------------------
   Construct 3 HTML exports
--------------------------------------------------------------- */

/** Upper bound on an uploaded export before extraction. */
export const MAX_GAME_ZIP_BYTES = 150 * 1024 * 1024;
/** Guard rails so a crafted archive can't exhaust the bucket. */
const MAX_GAME_FILES = 4000;
const MAX_GAME_TOTAL_BYTES = 300 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
	html: 'text/html; charset=utf-8',
	htm: 'text/html; charset=utf-8',
	js: 'text/javascript; charset=utf-8',
	mjs: 'text/javascript; charset=utf-8',
	css: 'text/css; charset=utf-8',
	json: 'application/json; charset=utf-8',
	txt: 'text/plain; charset=utf-8',
	xml: 'application/xml; charset=utf-8',
	webmanifest: 'application/manifest+json',
	svg: 'image/svg+xml',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	avif: 'image/avif',
	bmp: 'image/bmp',
	ico: 'image/x-icon',
	mp3: 'audio/mpeg',
	ogg: 'audio/ogg',
	oga: 'audio/ogg',
	m4a: 'audio/mp4',
	aac: 'audio/aac',
	wav: 'audio/wav',
	mp4: 'video/mp4',
	webm: 'video/webm',
	woff: 'font/woff',
	woff2: 'font/woff2',
	ttf: 'font/ttf',
	otf: 'font/otf',
	wasm: 'application/wasm'
};

/** Best-effort content type for a file inside an export, based on its extension. */
export function contentTypeFor(path: string): string {
	const dot = path.lastIndexOf('.');
	const ext = dot === -1 ? '' : path.slice(dot + 1).toLowerCase();
	return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

interface ZipEntry {
	path: string;
	data: Uint8Array;
}

/**
 * Turns the raw flat map from `unzipSync` into a clean list of file paths,
 * dropping directory entries, macOS junk and unsafe paths, and stripping a
 * single wrapping folder when the archive was zipped that way.
 */
function normalizeZipEntries(entries: Record<string, Uint8Array>): ZipEntry[] {
	let files: ZipEntry[] = [];

	for (const [rawName, data] of Object.entries(entries)) {
		const normalized = rawName.replace(/\\/g, '/');
		if (normalized.endsWith('/')) continue; // directory
		const segments = normalized.split('/').filter(Boolean);
		if (segments.length === 0) continue;
		if (segments.some((segment) => segment === '..' || segment === '.')) continue; // traversal
		if (segments[0] === '__MACOSX' || segments[segments.length - 1] === '.DS_Store') continue;
		files.push({ path: segments.join('/'), data });
	}

	if (files.length === 0) {
		throw new Error('The .zip file is empty.');
	}

	// No top-level entry point: if everything shares one wrapping folder, strip it.
	if (!files.some((file) => file.path.toLowerCase() === GAME_INDEX_FILE)) {
		const roots = new Set(files.map((file) => file.path.split('/')[0]));
		if (roots.size === 1) {
			const prefix = `${[...roots][0]}/`;
			const stripped = files
				.filter((file) => file.path.startsWith(prefix))
				.map((file) => ({ path: file.path.slice(prefix.length), data: file.data }))
				.filter((file) => file.path.length > 0);
			if (stripped.some((file) => file.path.toLowerCase() === GAME_INDEX_FILE)) {
				files = stripped;
			}
		}
	}

	return files;
}

/**
 * Extracts a Construct 3 "Web (HTML5)" export (.zip) and uploads every file to
 * the public `game-exports` bucket under `<userId>/<uuid>/`. Returns the storage
 * prefix (`game_path`) the project can be played from via `/projects/[id]/play`.
 */
export async function uploadGameExport(
	supabase: SupabaseClient,
	zip: File,
	userId: string
): Promise<{ game_path: string }> {
	if (zip.size > MAX_GAME_ZIP_BYTES) {
		throw new Error(`Export exceeds the ${Math.round(MAX_GAME_ZIP_BYTES / 1024 / 1024)}MB limit.`);
	}

	let entries: Record<string, Uint8Array>;
	try {
		entries = unzipSync(new Uint8Array(await zip.arrayBuffer()));
	} catch {
		throw new Error('Could not read the .zip file — is it a valid archive?');
	}

	const files = normalizeZipEntries(entries);

	if (files.length > MAX_GAME_FILES) {
		throw new Error(`The export contains too many files (max ${MAX_GAME_FILES}).`);
	}

	const totalBytes = files.reduce((sum, file) => sum + file.data.byteLength, 0);
	if (totalBytes > MAX_GAME_TOTAL_BYTES) {
		throw new Error('The unpacked export is too large.');
	}

	const indexEntry = files.find((file) => file.path.toLowerCase() === GAME_INDEX_FILE);
	if (!indexEntry) {
		throw new Error(
			`The .zip has no ${GAME_INDEX_FILE}. Zip the *contents* of the exported game folder.`
		);
	}
	// Serve the entry point from a predictable path regardless of its original casing.
	indexEntry.path = GAME_INDEX_FILE;

	const gamePath = `${userId}/${crypto.randomUUID()}`;
	const uploaded: string[] = [];

	for (const file of files) {
		const objectPath = `${gamePath}/${file.path}`;
		const contentType = contentTypeFor(file.path);
		const { error } = await supabase.storage
			.from(GAME_BUCKET)
			.upload(objectPath, new Blob([new Uint8Array(file.data)], { type: contentType }), {
				contentType,
				upsert: false
			});

		if (error) {
			// Roll back anything already stored so we don't leave a half-uploaded game.
			try {
				await supabase.storage.from(GAME_BUCKET).remove(uploaded);
			} catch {
				// ignore
			}
			throw new Error(error.message);
		}

		uploaded.push(objectPath);
	}

	return { game_path: gamePath };
}

async function listStorageFiles(supabase: SupabaseClient, dir: string): Promise<string[]> {
	const { data, error } = await supabase.storage.from(GAME_BUCKET).list(dir, { limit: 1000 });
	if (error || !data) {
		return [];
	}

	const files: string[] = [];
	for (const item of data) {
		const full = `${dir}/${item.name}`;
		if (item.id === null) {
			files.push(...(await listStorageFiles(supabase, full)));
		} else {
			files.push(full);
		}
	}
	return files;
}

/** Best-effort removal of every object under a hosted game's storage prefix. */
export async function deleteGameExport(
	supabase: SupabaseClient,
	gamePath: string | null
): Promise<void> {
	if (!gamePath) {
		return;
	}

	try {
		const files = await listStorageFiles(supabase, gamePath);
		if (files.length > 0) {
			await supabase.storage.from(GAME_BUCKET).remove(files);
		}
	} catch {
		// Cleanup is best-effort; ignore failures.
	}
}
