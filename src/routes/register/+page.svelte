<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Register · td-shows</title>
</svelte:head>

<div class="auth">
	<div class="card card-pad">
		<div class="head">
			<span class="eyebrow">Get started</span>
			<h1>Create account</h1>
			<p class="muted">Sign up with your email and a password.</p>
		</div>

		{#if form?.error}
			<div class="alert alert-error">{form.error}</div>
		{/if}

		{#if form?.success}
			<div class="alert alert-success">{form.success}</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<div class="field">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required value={form?.email ?? ''} />
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					placeholder="At least 6 characters"
					minlength="6"
					required
				/>
			</div>

			<button class="btn btn-block" type="submit" disabled={submitting}>
				{submitting ? 'Creating account…' : 'Create account'}
			</button>
		</form>

		<p class="switch muted">
			Already have an account? <a href="/login">Log in</a>
		</p>
	</div>
</div>

<style>
	.auth {
		max-width: 420px;
		margin: 3rem auto 0;
	}

	.head {
		margin-bottom: 1.5rem;
	}

	.head h1 {
		margin: 0 0 0.25rem;
		font-size: 1.65rem;
	}

	.head p {
		margin: 0;
	}

	.switch {
		margin: 1.25rem 0 0;
		text-align: center;
		font-size: 0.9rem;
	}
</style>
