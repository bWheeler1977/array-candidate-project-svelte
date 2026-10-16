<script lang="ts">
	import { formatCurrency } from '$lib/utils/format';
	import { msg, messages } from '$lib/i18n';

	export let totalBalance: number;
	export let activeAccountCount: number;
	export let currency = 'USD';
	export let isPendingNoteVisible = false;
</script>

<section class="balance-card" aria-labelledby="total-balance-heading">
	<p id="total-balance-heading" class="label">{messages.accounts.totalBalance}</p>
	<p class="amount" aria-live="polite">{formatCurrency(totalBalance, currency)}</p>
	<p class="amount-note">
		{activeAccountCount === 1
			? msg(messages.accounts.acrossOneAccount, { count: activeAccountCount })
			: msg(messages.accounts.acrossManyAccounts, { count: activeAccountCount })}
	</p>
	{#if isPendingNoteVisible}
		<p class="pending-note">{messages.accounts.pendingTransfersNote}</p>
	{/if}
</section>

<style>
	.balance-card {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
		background: linear-gradient(135deg, var(--c-blue) 0%, var(--c-blue-dark) 100%);
		color: var(--wl-primary-fg, var(--c-white));
		border-radius: var(--wl-radius-card, var(--radius-xl));
		padding: var(--s-4);
		box-shadow: var(--shadow-md);
		border: var(--border-size-thin) solid var(--c-on-primary-border);
	}

	.label {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-base);
		opacity: 0.95;
	}

	.amount {
		font-family: var(--number-font);
		font-size: var(--number-fs);
		font-weight: var(--fw-bold);
		line-height: 1;
		letter-spacing: 4%;
	}

	.amount-note {
		font-size: var(--text-xs-fs);
		opacity: 0.9;
	}

	.pending-note {
		margin: var(--s-1) 0 0;
		font-size: var(--text-xs-fs);
		line-height: 1.35;
		opacity: 0.92;
	}
</style>
