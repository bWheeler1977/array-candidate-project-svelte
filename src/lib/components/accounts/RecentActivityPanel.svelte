<script lang="ts">
	import ActivityRow from '$lib/components/shared/ActivityRow.svelte';
	import ActivityList from '$lib/components/ui/ActivityList.svelte';
	import ContentPanel from '$lib/components/ui/ContentPanel.svelte';
	import { getDomainsLookup } from '$lib/context/domains';
	import { transferEndpointHints } from '$lib/stores/transferHints';
	import type { AccountSummary, TransferSummary } from '$lib/types/northwind';
	import { accountProductName } from '$lib/utils/account';
	import { buildRecentActivityFeed } from '$lib/utils/recentActivityFeed';
	import { prepareTransfersForDisplay } from '$lib/utils/transferEndpointHints';
	import { msg, messages } from '$lib/i18n';

	export let transfers: TransferSummary[] = [];
	export let accounts: AccountSummary[] = [];
	export let activeUser = '';
	export let filterAccountId: string | null = null;
	/** When true, activity body scrolls inside a height-capped column (desktop Accounts layout). */
	export let isScrollBody = false;

	$: domains = getDomainsLookup();
	$: displayTransfers = prepareTransfersForDisplay(transfers, accounts, $transferEndpointHints);
	$: items = buildRecentActivityFeed(activeUser, accounts, displayTransfers, domains, 8, filterAccountId);
	$: filteredAccount = filterAccountId
		? accounts.find((account) => account.account_id === filterAccountId)
		: undefined;
	$: subtitle = filteredAccount
		? msg(messages.activity.subtitleForAccount, {
				accountName: accountProductName(filteredAccount, domains)
			})
		: messages.activity.subtitleAll;
</script>

<ContentPanel
	title={messages.activity.title}
	{subtitle}
	headingId="recent-activity-heading"
	variant="muted"
	{isScrollBody}
>
	<ActivityList
		variant="plain"
		isEmpty={items.length === 0}
		emptyMessage={messages.activity.empty}
		isCenterEmpty={false}
	>
		{#each items as item (item.id)}
			<ActivityRow
				title={item.title}
				activityNote={item.meta}
				amountLabel={item.amountLabel}
				isNegative={item.isNegative}
				iconKind={item.iconKind}
				isDivided={false}
			/>
		{/each}
	</ActivityList>
</ContentPanel>
