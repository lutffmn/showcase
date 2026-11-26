<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let savingProfile = $state(false);
	let savingPassword = $state(false);

	let showCurrent = $state(false);
	let showNew = $state(false);
	let showConfirm = $state(false);

	const email = $derived(data.user?.email ?? '');
	const fullName = $derived(String(data.user?.user_metadata?.full_name ?? ''));
</script>

<svelte:head>
	<title>Account · td-shows</title>
</svelte:head>

{#snippet pwField(opts: {
	id: string;
	name: string;
	label: string;
	autocomplete: 'current-password' | 'new-password';
	placeholder: string;
	minlength?: number;
	shown: boolean;
	toggle: () => void;
})}
	<div class="field">
		<label for={opts.id}>{opts.label}</label>
		<div class="pw">
			<input
				id={opts.id}
				name={opts.name}
				type={opts.shown ? 'text' : 'password'}
				autocomplete={opts.autocomplete}
				placeholder={opts.placeholder}
				minlength={opts.minlength}
				required
			/>
			<button
				type="button"
				class="pw-toggle"
				class:on={opts.shown}
				onclick={opts.toggle}
				aria-label={opts.shown ? 'Hide password' : 'Show password'}
				aria-pressed={opts.shown}
				title={opts.shown ? 'Hide password' : 'Show password'}
			>
				{#if opts.shown}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
						<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
						<path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
						<path d="M2 2l20 20" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
				{/if}
			</button>
		</div>
	</div>
{/snippet}

<div class="page-head">
	<div>
		<span class="eyebrow">Settings</span>
		<h1>Your account</h1>
		<p class="muted">Update your profile details and password.</p>
	</div>
</div>

<div class="settings">
	<section class="card card-pad">
		<h2>Profile</h2>
		<p class="muted section-sub">Your display name and sign-in email.</p>

		{#if form?.scope === 'profile' && form.error}
			<div class="alert alert-error">{form.error}</div>
		{:else if form?.scope === 'profile' && form.success}
			<div class="alert alert-success">{form.success}</div>
		{/if}

		<form
			method="POST"
			action="?/updateProfile"
			use:enhance={() => {
				savingProfile = true;
				return async ({ update }) => {
					await update();
					savingProfile = false;
				};
			}}
		>
			<div class="field">
				<label for="full_name">Display name</label>
				<input id="full_name" name="full_name" type="text" autocomplete="name" placeholder="Your name" value={fullName} />
			</div>

			<div class="field">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required value={email} />
			</div>

			<button class="btn" type="submit" disabled={savingProfile}>
				{savingProfile ? 'Saving…' : 'Save profile'}
			</button>
		</form>
	</section>

	<section class="card card-pad">
		<h2>Password</h2>
		<p class="muted section-sub">Use at least 6 characters.</p>

		{#if form?.scope === 'password' && form.error}
			<div class="alert alert-error">{form.error}</div>
		{:else if form?.scope === 'password' && form.success}
			<div class="alert alert-success">{form.success}</div>
		{/if}

		<form
			method="POST"
			action="?/updatePassword"
			use:enhance={() => {
				savingPassword = true;
				return async ({ update }) => {
					await update();
					savingPassword = false;
				};
			}}
		>
			{@render pwField({
				id: 'current_password',
				name: 'current_password',
				label: 'Current password',
				autocomplete: 'current-password',
				placeholder: '••••••••',
				shown: showCurrent,
				toggle: () => (showCurrent = !showCurrent)
			})}

			{@render pwField({
				id: 'new_password',
				name: 'new_password',
				label: 'New password',
				autocomplete: 'new-password',
				placeholder: 'At least 6 characters',
				minlength: 6,
				shown: showNew,
				toggle: () => (showNew = !showNew)
			})}

			{@render pwField({
				id: 'confirm_password',
				name: 'confirm_password',
				label: 'Confirm new password',
				autocomplete: 'new-password',
				placeholder: 'Repeat new password',
				minlength: 6,
				shown: showConfirm,
				toggle: () => (showConfirm = !showConfirm)
			})}

			<button class="btn" type="submit" disabled={savingPassword}>
				{savingPassword ? 'Updating…' : 'Update password'}
			</button>
		</form>
	</section>
</div>

<style>
	.settings {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.25rem;
		align-items: start;
		max-width: 880px;
		margin-bottom: 3rem;
	}

	@media (max-width: 720px) {
		.settings {
			grid-template-columns: 1fr;
		}
	}

	h2 {
		font-size: 1.15rem;
		margin: 0;
	}

	.section-sub {
		font-size: 0.9rem;
		margin: 0.25rem 0 1.25rem;
	}

	.pw {
		position: relative;
		display: flex;
		align-items: center;
	}

	.pw input {
		padding-right: 2.75rem;
	}

	.pw-toggle {
		position: absolute;
		right: 0.4rem;
		top: 50%;
		transform: translateY(-50%);
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		padding: 0;
		border: 0;
		border-radius: 7px;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition:
			color 0.15s ease,
			background-color 0.15s ease;
	}

	.pw-toggle:hover {
		color: var(--text);
		background: var(--surface-2);
	}

	.pw-toggle.on {
		color: var(--primary);
	}

	.pw-toggle:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px var(--ring);
	}
</style>
