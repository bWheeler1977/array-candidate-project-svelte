<script lang="ts">
	import ActivityRow from '$lib/components/shared/ActivityRow.svelte';
	import ActivityList from '$lib/components/ui/ActivityList.svelte';
	import ContentPanel from '$lib/components/ui/ContentPanel.svelte';
	import { getDomainsLookup } from '$lib/context/domains';
	import { transferEndpointHints } from '$lib/stores/transferHints';
	import type { AccountSummary, TransferSummary } from '$lib/types/northwind';
	import {
		transferActivityAmount,
		transferAmountLabel,
		transferListTitle,
		transferRecentListMeta
	} from '$lib/utils/transferDisplay';
	import { prepareTransfersForDisplay } from '$lib/utils/transferEndpointHints';
	import { messages } from '$lib/i18n';

	export let transfers: TransferSummary[] = [];
	export let accounts: AccountSummary[] = [];

	$: domains = getDomainsLookup();
	$: displayTransfers = prepareTransfersForDisplay(transfers, accounts, $transferEndpointHints);
	$: items = displayTransfers.slice(0, 6);
</script>

<ContentPanel
	title={messages.transfers.recent.title}
	subtitle={messages.transfers.recent.subtitle}
	headingId="recent-transfers-heading"
	variant="muted"
>
	<ActivityList
		variant="plain"
		isEmpty={items.length === 0}
		emptyMessage={messages.transfers.recent.empty}
	>
		{#each items as transfer (transfer.transfer_id)}
			<ActivityRow
				title={transferListTitle(transfer, accounts, domains)}
				activityNote={transferRecentListMeta(transfer, accounts, domains)}
				amountLabel={transferAmountLabel(transfer)}
				isNegative={transferActivityAmount(transfer) < 0}
				iconKind="bank"
				isDivided={false}
			/>
		{/each}
	</ActivityList>
</ContentPanel>
