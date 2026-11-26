<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { PROJECT_TYPES, projectTypeLabel } from '#lib/projects.js';

	let { data, form }: PageProps = $props();

	const project = $derived(data.project);
	let submitting = $state(false);

	function confirmDelete(event: SubmitEvent) {
		if (!confirm('Delete this project? This cannot be undone.')) {
			event.preventDefault();
		}
	}
</script>

<svelte:head>
	<title>Edit {project.name} · td-shows</title>
</svelte:head>

<div class="form-page">
	<nav class="breadcrumb">
		<a href={`/projects/${project.id}`}>← {project.name}</a>
	</nav>

	<div class="form-head">
		<div class="title-row">
			<h1>Edit project</h1>
			<span class="badge badge-neutral">{projectTypeLabel(project.project_type)}</span>
		</div>
		<p class="muted">Update the details, or replace the thumbnail and file.</p>
	</div>

	{#if form?.error}
		<div class="alert alert-error">{form.error}</div>
	{/if}

	<form
		class="card card-pad"
		method="POST"
		enctype="multipart/form-data"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<div class="field">
			<label for="name">Project name</label>
			<input id="name" name="name" type="text" required value={form?.name ?? project.name} />
		</div>

		<div class="field">
			<label for="description">Description</label>
			<textarea id="description" name="description" rows="4">{form?.description ?? project.description ?? ''}</textarea>
		</div>

		<div class="field">
			<label for="project_type">Project type</label>
			<select
				id="project_type"
				name="project_type"
				required
				value={form?.project_type ?? project.project_type}
			>
				{#each PROJECT_TYPES as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</div>

		<div class="field">
			<label for="link">Project link</label>
			<input id="link" name="link" type="url" required value={form?.link ?? project.link} />
		</div>

		<div class="two-up">
			<div class="field">
				<label for="thumbnail">Replace thumbnail</label>
				{#if project.thumbnail_url}
					<div class="current">
						<img src={project.thumbnail_url} alt="Current thumbnail" />
						<label class="checkline">
							<input type="checkbox" name="remove_thumbnail" />
							Remove
						</label>
					</div>
				{/if}
				<input id="thumbnail" name="thumbnail" type="file" accept="image/*" />
				<span class="hint">Leave empty to keep the current image.</span>
			</div>

			<div class="field">
				<label for="file">Replace project file</label>
				{#if project.file_url}
					<div class="current">
						<a href={project.file_url} target="_blank" rel="noopener noreferrer">Current file ↗</a>
						<label class="checkline">
							<input type="checkbox" name="remove_file" />
							Remove
						</label>
					</div>
				{/if}
				<input id="file" name="file" type="file" />
				<span class="hint">Leave empty to keep the current file.</span>
			</div>
		</div>

		<div class="submit-row">
			<a class="btn btn-ghost" href={`/projects/${project.id}`}>Cancel</a>
			<button class="btn" type="submit" disabled={submitting}>
				{submitting ? 'Saving…' : 'Save changes'}
			</button>
		</div>
	</form>

	<div class="card card-pad danger-zone">
		<div>
			<strong>Delete project</strong>
			<p class="muted">This permanently removes the project and its uploaded files.</p>
		</div>
		<form method="POST" action={`/projects/${project.id}/delete`} onsubmit={confirmDelete}>
			<button class="btn btn-danger" type="submit">Delete</button>
		</form>
	</div>
</div>

<style>
	.form-page {
		max-width: 620px;
		margin: 1.75rem auto 0;
	}

	.breadcrumb {
		margin-bottom: 1.25rem;
		font-size: 0.9rem;
	}

	.breadcrumb a {
		color: var(--text-muted);
	}

	.breadcrumb a:hover {
		color: var(--text);
		text-decoration: none;
	}

	.form-head {
		margin-bottom: 1.5rem;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.form-head h1 {
		margin: 0;
		font-size: clamp(1.6rem, 3vw, 2rem);
	}

	.form-head p {
		margin: 0.35rem 0 0;
	}

	.two-up {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 560px) {
		.two-up {
			grid-template-columns: 1fr;
		}
	}

	.current {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.current img {
		width: 96px;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}

	.submit-row {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 0.5rem;
	}

	.danger-zone {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1.5rem;
		border-color: color-mix(in srgb, var(--danger) 30%, var(--border));
	}

	.danger-zone p {
		margin: 0.25rem 0 0;
		font-size: 0.88rem;
	}
</style>
