<script lang="ts">
	import AccountsView from '$lib/components/accounts/AccountsView.svelte';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import { northwindTheme } from '$lib/theme/presets/northwind';
	import type { PageData } from './$types';
	import { msg, messages } from '$lib/i18n';

	export let data: PageData;
</script>

<svelte:head>
	<title>{msg(messages.pageTitle.accounts, { brand: northwindTheme.brand.name })}</title>
</svelte:head>

<AppShell
	theme={northwindTheme}
	activeNav="accounts"
	users={data.users}
	activeUser={data.activeUser}
	isEmbedMode={data.isEmbedMode}
>
	<AccountsView
		accounts={data.accounts}
		transfers={data.transfers}
		activeUser={data.activeUser}
		error={data.error}
	/>
</AppShell>
