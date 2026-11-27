<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Log in · Showcase</title>
</svelte:head>

<div class="auth">
	<div class="card card-pad">
		<div class="head">
			<span class="eyebrow">Welcome back</span>
			<h1>Log in</h1>
			<p class="muted">Enter your details to continue.</p>
		</div>

		{#if form?.error}
			<div class="alert alert-error">{form.error}</div>
		{:else if data.error}
			<div class="alert alert-error">{data.error}</div>
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
			<input type="hidden" name="redirectTo" value={data.redirectTo} />

			<div class="field">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required value={form?.email ?? ''} />
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required />
			</div>

			<button class="btn btn-block" type="submit" disabled={submitting} aria-busy={submitting}>
				{#if submitting}<span class="spinner" aria-hidden="true"></span>{/if}
				{submitting ? 'Logging in…' : 'Log in'}
			</button>
		</form>

		<p class="switch muted">
			Don't have an account? <a href="/register">Create one</a>
		</p>
	</div>
</div>

<style>
	.auth {
		max-width: 440px;
		margin: 3.5rem auto 0;
	}

	.auth .card {
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-lg);
	}

	.auth .card::before {
		content: '';
		position: absolute;
		inset: 0 0 auto 0;
		height: 4px;
		background: var(--gradient);
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
