export type ProjectType = 'scratch' | 'construct3';

export interface Project {
	id: string;
	name: string;
	description: string | null;
	thumbnail_url: string | null;
	project_type: ProjectType;
	file_url: string | null;
	link: string;
	created_by: string | null;
	created_at: string;
}

export const THUMBNAIL_BUCKET = 'thumbnails';
export const FILE_BUCKET = 'project-files';

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
