<script lang="ts">
	import UserSwitcher from './UserSwitcher.svelte';
	import { dev } from '$app/environment';
	import type { AppTheme } from '$lib/theme/types';
	import { msg, messages } from '$lib/i18n';

	export let theme: AppTheme;
	export let activeNav: 'accounts' | 'transfers' = 'accounts';
	export let users: string[] = [];
	export let activeUser = '';
	/** Host embed session — hide sandbox user switcher even in dev. */
	export let isEmbedMode = false;
</script>

<header class="header">
	<div class="header-inner">
		<a
			class="brand"
			href="/"
			aria-label={msg(messages.nav.brandHome, { brand: theme.brand.name })}
		>
			{#if theme.brand.logoSrc}
				<img class="brand-logo" src={theme.brand.logoSrc} alt={theme.brand.logoAlt ?? theme.brand.name} />
			{:else}
				<span class="brand-text">{theme.brand.name}</span>
			{/if}
		</a>

		<nav class="nav" aria-label={messages.nav.primary}>
			<a
				class="nav-link"
				class:active={activeNav === 'accounts'}
				href="/"
				aria-current={activeNav === 'accounts' ? 'page' : undefined}
			>
				{messages.nav.accounts}
			</a>
			<a
				class="nav-link"
				class:active={activeNav === 'transfers'}
				href="/transfers"
				aria-current={activeNav === 'transfers' ? 'page' : undefined}
			>
				{messages.nav.transfers}
			</a>
		</nav>

		{#if dev && !isEmbedMode}
			<div class="header-switcher">
				<UserSwitcher variant="compact" {users} {activeUser} />
			</div>
		{/if}
	</div>
</header>

<style>
	.header {
		flex-shrink: 0;
	}

	.header-inner {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-areas:
			'brand nav'
			'switcher switcher';
		align-items: center;
		column-gap: var(--s-4);
		row-gap: var(--s-4);
		padding: var(--s-4);
		box-sizing: border-box;
	}

	.header-inner:not(:has(.header-switcher)) {
		grid-template-areas: 'brand nav';
	}

	.brand {
		grid-area: brand;
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		color: inherit;
		min-width: 0;
	}

	.nav {
		grid-area: nav;
		justify-self: end;
		display: flex;
		align-items: center;
		gap: var(--s-5);
		flex-shrink: 0;
	}

	.header-switcher {
		grid-area: switcher;
		min-width: 0;
		width: 100%;
	}

	.brand-logo {
		display: block;
		height: 1.1875rem;
		width: auto;
		max-width: 9.5rem;
	}

	.brand-text {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-semi-bold);
		line-height: 1.2;
	}

	.nav-link {
		font-size: var(--text-fs);
		font-weight: var(--fw-medium);
		line-height: 1.2;
		color: var(--wl-nav-inactive, var(--text-light-fg-ci));
		text-decoration: none;
	}

	.nav-link:hover {
		color: var(--wl-nav-active, var(--c-blue));
	}

	.nav-link:focus-visible {
		outline: 2px solid var(--wl-primary, var(--c-blue));
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.nav-link.active {
		color: var(--wl-nav-active, var(--c-blue));
	}

	@media (min-width: 641px) {
		.header-inner {
			grid-template-columns: minmax(0, 1fr) auto auto;
			grid-template-areas: 'brand switcher nav';
			row-gap: 0;
			padding: var(--s-6);
		}

		.header-inner:not(:has(.header-switcher)) {
			grid-template-areas: 'brand nav';
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.header-switcher {
			justify-self: end;
			width: auto;
		}

		.brand-logo {
			height: 1.625rem;
		}

		.brand-text {
			font-size: var(--title-md-fs);
		}

		.nav {
			gap: var(--s-8);
		}

		.nav-link {
			padding: var(--s-2) 0;
		}
	}
</style>
