<script lang="ts">
	import { setContext } from 'svelte';
	import { cssVarsToStyle, themeToCssVars } from './applyTheme';
	import type { AppTheme } from './types';

	export let theme: AppTheme;

	const THEME_KEY = 'app-theme';
	setContext(THEME_KEY, theme);

	$: cssVars = themeToCssVars(theme);
	$: style = cssVarsToStyle(cssVars);
</script>

<div class="theme-root" {style} data-theme={theme.id}>
	<slot />
</div>

<style>
	.theme-root {
		min-height: 100vh;
		background: var(--wl-surface-muted, var(--c-gray-lighter));
		color: var(--wl-text, var(--text-fg-ci));
		font-family: var(--text-font), system-ui, sans-serif;
		-webkit-font-smoothing: antialiased;
	}
</style>
