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
export const GET: RequestHandler = async ({ params, locals: { supabase } }) => {
	if (!supabase) {
		error(500, 'Supabase is not configured.');
	}

	if (!isUuid(params.id)) {
		error(404, 'Not found');
	}

	const requested = params.path?.trim() ? params.path : GAME_INDEX_FILE;

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

	const { data: file, error: downloadError } = await supabase.storage
		.from(GAME_BUCKET)
		.download(`${project.game_path}/${requested}`);

	if (downloadError || !file) {
		error(404, 'File not found');
	}

	const isEntryPoint = requested.toLowerCase() === GAME_INDEX_FILE;

	return new Response(file, {
		headers: {
			'content-type': contentTypeFor(requested),
			// The entry point must always be fresh; game assets are immutable.
			'cache-control': isEntryPoint ? 'no-cache' : 'public, max-age=86400'
		}
	});
};
