<script lang="ts">
	// Register domain labels for the whole route tree (one lookup per navigation).
	import '../app.css';
	import { setDomainsContext } from '$lib/context/domains';
	import ThemeProvider from '$lib/theme/ThemeProvider.svelte';
	import { northwindTheme } from '$lib/theme/presets/northwind';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: setDomainsContext(data.domains);
</script>

<ThemeProvider theme={northwindTheme}>
	<slot />
</ThemeProvider>
