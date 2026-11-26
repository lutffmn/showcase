<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>td-shows</title>
</svelte:head>

<header class="site-header">
	<div class="container header-inner">
		<a class="brand" href="/">
			<span class="mark" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none">
					<path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
				</svg>
			</span>
			<span>td-shows</span>
		</a>

		<nav class="site-nav">
			{#if data.user}
				<a class="nav-link" class:active={page.url.pathname === '/dashboard'} href="/dashboard">
					My projects
				</a>
				<a class="nav-link" class:active={page.url.pathname === '/account'} href="/account">
					Account
				</a>

				<a class="btn btn-sm" href="/projects/new">New project</a>

				<form method="POST" action="/logout">
					<button class="btn btn-ghost btn-sm" type="submit">Sign out</button>
				</form>
			{:else}
				<a class="nav-link" class:active={page.url.pathname === '/login'} href="/login">Log in</a>
				<a class="nav-link" class:active={page.url.pathname === '/register'} href="/register">
					Register
				</a>
			{/if}
		</nav>
	</div>
</header>

<main class="container main-content">
	{@render children()}
</main>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: color-mix(in srgb, var(--bg) 80%, transparent);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border);
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 62px;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text);
		text-decoration: none;
	}

	.brand:hover {
		color: var(--text);
		text-decoration: none;
	}

	.mark {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 9px;
		background: var(--gradient);
		color: #fff;
		box-shadow: var(--shadow-sm);
	}

	.site-nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-link {
		padding: 0.45rem 0.7rem;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		font-weight: 600;
		font-size: 0.92rem;
		text-decoration: none;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.nav-link:hover {
		background: var(--surface-2);
		color: var(--text);
		text-decoration: none;
	}

	.nav-link.active {
		color: var(--text);
	}

	.main-content {
		padding-bottom: 4rem;
		min-height: 60vh;
	}
</style>
