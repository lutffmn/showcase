<script lang="ts">
	import type { PageProps } from './$types';
	import { projectTypeLabel } from '#lib/projects.js';

	let { data }: PageProps = $props();

	function confirmDelete(event: SubmitEvent) {
		if (!confirm('Delete this project? This cannot be undone.')) {
			event.preventDefault();
		}
	}
</script>

<svelte:head>
	<title>My projects · Showcase</title>
</svelte:head>

<div class="page-head">
	<div>
		<span class="eyebrow">Manage</span>
		<h1>My projects</h1>
		<p class="muted">
			{data.projects.length}
			{data.projects.length === 1 ? 'project' : 'projects'}
		</p>
	</div>
	<a class="btn btn-sm" href="/projects/new">New project</a>
</div>

{#if data.error}
	<div class="alert alert-error">{data.error}</div>
{/if}

{#if data.projects.length === 0}
	<div class="card card-pad empty-state">
		<h2>Nothing here yet</h2>
		<p class="muted">Create your first project and it'll show up on the homepage.</p>
		<a class="btn" href="/projects/new">Create a project</a>
	</div>
{:else}
	<ul class="manage-list stagger">
		{#each data.projects as project, i (project.id)}
			<li class="card manage-row" style="--i: {i}">
				<a class="thumb" href={`/projects/${project.id}`}>
					{#if project.thumbnail_url}
						<img src={project.thumbnail_url} alt="" loading="lazy" />
					{:else}
						<span class="initial">{project.name.charAt(0).toUpperCase()}</span>
					{/if}
				</a>

				<div class="info">
					<a class="name" href={`/projects/${project.id}`}>{project.name}</a>
					<span class="badge badge-neutral">{projectTypeLabel(project.project_type)}</span>
				</div>

				<div class="row-actions">
					<a class="btn btn-secondary btn-sm" href={`/projects/${project.id}/edit`}>Edit</a>
					<form method="POST" action={`/projects/${project.id}/delete`} onsubmit={confirmDelete}>
						<button class="btn btn-danger btn-sm" type="submit">Delete</button>
					</form>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<section class="card card-pad account">
	<div>
		<h2>Account</h2>
		<p class="muted">Signed in as <strong>{data.user?.email}</strong>.</p>
	</div>
	<div class="account-actions">
		<a class="btn btn-secondary btn-sm" href="/account">Edit account</a>
		<form method="POST" action="/logout">
			<button class="btn btn-ghost btn-sm" type="submit">Sign out</button>
		</form>
	</div>
</section>

<style>
	.manage-list {
		list-style: none;
		margin: 0 0 2.5rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.manage-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.85rem;
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			transform 0.18s ease;
	}

	.manage-row:hover {
		border-color: var(--border-strong);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.thumb {
		flex-shrink: 0;
		width: 112px;
		aspect-ratio: 16 / 9;
		border-radius: var(--radius);
		overflow: hidden;
		display: grid;
		place-items: center;
		background: var(--gradient);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.manage-row:hover .thumb img {
		transform: scale(1.07);
	}

	.thumb .initial {
		font-size: 1.6rem;
		font-weight: 800;
		color: #fff;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
		flex: 1;
	}

	.name {
		font-weight: 600;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 0.18s ease;
	}

	.name:hover {
		color: var(--text);
		text-decoration: none;
	}

	.row-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.account {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.account-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.account h2 {
		margin: 0;
		font-size: 1.05rem;
	}

	.account p {
		margin: 0.2rem 0 0;
		font-size: 0.9rem;
	}
</style>
