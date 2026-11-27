<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// Smooth page-to-page transitions using the View Transitions API. Older
	// browsers (and users who prefer reduced motion) simply navigate normally.
	onNavigate((navigation) => {
		const doc = document as unknown as {
			startViewTransition?: (callback: () => Promise<void> | void) => unknown;
		};
		const startViewTransition = doc.startViewTransition;
		if (!startViewTransition || prefersReducedMotion.current) return;

		const root = document.documentElement;
		root.classList.add('vt-nav');

		return new Promise<void>((resolve) => {
			startViewTransition.call(document, async () => {
				resolve();
				await navigation.complete;
			});
		}).finally(() => {
			root.classList.remove('vt-nav');
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Showcase</title>
</svelte:head>

<header class="site-header">
	<div class="container header-inner">
		<a class="brand" href="/">
			<span class="mark" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="17" height="17" fill="none">
					<path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
				</svg>
			</span>
			<span class="brand-name">Showcase</span>
		</a>

		<nav class="site-nav">
			{#if data.user}
				<a class="nav-link" class:active={page.url.pathname === '/dashboard'} href="/dashboard">
					My projects
				</a>
				<a class="nav-link" class:active={page.url.pathname === '/account'} href="/account">
					Account
				</a>

				<a class="btn btn-sm nav-cta" href="/projects/new">New project</a>

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
	{#key page.url.pathname}
		<div class="page-transition">
			{@render children()}
		</div>
	{/key}
</main>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 40;
		background: color-mix(in srgb, var(--bg) 74%, transparent);
		backdrop-filter: blur(16px) saturate(160%);
		-webkit-backdrop-filter: blur(16px) saturate(160%);
		border-bottom: 2px solid var(--primary-soft);
		view-transition-name: site-header;
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 66px;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-weight: 800;
		font-family: var(--font-display);
		letter-spacing: -0.02em;
		color: var(--navy);
		text-decoration: none;
		transition: color 0.18s ease;
	}

	.brand:hover {
		color: var(--navy);
		text-decoration: none;
	}

	.brand-name {
		font-size: 1.03rem;
	}

	.mark {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 11px;
		background: var(--gradient);
		color: var(--navy-deep);
		border: 1px solid rgba(255, 255, 255, 0.6);
		transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.brand:hover .mark,
	.brand:focus-visible .mark {
		transform: rotate(-8deg) scale(1.08);
	}

	.site-nav {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.nav-link {
		position: relative;
		padding: 0.5rem 0.85rem;
		border-radius: var(--radius-full);
		color: var(--text-muted);
		font-weight: 700;
		font-size: 0.92rem;
		text-decoration: none;
		transition:
			background-color 0.18s ease,
			color 0.18s ease;
	}

	/* Animated lime underline, like the Academy navigation. */
	.nav-link::after {
		content: '';
		position: absolute;
		left: 0.85rem;
		right: 0.85rem;
		bottom: 0.26rem;
		height: 2px;
		border-radius: 2px;
		background: var(--primary-deep);
		transform: scaleX(0);
		transform-origin: center;
		transition: transform 0.22s cubic-bezier(0.7, 0, 0.2, 1);
	}

	.nav-link:hover {
		background: var(--primary-soft);
		color: var(--navy);
		text-decoration: none;
	}

	.nav-link:hover::after,
	.nav-link:focus-visible::after,
	.nav-link.active::after {
		transform: scaleX(1);
	}

	.nav-link.active {
		color: var(--navy-deep);
	}

	.nav-cta {
		margin-left: 0.35rem;
	}

	.main-content {
		padding-top: 0.5rem;
		padding-bottom: 5rem;
		min-height: 62vh;
	}
</style>
