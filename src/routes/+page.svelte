<script lang="ts">
	import type { PageProps } from './$types';
	import { projectTypeLabel, PROJECT_TYPES } from '#lib/projects.js';

	let { data }: PageProps = $props();

	const count = $derived(data.projects.length);
</script>

<svelte:head>
	<title>td-shows · Projects</title>
</svelte:head>

<section class="hero">
	<span class="eyebrow">Showcase</span>
	<h1 class="hero-title">
		Play <span class="grad">handmade games</span> &amp; playful projects
	</h1>
	<p class="hero-sub">
		A growing collection of Scratch and Construct 3 builds you can jump straight into — no
		downloads, no waiting.
	</p>
	<div class="hero-actions">
		{#if data.user}
			<a class="btn btn-lg" href="/projects/new">Create a project</a>
			<a class="btn btn-secondary btn-lg" href="/dashboard">My projects</a>
		{:else}
			<a class="btn btn-lg" href="/register">Get started</a>
			<a class="btn btn-secondary btn-lg" href="/login">Log in</a>
		{/if}
	</div>
	<div class="hero-stats">
		<div class="stat">
			<strong>{count}</strong>
			<span>{count === 1 ? 'project' : 'projects'}</span>
		</div>
		<div class="stat">
			<strong>{PROJECT_TYPES.length}</strong>
			<span>platforms</span>
		</div>
	</div>
</section>

<div class="section-head">
	<h2>All projects</h2>
	{#if data.user}
		<a class="btn btn-sm" href="/projects/new">New project</a>
	{/if}
</div>

{#if data.error}
	<div class="alert alert-error">{data.error}</div>
{/if}

{#if data.projects.length === 0}
	<div class="card card-pad empty-state">
		<h2>No projects yet</h2>
		<p class="muted">Be the first to add something playable.</p>
		{#if data.user}
			<a class="btn" href="/projects/new">Add a project</a>
		{:else}
			<a class="btn" href="/login">Log in to add a project</a>
		{/if}
	</div>
{:else}
	<ul class="project-grid stagger">
		{#each data.projects as project, i (project.id)}
			<li style="--i: {i}">
				<a class="card tile" href={`/projects/${project.id}`}>
					<div class="tile-thumb">
						{#if project.thumbnail_url}
							<img src={project.thumbnail_url} alt="" loading="lazy" />
						{:else}
							<span class="initial">{project.name.charAt(0).toUpperCase()}</span>
						{/if}
						<span class="tile-play" aria-hidden="true">
							<svg viewBox="0 0 24 24" width="18" height="18" fill="none">
								<path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
							</svg>
						</span>
					</div>
					<div class="tile-body">
						<span class="tile-title">{project.name}</span>
						<span class="badge badge-neutral">{projectTypeLabel(project.project_type)}</span>
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}
