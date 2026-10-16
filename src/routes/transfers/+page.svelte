<script lang="ts">
	import { goto } from '$app/navigation';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import TransferView from '$lib/components/transfers/TransferView.svelte';
	import { northwindTheme } from '$lib/theme/presets/northwind';
	import type { ActionData, PageData } from './$types';
	import { msg, messages } from '$lib/i18n';

	const bankName = messages.brand.bankLegalName;

	export let data: PageData;
	export let form: ActionData;

	let fromAccountId = '';
	let toAccountId = '';
	let amount = '';
	let reference = '';
	let isSubmitting = false;

	$: if (form?.values) {
		fromAccountId = form.values.fromAccountId;
		toAccountId = form.values.toAccountId;
		amount = form.values.amount;
		reference = form.values.reference;
	}

	$: fieldErrors = form?.fieldErrors ?? {};
	$: outcome = form?.outcome ?? 'idle';
	$: outcomeMessage = form?.outcomeMessage ?? '';
	$: successAmount = form?.successAmount ?? null;
	$: successCurrency = form?.successCurrency ?? 'USD';
	$: successFromAccountId = form?.successFromAccountId ?? '';
	$: successToAccountId = form?.successToAccountId ?? '';
	$: successConfirmation = form?.successConfirmation ?? '';
	$: successTransferDate = form?.successTransferDate ?? '';

	async function dismissOutcome() {
		await goto('/transfers', { invalidateAll: true, replaceState: true, keepFocus: true });
	}
</script>

<svelte:head>
	<title>{msg(messages.pageTitle.transfers, { brand: northwindTheme.brand.name })}</title>
</svelte:head>

<AppShell
	theme={northwindTheme}
	activeNav="transfers"
	users={data.users}
	activeUser={data.activeUser}
	isEmbedMode={data.isEmbedMode}
>
	<TransferView
		accounts={data.accounts}
		transfers={data.transfers}
		loadError={data.loadError}
		activeUser={data.activeUser}
		{bankName}
		bind:fromAccountId
		bind:toAccountId
		bind:amount
		bind:reference
		bind:isSubmitting
		{fieldErrors}
		{outcome}
		{outcomeMessage}
		{successAmount}
		{successCurrency}
		{successFromAccountId}
		{successToAccountId}
		{successConfirmation}
		{successTransferDate}
		on:dismissOutcome={dismissOutcome}
	/>
</AppShell>
