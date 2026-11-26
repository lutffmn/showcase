<script lang="ts">
	import type { PageProps } from './$types';
	import { projectTypeLabel } from '#lib/projects.js';

	let { data }: PageProps = $props();

	const count = $derived(data.projects.length);
</script>

<svelte:head>
	<title>td-shows · Projects</title>
</svelte:head>

<div class="page-head">
	<div>
		<span class="eyebrow">Browse</span>
		<h1>Projects</h1>
		<p class="muted">
			{count}
			{count === 1 ? 'project' : 'projects'} to play
		</p>
	</div>
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
	<ul class="project-grid">
		{#each data.projects as project (project.id)}
			<li>
				<a class="card tile" href={`/projects/${project.id}`}>
					<div class="tile-thumb">
						{#if project.thumbnail_url}
							<img src={project.thumbnail_url} alt="" loading="lazy" />
						{:else}
							<span class="initial">{project.name.charAt(0).toUpperCase()}</span>
						{/if}
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
