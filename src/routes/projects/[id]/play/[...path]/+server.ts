import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GAME_BUCKET, GAME_INDEX_FILE, isUuid } from '#lib/projects.js';
import { contentTypeFor } from '#lib/server/projects.js';

/**
 * Serves the files of an uploaded Construct 3 HTML export from our own origin so
 * the game runs inside the project player.
 *
 * The player iframes `/projects/[id]/play/index.html`; the export's relative
 * asset paths (data.json, images/, media/, workers, service worker, …) then
 * resolve back through this same route, which is what Construct 3 expects.
 */

// Never prerender: the files are only known at request time.
export const prerender = false;

export const GET: RequestHandler = async ({ params, locals: { supabase }, request }) => {
	if (!supabase) {
		error(500, 'Supabase is not configured.');
	}

	if (!isUuid(params.id)) {
		error(404, 'Not found');
	}

	let requested = (params.path ?? '').trim() || GAME_INDEX_FILE;
	// A request for a "directory" (trailing slash) should serve its index.
	if (requested.endsWith('/')) {
		requested += GAME_INDEX_FILE;
	}

	// Reject traversal attempts before touching storage.
	if (requested.split('/').some((segment) => segment === '..' || segment === '.')) {
		error(400, 'Invalid path');
	}

	const { data: project, error: fetchError } = await supabase
		.from('projects')
		.select('game_path')
		.eq('id', params.id)
		.maybeSingle();

	if (fetchError) {
		error(500, fetchError.message);
	}

	if (!project?.game_path) {
		error(404, 'This project has no hosted game export.');
	}

	const objectPath = `${project.game_path}/${requested}`;
	const { data: file, error: downloadError } = await supabase.storage
		.from(GAME_BUCKET)
		.download(objectPath);

	if (downloadError || !file) {
		// Logged so a production failure is visible in the server logs.
		console.error(`[play] could not load "${objectPath}": ${downloadError?.message ?? 'not found'}`);
		error(404, 'File not found');
	}

	const contentType = contentTypeFor(requested);
	const headers = new Headers({
		'content-type': contentType,
		// We serve through a proxy, so avoid CDNs/browsers caching a stale or
		// partial response that could leave the game stuck on a black screen.
		'cache-control': 'no-store',
		'accept-ranges': 'bytes',
		'x-content-type-options': 'nosniff',
		// Makes sure the game is allowed to be framed by our own origin. CSP
		// frame-ancestors takes precedence over an X-Frame-Options header a host
		// or proxy might add, so this can un-break a blocked iframe.
		'content-security-policy': "frame-ancestors 'self'"
	});

	// Honour Range requests — media (and some engines) rely on them.
	const range = request.headers.get('range');
	if (range) {
		const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
		const size = file.size;
		if (match) {
			const start = match[1] ? Number(match[1]) : 0;
			const end = Math.min(match[2] ? Number(match[2]) : size - 1, size - 1);

			if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
				return new Response(null, {
					status: 416,
					headers: { 'content-range': `bytes */${size}` }
				});
			}

			const chunk = file.slice(start, end + 1, contentType);
			headers.set('content-range', `bytes ${start}-${end}/${size}`);
			headers.set('content-length', String(chunk.size));
			return new Response(chunk, { status: 206, headers });
		}
	}

	headers.set('content-length', String(file.size));
	return new Response(file, { headers });
};
