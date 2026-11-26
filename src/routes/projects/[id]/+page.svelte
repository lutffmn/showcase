<script lang="ts">
	import type { PageProps } from './$types';
	import { projectTypeLabel, resolveEmbedUrl } from '#lib/projects.js';

	let { data }: PageProps = $props();

	const project = $derived(data.project);
	const embedUrl = $derived(resolveEmbedUrl(project.project_type, project.link));
	const isOwner = $derived(Boolean(data.user && data.user.id === project.created_by));

	const addedOn = $derived(
		new Date(project.created_at).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);
</script>

<svelte:head>
	<title>{project.name} · td-shows</title>
</svelte:head>

<nav class="breadcrumb">
	<a href="/">← All projects</a>
</nav>

<div class="detail">
	<aside class="info card card-pad">
		<div class="cover">
			{#if project.thumbnail_url}
				<img src={project.thumbnail_url} alt="" />
			{:else}
				<span class="initial">{project.name.charAt(0).toUpperCase()}</span>
			{/if}
		</div>

		<h1>{project.name}</h1>

		<div class="meta">
			<span class="badge">{projectTypeLabel(project.project_type)}</span>
			<span class="muted date">Added {addedOn}</span>
		</div>

		{#if project.description}
			<p class="description">{project.description}</p>
		{:else}
			<p class="description muted">No description provided.</p>
		{/if}

		<div class="actions">
			<a class="btn btn-secondary" href={project.link} target="_blank" rel="noopener noreferrer">
				Open original ↗
			</a>
			{#if project.file_url}
				<a
					class="btn btn-secondary"
					href={project.file_url}
					target="_blank"
					rel="noopener noreferrer"
					download
				>
					Download file
				</a>
			{/if}
			{#if isOwner}
				<a class="btn btn-secondary" href={`/projects/${project.id}/edit`}>Edit project</a>
			{/if}
		</div>
	</aside>

	<section class="stage card">
		<header class="stage-bar">
			<span class="dot"></span>
			<span class="dot"></span>
			<span class="dot"></span>
			<span class="stage-title">Play · {project.name}</span>
		</header>
		<div class="player">
			<iframe
				src={embedUrl}
				title={project.name}
				allow="fullscreen; autoplay; gamepad; clipboard-write"
				allowfullscreen
			></iframe>
		</div>
	</section>
</div>

<style>
	.breadcrumb {
		margin: 1.75rem 0 1.25rem;
		font-size: 0.9rem;
	}

	.breadcrumb a {
		color: var(--text-muted);
	}

	.breadcrumb a:hover {
		color: var(--text);
		text-decoration: none;
	}

	.detail {
		display: grid;
		grid-template-columns: 340px minmax(0, 1fr);
		gap: 1.5rem;
		align-items: start;
		margin-bottom: 2rem;
	}

	@media (max-width: 900px) {
		.detail {
			grid-template-columns: 1fr;
		}
	}

	.info {
		position: sticky;
		top: 86px;
	}

	@media (max-width: 900px) {
		.info {
			position: static;
		}
	}

	.cover {
		aspect-ratio: 16 / 9;
		border-radius: var(--radius);
		overflow: hidden;
		display: grid;
		place-items: center;
		background: var(--gradient);
		margin-bottom: 1.1rem;
	}

	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.cover .initial {
		font-size: 3rem;
		font-weight: 800;
		color: #fff;
		text-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
	}

	h1 {
		margin: 0 0 0.6rem;
		font-size: 1.5rem;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.date {
		font-size: 0.82rem;
	}

	.description {
		white-space: pre-wrap;
		font-size: 0.95rem;
		margin-bottom: 1.25rem;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.stage {
		overflow: hidden;
	}

	.stage-bar {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.7rem 0.9rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface-2);
	}

	.dot {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: var(--border-strong);
	}

	.stage-title {
		margin-left: 0.5rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
