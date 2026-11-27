<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { PROJECT_TYPES } from '#lib/projects.js';

	let { form }: PageProps = $props();
	let submitting = $state(false);
	let projectType = $state(untrack(() => form?.project_type ?? 'scratch'));
</script>

<svelte:head>
	<title>New project · td-shows</title>
</svelte:head>

<div class="form-page">
	<div class="form-head">
		<span class="eyebrow">Create</span>
		<h1>New project</h1>
		<p class="muted">Add a link to something playable, plus any optional details.</p>
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
			<input id="name" name="name" type="text" placeholder="My awesome game" required value={form?.name ?? ''} />
		</div>

		<div class="field">
			<label for="description">Description</label>
			<textarea
				id="description"
				name="description"
				rows="4"
				placeholder="What is it about? How do you play it?"
			>{form?.description ?? ''}</textarea>
		</div>

		<div class="field">
			<label for="project_type">Project type</label>
			<select id="project_type" name="project_type" required bind:value={projectType}>
				{#each PROJECT_TYPES as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</div>

		<div class="field">
			<label for="link">Project link</label>
			<input
				id="link"
				name="link"
				type="url"
				placeholder="https://scratch.mit.edu/projects/123456/"
				required={projectType !== 'construct3'}
				value={form?.link ?? ''}
			/>
			<span class="hint">
				{projectType === 'construct3'
					? 'Where the project is hosted. Optional if you upload an export below.'
					: 'Where the project is played or hosted.'}
			</span>
		</div>

		{#if projectType === 'construct3'}
			<div class="field">
				<label for="game_export">
					Game export <span class="muted">— .zip, optional</span>
				</label>
				<input id="game_export" name="game_export" type="file" accept=".zip,application/zip" />
				<span class="hint">
					In Construct 3: <strong>Menu → Export → Web (HTML5)</strong>. Zip the contents of the
					exported folder (you should see <code>index.html</code> at the top level) and upload it here
					— we'll host it so the game plays right on this page.
				</span>
			</div>
		{/if}

		<div class="two-up">
			<div class="field">
				<label for="thumbnail">Thumbnail <span class="muted">— optional</span></label>
				<input id="thumbnail" name="thumbnail" type="file" accept="image/*" />
			</div>

			<div class="field">
				<label for="file">Project file <span class="muted">— optional</span></label>
				<input id="file" name="file" type="file" />
			</div>
		</div>

		<div class="submit-row">
			<a class="btn btn-ghost" href="/">Cancel</a>
			<button class="btn" type="submit" disabled={submitting} aria-busy={submitting}>
				{#if submitting}<span class="spinner" aria-hidden="true"></span>{/if}
				{submitting ? 'Creating…' : 'Create project'}
			</button>
		</div>
	</form>
</div>

<style>
	.form-page {
		max-width: 620px;
		margin: 2.25rem auto 0;
	}

	.form-page > .card {
		box-shadow: var(--shadow-md);
	}

	.form-head {
		margin-bottom: 1.5rem;
	}

	.form-head h1 {
		font-size: clamp(1.6rem, 3vw, 2rem);
		margin-bottom: 0.25rem;
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

	.submit-row {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 0.5rem;
	}
</style>
