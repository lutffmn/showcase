import { resolve } from '$app/paths';

export type ProjectType = 'scratch' | 'construct3';

export interface Project {
	id: string;
	name: string;
	description: string | null;
	thumbnail_url: string | null;
	project_type: ProjectType;
	file_url: string | null;
	link: string;
	/** Storage prefix (within `game-exports`) of an uploaded Construct 3 HTML export. */
	game_path: string | null;
	created_by: string | null;
	created_at: string;
}

export const THUMBNAIL_BUCKET = 'thumbnails';
export const FILE_BUCKET = 'project-files';
export const GAME_BUCKET = 'game-exports';

/** Entry point that an uploaded Construct 3 export is served from. */
export const GAME_INDEX_FILE = 'index.html';

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
	{ value: 'scratch', label: 'Scratch' },
	{ value: 'construct3', label: 'Construct 3' }
];

export function projectTypeLabel(type: string): string {
	return PROJECT_TYPES.find((t) => t.value === type)?.label ?? type;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
	return UUID_RE.test(value);
}

/**
 * Turns a project link into a URL suitable for an iframe embed. Scratch project
 * pages get rewritten to their `/embed` variant; everything else is used as-is.
 */
export function resolveEmbedUrl(type: ProjectType, link: string): string {
	if (type === 'scratch') {
		const match = link.match(/scratch\.mit\.edu\/projects\/(\d+)/);
		if (match) {
			return `https://scratch.mit.edu/projects/${match[1]}/embed`;
		}
	}
	return link;
}

/**
 * The URL a project should be played from.
 *
 * - Scratch links are rewritten to their `/embed` variant.
 * - Construct 3 projects with an uploaded HTML export play from our own
 *   same-origin route (so the game's relative assets, workers and service
 *   worker all resolve correctly).
 * - Anything else is embedded as-is.
 */
export function resolvePlayUrl(
	project: Pick<Project, 'id' | 'project_type' | 'link' | 'game_path'>
): string {
	if (project.project_type === 'construct3' && project.game_path) {
		return resolve('/projects/[id]/play/[...path]', { id: project.id, path: GAME_INDEX_FILE });
	}
	return resolveEmbedUrl(project.project_type, project.link);
}

/** Whether a Construct 3 project is hosted by the app itself. */
export function isHostedGame(project: Pick<Project, 'project_type' | 'game_path'>): boolean {
	return project.project_type === 'construct3' && Boolean(project.game_path);
}
