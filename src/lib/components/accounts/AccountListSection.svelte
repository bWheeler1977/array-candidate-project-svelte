<script lang="ts">
	import AccountCard from './AccountCard.svelte';
	import type { AccountSummary } from '$lib/types/northwind';
	import { messages } from '$lib/i18n';

	export let accounts: AccountSummary[] = [];
	export let selectedAccountId: string | null = null;
	export let onAccountSelect: (accountId: string) => void = () => {};
</script>

<section class="accounts-section" aria-labelledby="your-accounts-heading">
	<h2 id="your-accounts-heading" class="section-title">{messages.accounts.yourAccounts}</h2>
	<ul class="account-list">
		{#each accounts as account (account.account_id)}
			<AccountCard
				{account}
				isSelected={selectedAccountId === account.account_id}
				onSelect={() => onAccountSelect(account.account_id)}
			/>
		{/each}
	</ul>
</section>

<style>
	.accounts-section {
		min-width: 0;
	}

	.section-title {
		margin: 0 0 var(--s-4);
		font-size: var(--title-fs);
		font-weight: var(--fw-medium);
		color: var(--wl-text, var(--text-fg-ci));
		height: 19px;
	}

	.account-list {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
	}
</style>
