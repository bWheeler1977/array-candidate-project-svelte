<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import RecentTransfersPanel from './RecentTransfersPanel.svelte';
	import TransferForm from './TransferForm.svelte';
	import TransferOutcomeModal from './TransferOutcomeModal.svelte';
	import TransferSummaryPanel from './TransferSummaryPanel.svelte';
	import TransfersPageSkeleton from '$lib/components/ui/TransfersPageSkeleton.svelte';
	import { isSessionRefreshing } from '$lib/stores/sessionUi';
	import type { AccountSummary, TransferSummary } from '$lib/types/northwind';
	import type { TransferFormErrors } from '$lib/utils/transfer';
	import { messages } from '$lib/i18n';

	export let accounts: AccountSummary[] = [];
	export let transfers: TransferSummary[] = [];
	export let loadError: string | null = null;
	export let activeUser = '';

	export let fromAccountId = '';
	export let toAccountId = '';
	export let amount = '';
	export let reference = '';

	export let fieldErrors: TransferFormErrors = {};
	export let isSubmitting = false;
	export let bankName = messages.brand.bankLegalName;

	export let outcome: 'idle' | 'success' | 'error' = 'idle';
	export let outcomeMessage = '';
	export let successAmount: number | null = null;
	export let successCurrency = 'USD';
	export let successFromAccountId = '';
	export let successToAccountId = '';
	export let successConfirmation = '';
	export let successTransferDate = '';

	const dispatch = createEventDispatcher<{ dismissOutcome: void }>();

	$: isModalOpen =
		!$isSessionRefreshing && (outcome === 'success' || outcome === 'error');

	function handleDismiss() {
		dispatch('dismissOutcome');
	}
</script>

<div class="transfers">
	{#if loadError}
		<div class="state error" role="alert">
			<p class="state-title">{messages.transfers.page.loadErrorTitle}</p>
			<p class="state-body">{loadError}</p>
		</div>
	{:else if $isSessionRefreshing}
		<TransfersPageSkeleton />
	{:else if accounts.length === 0}
		<p class="state" role="status">{messages.transfers.page.empty}</p>
	{:else}
		<div class="layout">
			<section class="selection-column" aria-label={messages.transfers.selection.ariaLabel}>
				<TransferForm
					isEmbedded
					{accounts}
					{activeUser}
					{bankName}
					bind:fromAccountId
					bind:toAccountId
					bind:amount
					bind:reference
					bind:isSubmitting
					errors={fieldErrors}
				/>
			</section>

			<aside class="context-column" aria-label={messages.transfers.summary.ariaLabel}>
				<TransferSummaryPanel
					{accounts}
					{fromAccountId}
					{toAccountId}
					{amount}
				/>
				<RecentTransfersPanel {transfers} {accounts} />
			</aside>
		</div>
	{/if}
</div>

<TransferOutcomeModal
	isOpen={isModalOpen}
	variant={outcome === 'success' ? 'success' : 'error'}
	{accounts}
	errorMessage={outcomeMessage}
	amount={successAmount}
	currency={successCurrency}
	fromAccountId={successFromAccountId}
	toAccountId={successToAccountId}
	confirmation={successConfirmation}
	transferDateIso={successTransferDate}
	on:dismiss={handleDismiss}
/>

<style>
	.transfers {
		width: 100%;
	}

	.layout {
		display: grid;
		gap: var(--s-5);
		align-items: start;
	}

	@media (min-width: 900px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: var(--s-12);
		}
	}

	.selection-column,
	.context-column {
		min-width: 0;
	}

	.context-column {
		display: flex;
		flex-direction: column;
		gap: var(--s-6);
	}

	.state {
		margin: var(--s-10) auto;
		max-width: 28rem;
		text-align: center;
		font-size: var(--text-md-fs);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
	}

	.state.error {
		color: var(--wl-negative, var(--c-red));
	}

	.state-title {
		margin-bottom: var(--s-2);
		font-weight: var(--fw-semi-bold);
		color: var(--wl-text, var(--text-fg-ci));
	}

	.state-body {
		font-size: var(--text-sm-fs);
	}
</style>
