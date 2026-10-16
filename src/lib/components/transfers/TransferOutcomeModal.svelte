<script lang="ts">
	/**
	 * Transfer result modal: focus moves to the primary action, Tab is trapped inside,
	 * Escape dismisses, and focus returns to the control that opened the dialog.
	 */
	import { createEventDispatcher, tick } from 'svelte';
	import { getDomainsLookup } from '$lib/context/domains';
	import type { AccountSummary } from '$lib/types/northwind';
	import { accountTransferPickerLabel } from '$lib/utils/account';
	import { formatLongDate, formatTransferModalAmount } from '$lib/utils/format';
	import { handleFocusTrap } from '$lib/utils/focusTrap';
	import { findAccount } from '$lib/utils/transfer';
	import { messages } from '$lib/i18n';

	export let isOpen = false;
	export let variant: 'success' | 'error' = 'success';
	export let accounts: AccountSummary[] = [];
	export let errorMessage = '';

	export let amount: number | null = null;
	export let currency = 'USD';
	export let fromAccountId = '';
	export let toAccountId = '';
	export let confirmation = '';
	export let transferDateIso = '';

	const dispatch = createEventDispatcher<{ dismiss: void }>();

	let dialogElement: HTMLDivElement;
	let primaryActionElement: HTMLButtonElement;
	let previouslyFocused: HTMLElement | null = null;
	let isPreviouslyOpen = false;

	$: domains = getDomainsLookup();
	$: fromAccount = findAccount(accounts, fromAccountId);
	$: toAccount = findAccount(accounts, toAccountId);
	$: transferDateLabel = formatLongDate(transferDateIso) || formatLongDate(new Date().toISOString());

	$: if (isOpen && !isPreviouslyOpen) {
		isPreviouslyOpen = true;
		void openDialog();
	} else if (!isOpen && isPreviouslyOpen) {
		isPreviouslyOpen = false;
	}

	async function openDialog() {
		previouslyFocused =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		await tick();
		primaryActionElement?.focus();
	}

	function dismiss() {
		const restoreTarget = previouslyFocused;
		dispatch('dismiss');
		void tick().then(() => {
			if (restoreTarget?.isConnected) {
				restoreTarget.focus();
			}
		});
	}

	function onDialogKeydown(event: KeyboardEvent) {
		if (!isOpen || !dialogElement) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			dismiss();
			return;
		}

		handleFocusTrap(event, dialogElement);
	}
</script>

<svelte:window on:keydown={onDialogKeydown} />

{#if isOpen}
	<div class="overlay">
		<button
			type="button"
			class="backdrop"
			aria-label={messages.transfers.modal.dismissBackdrop}
			on:click={dismiss}
		></button>

		<div
			class="dialog"
			class:error={variant === 'error'}
			role="dialog"
			aria-modal="true"
			aria-labelledby="transfer-outcome-title"
			tabindex="-1"
			bind:this={dialogElement}
		>
			{#if variant === 'success'}
				<div class="success-layout">
					<header class="success-hero">
						<div class="icon success" aria-hidden="true">
							<span class="check">✓</span>
						</div>
						<div class="success-copy">
							<h2 id="transfer-outcome-title" class="heading">
								{messages.transfers.modal.successTitle}
							</h2>
							<p class="lead">{messages.transfers.modal.successLead}</p>
						</div>
					</header>

					<dl class="details">
						<div class="detail-row">
							<dt>{messages.transfers.modal.amount}</dt>
							<dd>
								{amount !== null
									? formatTransferModalAmount(amount, currency)
									: messages.common.emDash}
							</dd>
						</div>
						<div class="detail-row">
							<dt>{messages.transfers.modal.transferFrom}</dt>
							<dd>
								{fromAccount
									? accountTransferPickerLabel(fromAccount, domains)
									: messages.common.emDash}
							</dd>
						</div>
						<div class="detail-row">
							<dt>{messages.transfers.modal.transferTo}</dt>
							<dd>
								{toAccount
									? accountTransferPickerLabel(toAccount, domains)
									: messages.common.emDash}
							</dd>
						</div>
						<div class="detail-row">
							<dt>{messages.transfers.modal.transferDate}</dt>
							<dd>{transferDateLabel}</dd>
						</div>
						<div class="detail-row">
							<dt>{messages.transfers.modal.confirmation}</dt>
							<dd>{confirmation || messages.common.emDash}</dd>
						</div>
					</dl>

					<button type="button" class="action" bind:this={primaryActionElement} on:click={dismiss}>
						{messages.transfers.modal.done}
					</button>
				</div>
			{:else}
				<div class="error-layout">
					<header class="error-hero">
						<div class="icon error" aria-hidden="true">
							<svg class="error-x" width="10" height="10" viewBox="0 0 10 10" fill="none">
								<path
									d="M1 1L9 9M9 1L1 9"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								/>
							</svg>
						</div>
						<h2 id="transfer-outcome-title" class="heading">
							{messages.transfers.modal.failedTitle}
						</h2>
						<p class="error-lead" role="alert">
							{errorMessage || messages.transfers.modal.failedDefault}
						</p>
					</header>
					<button type="button" class="action" bind:this={primaryActionElement} on:click={dismiss}>
						{messages.transfers.modal.backToTransfers}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: var(--layer-5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--s-4);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		border: none;
		background: var(--c-backdrop-scrim);
		cursor: pointer;
	}

	.backdrop:focus-visible {
		outline: 2px solid var(--wl-primary, var(--c-blue));
		outline-offset: -4px;
	}

	.dialog {
		position: relative;
		box-sizing: border-box;
		width: min(100%, 358px);
		max-height: calc(100vh - var(--s-8));
		overflow-y: auto;
		padding: var(--s-6);
		background: var(--c-white);
		border: var(--border-size-thin) solid var(--c-gray);
		border-radius: var(--radius-xl);
		box-shadow: none;
	}

	.success-layout,
	.error-layout {
		display: flex;
		flex-direction: column;
		gap: var(--s-12);
		width: 100%;
		max-width: 310px;
		margin: 0 auto;
	}

	.success-hero,
	.error-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s-6);
		width: 100%;
		text-align: center;
	}

	.success-copy {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s-2);
		width: 100%;
	}

	.success-copy .heading,
	.success-copy .lead {
		width: 100%;
		max-width: 310px;
	}

	.error-hero .heading,
	.error-hero .error-lead {
		width: 100%;
		max-width: 310px;
	}

	.icon {
		flex-shrink: 0;
		border-radius: var(--radius-round);
		display: grid;
		place-items: center;
		line-height: 1;
	}

	.icon.success {
		width: 64px;
		height: 64px;
		background: var(--c-green-success);
		color: var(--c-white);
	}

	.check {
		font-size: 24px;
		font-weight: var(--fw-bold);
		line-height: 1;
	}

	.icon.error {
		width: 64px;
		height: 64px;
		background: var(--c-red-dark);
		color: var(--c-white);
	}

	.error-x {
		display: block;
	}

	.heading {
		font-size: var(--header-xs-fs);
		font-weight: var(--fw-medium);
		height: 29px;
		color: var(--c-black);
	}

	.lead {
		font-size: var(--text-xs-fs);
		font-weight: var(--fw-base);
		height: 17px;
		color: var(--c-black);
	}

	.error-lead {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-base);
		line-height: 22px;
		color: var(--c-black);
		text-align: center;
	}

	.details {
		width: 100%;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--s-4);
		min-height: 33px;
		padding: var(--s-2) 0;
		border-bottom: var(--border-size-thin) solid var(--c-gray);
		box-sizing: border-box;
	}

	dt {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-base);
		line-height: 1;
		color: var(--c-black);
		flex-shrink: 0;
	}

	dd {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-base);
		line-height: 1;
		color: var(--c-black);
		text-align: right;
		min-width: 0;
	}

	.action {
		box-sizing: border-box;
		width: 100%;
		height: 40px;
		padding: var(--s-3) var(--s-4);
		border: var(--border-size-thin) solid var(--c-gray);
		border-radius: var(--radius);
		background: var(--c-white);
		color: var(--c-black);
		font-size: var(--text-fs);
		font-weight: var(--fw-semi-bold);
		line-height: 1;
		cursor: pointer;
	}

	.action:hover {
		background: var(--c-gray-lighter);
	}

	.action:focus-visible {
		outline: 2px solid var(--wl-primary, var(--c-blue));
		outline-offset: 2px;
	}
</style>
