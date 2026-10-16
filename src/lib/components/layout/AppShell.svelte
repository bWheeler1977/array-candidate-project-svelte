<script lang="ts">
	import AppHeader from './AppHeader.svelte';
	import type { AppTheme } from '$lib/theme/types';

	export let theme: AppTheme;
	export let activeNav: 'accounts' | 'transfers' = 'accounts';
	export let users: string[] = [];
	export let activeUser = '';
	export let isEmbedMode = false;
</script>

<div class="shell">
	<div class="bank-widget">
		<AppHeader {theme} {activeNav} {users} {activeUser} {isEmbedMode} />
		<main class="widget-main">
			<slot />
		</main>
	</div>
</div>

<style>
	.shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--s-6) var(--s-4) var(--s-10);
		box-sizing: border-box;
	}

	.bank-widget {
		width: min(100%, 70rem);
		margin: 0 auto;
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		background: var(--c-white);
		border: var(--border-size-thin) solid var(--c-gray);
		border-radius: var(--radius-xl);
		box-sizing: border-box;
		overflow: hidden;
	}

	.widget-main {
		flex: 0 0 auto;
		padding: 0 var(--s-6) var(--s-6);
		min-width: 0;
	}

	@media (min-width: 768px) {
		.shell {
			padding: var(--s-8) var(--s-6) var(--s-12);
		}
	}
</style>
