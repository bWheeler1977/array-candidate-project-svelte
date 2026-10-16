<script lang="ts">
	import { getDomainsLookup } from '$lib/context/domains';
	import type { AccountSummary } from '$lib/types/northwind';
	import {
		accountProductName,
		accountStatusLabel,
		accountTypeBadge,
		balanceTone,
		isAccountActive
	} from '$lib/utils/account';
	import { formatCurrency, maskAccountNumber } from '$lib/utils/format';
	import { msg, messages } from '$lib/i18n';

	export let account: AccountSummary;
	export let isSelected = false;
	export let onSelect: () => void = () => {};

	$: domains = getDomainsLookup();
	$: active = isAccountActive(account);
	$: tone = balanceTone(account.balance, account.account_type);
	$: statusLabel = accountStatusLabel(account, domains);
	$: statusDescription = domains.accountStatusDescription(account.account_status);
	$: typeDescription = domains.accountTypeDescription(account.account_type);
	$: productName = accountProductName(account, domains);
	$: filterLabel = isSelected
		? msg(messages.accounts.filterSelected, { productName })
		: msg(messages.accounts.filterPrompt, { productName });
</script>

<li>
	<button
		type="button"
		class="account-card"
		class:inactive={!active}
		class:selected={isSelected}
		aria-pressed={isSelected}
		aria-label={filterLabel}
		on:click={onSelect}
	>
		<div class="info">
			<p class="name" aria-hidden="true">{productName}</p>
			<p class="sub">
				<span class="mask">{maskAccountNumber(account.account_number)}</span>
				<span class="type-badge" title={typeDescription}>{accountTypeBadge(account, domains)}</span>
				{#if !active}
					<span class="status-badge" title={statusDescription}>{statusLabel}</span>
				{/if}
			</p>
		</div>
		<div class="balance">
			<p class:negative={tone === 'negative'} class="amount">
				{formatCurrency(account.balance, account.currency)}
			</p>
			<p class="caption">{messages.common.available}</p>
		</div>
	</button>
</li>

<style>
	.account-card {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--s-4);
		width: 100%;
		padding: var(--s-4);
		background: var(--c-white);
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray));
		border-radius: var(--radius-lg);
		box-shadow: none;
		outline: none;
		text-align: left;
		font: inherit;
		/* Prevent inherited body line-height from adding flex line strut height */
		line-height: 1;
		color: inherit;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.account-card:hover {
		border-color: var(--wl-border-strong, var(--c-gray));
	}

	.account-card:focus-visible {
		outline: 2px solid var(--wl-focus, var(--c-blue));
		outline-offset: 2px;
	}

	.account-card.selected {
		border-color: var(--wl-primary, var(--c-blue));
		box-shadow: 0 0 0 1px var(--wl-primary, var(--c-blue));
	}

	.account-card.inactive {
		background: var(--wl-inactive-surface, var(--c-gray-lighter));
		opacity: 0.96;
	}

	.account-card.inactive .name,
	.account-card.inactive .amount {
		color: var(--wl-inactive-text, var(--c-gray-dark));
	}

	.info {
		min-width: 0;
	}

	.name {
		font-size: var(--text-fs);
		font-weight: var(--fw-base);
		color: var(--wl-text, var(--text-fg-ci));
		line-height: 19px;
	}

	.sub {
		margin: var(--s-2) 0 0;
		font-size: var(--text-sm-fs);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s-2);
	}

	.type-badge {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-medium);
		line-height: 10px;
		letter-spacing: -0.2px;
		color: var(--c-ink);
		background: var(--c-badge-surface);
		border: none;
		border-radius: var(--radius-md);
		padding: var(--s-2);
	}

	.status-badge {
		font-size: var(--text-xs-fs);
		font-weight: var(--fw-medium);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--wl-text-muted, var(--text-light-fg-ci));
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray));
		border-radius: var(--wl-radius-pill, var(--radius-round));
		padding: var(--s-025) var(--s-2);
	}

	.balance {
		text-align: right;
		flex-shrink: 0;
	}

	.amount {
		font-family: var(--number-font);
		font-size: var(--text-fs);
		font-weight: var(--fw-base);
		color: var(--wl-text, var(--text-fg-ci));
	}

	.amount.negative {
		color: var(--wl-negative, var(--c-red));
	}

	.caption {
		margin: var(--s-1) 0 0;
		font-size: var(--text-sm-fs);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
	}
</style>
