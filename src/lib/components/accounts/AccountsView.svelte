<script lang="ts">
	/**
	 * Accounts page layout. On desktop, Recent Activity is height-matched to the left column:
	 * when the feed is taller than “Your accounts”, we cap the aside and enable internal scroll
	 * (`scrollBody` on RecentActivityPanel). Shorter feeds (e.g. per-account filter) stay natural
	 * height with no scrollbar. See `measureActivityNaturalHeight` / `syncActivityColumnLayout`.
	 */
	import { onMount, tick } from 'svelte';
	import AccountListSection from './AccountListSection.svelte';
	import RecentActivityPanel from './RecentActivityPanel.svelte';
	import TotalBalanceCard from './TotalBalanceCard.svelte';
	import { browser } from '$app/environment';
	import AccountsPageSkeleton from '$lib/components/ui/AccountsPageSkeleton.svelte';
	import {
		applyPendingBalanceAdjustments,
		hasPendingBalanceAdjustments,
		pendingBalanceState
	} from '$lib/stores/pendingBalances';
	import { isSessionRefreshing } from '$lib/stores/sessionUi';
	import type { AccountSummary, TransferSummary } from '$lib/types/northwind';
	import { sumAccountBalances } from '$lib/utils/account';
	import { messages } from '$lib/i18n';

	const DESKTOP_LAYOUT = '(min-width: 900px)';
	/** Avoid lock/unlock thrash when heights are within a few pixels. */
	const SCROLL_LOCK_BUFFER_PX = 8;

	let primaryElement: HTMLDivElement | undefined;
	let activitySlotElement: HTMLDivElement | undefined;
	let isActivityScrollLocked = false;
	let asideHeightStyle = '';
	let layoutObserver: ResizeObserver | undefined;
	let layoutSyncFrame = 0;

	export let accounts: AccountSummary[] = [];
	export let transfers: TransferSummary[] = [];
	export let activeUser = '';
	export let isLoading = false;
	export let error: string | null = null;

	// Display balances: API + in-tab pending transfers (see pendingBalances.ts).
	$: displayAccounts = applyPendingBalanceAdjustments(accounts, activeUser, $pendingBalanceState);
	$: isPendingBalancesNoteVisible =
		$pendingBalanceState.activeUser === activeUser &&
		hasPendingBalanceAdjustments($pendingBalanceState);
	$: totalBalance = sumAccountBalances(displayAccounts);
	$: accountCount = displayAccounts.length;
	$: currency = displayAccounts[0]?.currency ?? 'USD';

	// Client-only filter: click account card to scope Recent Activity; clear when switching holder.
	let selectedAccountId: string | null = null;
	let lastActiveUser = activeUser;
	$: if (activeUser !== lastActiveUser) {
		lastActiveUser = activeUser;
		selectedAccountId = null;
	}

	function toggleAccountFilter(accountId: string) {
		selectedAccountId = selectedAccountId === accountId ? null : accountId;
		isActivityScrollLocked = false;
		asideHeightStyle = '';
		void tick().then(scheduleLayoutSync);
	}

	function measureActivityNaturalHeight(): number {
		const panel = activitySlotElement?.querySelector('section.panel.muted') as HTMLElement | null;
		if (!panel) return 0;

		const header = panel.querySelector('header');
		const body = panel.querySelector('.body') as HTMLElement | null;
		const list = body?.querySelector('ul.list') as HTMLElement | null;
		const empty = body?.querySelector('.empty') as HTMLElement | null;
		const panelStyles = getComputedStyle(panel);
		const paddingY =
			parseFloat(panelStyles.paddingTop) + parseFloat(panelStyles.paddingBottom);
		const headerHeight = header?.offsetHeight ?? 0;
		const headerGap = header ? parseFloat(getComputedStyle(header).marginBottom) : 0;
		const bodyHeight = list?.scrollHeight ?? empty?.scrollHeight ?? body?.scrollHeight ?? 0;

		return paddingY + headerHeight + headerGap + bodyHeight;
	}

	function syncActivityColumnLayout() {
		if (!browser || !primaryElement) {
			if (isActivityScrollLocked || asideHeightStyle) {
				isActivityScrollLocked = false;
				asideHeightStyle = '';
			}
			return;
		}
		if (!window.matchMedia(DESKTOP_LAYOUT).matches) {
			if (isActivityScrollLocked || asideHeightStyle) {
				isActivityScrollLocked = false;
				asideHeightStyle = '';
			}
			return;
		}

		const cap = primaryElement.offsetHeight;
		const naturalHeight = measureActivityNaturalHeight();
		const nextLocked = naturalHeight > cap + SCROLL_LOCK_BUFFER_PX;
		const nextStyle = nextLocked ? `height: ${cap}px; max-height: ${cap}px` : '';

		if (nextLocked !== isActivityScrollLocked || nextStyle !== asideHeightStyle) {
			isActivityScrollLocked = nextLocked;
			asideHeightStyle = nextStyle;
		}
	}

	function scheduleLayoutSync() {
		if (!browser) return;
		cancelAnimationFrame(layoutSyncFrame);
		layoutSyncFrame = requestAnimationFrame(() => {
			layoutSyncFrame = 0;
			syncActivityColumnLayout();
		});
	}

	function trackPrimaryColumn(node: HTMLDivElement) {
		primaryElement = node;
		layoutObserver?.observe(node);
		scheduleLayoutSync();
		return {
			destroy() {
				layoutObserver?.unobserve(node);
				if (primaryElement === node) primaryElement = undefined;
			}
		};
	}

	$: layoutFeedKey = `${activeUser}|${accounts.length}|${transfers.length}|${selectedAccountId ?? ''}`;
	$: layoutFeedKey, void tick().then(async () => {
		isActivityScrollLocked = false;
		asideHeightStyle = '';
		await tick();
		scheduleLayoutSync();
	});

	onMount(() => {
		layoutObserver = new ResizeObserver(scheduleLayoutSync);
		const media = window.matchMedia(DESKTOP_LAYOUT);
		media.addEventListener('change', scheduleLayoutSync);
		if (primaryElement) layoutObserver.observe(primaryElement);
		scheduleLayoutSync();
		return () => {
			cancelAnimationFrame(layoutSyncFrame);
			layoutObserver?.disconnect();
			layoutObserver = undefined;
			media.removeEventListener('change', scheduleLayoutSync);
		};
	});
</script>

<div class="accounts">
	{#if $isSessionRefreshing}
		<AccountsPageSkeleton />
	{:else if isLoading}
		<p class="state" role="status" aria-live="polite">{messages.accounts.loading}</p>
	{:else if error}
		<div class="state error" role="alert">
			<p class="state-title">{messages.accounts.loadErrorTitle}</p>
			<p class="state-body">{error}</p>
		</div>
	{:else if accounts.length === 0}
		<p class="state" role="status">{messages.accounts.empty}</p>
	{:else}
		<div class="layout">
			<div class="primary" use:trackPrimaryColumn>
				<TotalBalanceCard
					totalBalance={totalBalance}
					activeAccountCount={accountCount}
					{currency}
					isPendingNoteVisible={isPendingBalancesNoteVisible}
				/>
				<AccountListSection
					accounts={displayAccounts}
					{selectedAccountId}
					onAccountSelect={toggleAccountFilter}
				/>
			</div>

			<div
				class="aside"
				class:scroll-locked={isActivityScrollLocked}
				style={asideHeightStyle || undefined}
			>
				<div class="activity-slot" bind:this={activitySlotElement}>
					<RecentActivityPanel
						{transfers}
						{accounts}
						{activeUser}
						filterAccountId={selectedAccountId}
						isScrollBody={isActivityScrollLocked}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.accounts {
		width: 100%;
	}

	.layout {
		display: grid;
		gap: var(--s-12);
	}

	.primary {
		display: grid;
		gap: var(--s-12);
		min-width: 0;
	}

	.aside {
		min-width: 0;
	}

	@media (min-width: 900px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			align-items: start;
			gap: var(--s-12);
		}

		.aside {
			align-self: start;
		}

		.aside.scroll-locked {
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.aside.scroll-locked :global(.panel.muted.scroll-host) {
			flex: 1 1 auto;
			min-height: 0;
			max-height: 100%;
		}

		.activity-slot {
			min-height: 0;
		}
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
		color: var(--wl-text-muted, var(--text-light-fg-ci));
	}
</style>
