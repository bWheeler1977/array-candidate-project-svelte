<script lang="ts">
	import ContentPanel from '$lib/components/ui/ContentPanel.svelte';
	import { getDomainsLookup } from '$lib/context/domains';
	import type { AccountSummary } from '$lib/types/northwind';
	import { accountTransferTitle } from '$lib/utils/account';
	import { formatCurrency, formatTransferModalAmount } from '$lib/utils/format';
	import { findAccount, parseAmount } from '$lib/utils/transfer';
	import { msg, messages } from '$lib/i18n';

	export let fromAccountId = '';
	export let toAccountId = '';
	export let amount = '';
	export let accounts: AccountSummary[] = [];

	$: domains = getDomainsLookup();
	$: fromAccount = findAccount(accounts, fromAccountId);
	$: toAccount = findAccount(accounts, toAccountId);
	$: parsedAmount = parseAmount(amount);
	$: hasTransferAmount = parsedAmount !== null && parsedAmount > 0;

	$: fromProjected =
		fromAccount && hasTransferAmount && parsedAmount !== null
			? fromAccount.balance - parsedAmount
			: fromAccount?.balance;
	$: toProjected =
		toAccount && hasTransferAmount && parsedAmount !== null
			? toAccount.balance + parsedAmount
			: toAccount?.balance;

	$: balanceLabel = hasTransferAmount
		? messages.transfers.summary.balanceNew
		: messages.transfers.summary.balanceCurrent;

	$: summaryCurrency = fromAccount?.currency ?? toAccount?.currency ?? 'USD';
	$: formattedTransferAmount =
		hasTransferAmount && parsedAmount !== null
			? formatTransferModalAmount(parsedAmount, summaryCurrency)
			: '';
</script>

<ContentPanel
	title={messages.transfers.summary.title}
	subtitle={messages.transfers.summary.subtitle}
	headingId="transfer-summary-heading"
	variant="muted"
>
	<div class="columns" aria-live="polite">
		<div class="column">
			<p class="column-heading">
				{#if formattedTransferAmount}
					<span class="heading-amount">{formattedTransferAmount}</span>
				{/if}
				<span class="heading-side">{messages.transfers.summary.from}</span>
			</p>
			{#if fromAccount}
				<span class="account-name">{accountTransferTitle(fromAccount, domains)}</span>
				{#if fromProjected !== undefined}
					<span class="balance-line">
						{msg(messages.transfers.summary.balanceLine, {
							label: balanceLabel,
							balance: formatCurrency(fromProjected, fromAccount.currency)
						})}
					</span>
				{/if}
			{:else}
				<span class="dash">{messages.transfers.summary.emptyPlaceholder}</span>
			{/if}
		</div>

		<div class="column">
			<p class="column-heading">
				{#if formattedTransferAmount}
					<span class="heading-amount">{formattedTransferAmount}</span>
				{/if}
				<span class="heading-side">{messages.transfers.summary.to}</span>
			</p>
			{#if toAccount}
				<span class="account-name">{accountTransferTitle(toAccount, domains)}</span>
				{#if toProjected !== undefined}
					<span class="balance-line">
						{msg(messages.transfers.summary.balanceLine, {
							label: balanceLabel,
							balance: formatCurrency(toProjected, toAccount.currency)
						})}
					</span>
				{/if}
			{:else}
				<span class="dash">{messages.transfers.summary.emptyPlaceholder}</span>
			{/if}
		</div>
	</div>
</ContentPanel>

<style>
	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--s-6);
		align-items: start;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
		min-width: 0;
	}

	.column-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--s-1);
		min-height: 18px;
	}

	.heading-amount {
		font-family: var(--number-font);
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-base);
		color: var(--wl-text-muted, var(--text-fg-ci));
		line-height: 18px;
	}

	.heading-side {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-base);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
		line-height: 18px;
	}

	.account-name {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-base);
		color: var(--wl-text, var(--text-fg-ci));
		line-height: 17px;
	}

	.balance-line {
		font-size: var(--text-sm-fs);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
		line-height: 17px;
	}

	.dash {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-medium);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
		line-height: 1.2;
	}
</style>
