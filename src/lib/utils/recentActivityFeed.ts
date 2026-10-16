/**
 * Builds the Accounts “Recent Activity” list by merging:
 * - mock rows (no transactions API—see mockRecentActivity.ts), and
 * - real transfers for the active user.
 *
 * Optional account filter: rows carry relatedAccountIds from matched account numbers
 * (and inferred counterpart when the API omits one side—see transferLinkedAccountIds).
 * When filtered, amounts are signed from that account’s perspective (see applyAccountFilterPerspective).
 */
import { accountProductName } from './account';
import { resolveActivityIconKind, type ActivityIconKind } from './activityIcon';
import type { DomainsLookup } from './domainsLookup';
import { formatShortDate, formatSignedCurrency } from './format';
import {
	transferActivityAmount,
	transferActivityMeta,
	transferActivityTitle,
	transferAmountLabel,
	transferLinkedAccountIds,
	transferSignedAmountForAccount,
	transferToAccountTitle
} from './transferDisplay';
import {
	MOCK_RECENT_ACTIVITY_BY_USER,
	mockActivityDateIso,
	type MockRecentActivityItem
} from '$lib/data/mockRecentActivity';
import type { AccountSummary, TransferSummary } from '$lib/types/northwind';
import { msg, messages } from '$lib/i18n';

export interface RecentActivityFeedItem {
	id: string;
	source: 'mock' | 'transfer';
	sortDate: string;
	title: string;
	meta: string;
	amountLabel: string;
	isNegative: boolean;
	iconKind: ActivityIconKind;
	/** Accounts this row is associated with (for per-account filtering). */
	relatedAccountIds: string[];
}

function findAccountForMock(
	accounts: AccountSummary[],
	accountTypeMatch: string
): AccountSummary | undefined {
	const needle = accountTypeMatch.trim().toLowerCase();
	return accounts.find((account) => account.account_type.toLowerCase().includes(needle));
}

function mockActivityTitle(
	item: {
		title: string;
		isInternalTransfer?: boolean;
		transferToAccountTypeMatch?: string;
	},
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	if (item.isInternalTransfer && item.transferToAccountTypeMatch) {
		const destination = findAccountForMock(accounts, item.transferToAccountTypeMatch);
		if (destination) return transferToAccountTitle(destination, domains);
	}
	return item.title;
}

function mockRelatedAccountIds(
	item: Pick<MockRecentActivityItem, 'accountTypeMatch' | 'isInternalTransfer' | 'transferToAccountTypeMatch'>,
	accounts: AccountSummary[]
): string[] {
	const ids: string[] = [];
	const primary = findAccountForMock(accounts, item.accountTypeMatch);
	if (primary) ids.push(primary.account_id);

	if (item.isInternalTransfer && item.transferToAccountTypeMatch) {
		const destination = findAccountForMock(accounts, item.transferToAccountTypeMatch);
		if (destination && !ids.includes(destination.account_id)) {
			ids.push(destination.account_id);
		}
	}

	return ids;
}


export function activityItemMatchesAccount(
	item: RecentActivityFeedItem,
	accountId: string
): boolean {
	return item.relatedAccountIds.includes(accountId);
}

function mockActivityMeta(
	item: { dateIso: string; accountTypeMatch: string; isInternalTransfer?: boolean },
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	const date = formatShortDate(item.dateIso);
	if (item.isInternalTransfer) {
		const sourceAccount = findAccountForMock(accounts, item.accountTypeMatch);
		if (sourceAccount) {
			return msg(messages.activity.metaFromAccount, {
				date,
				source: accountProductName(sourceAccount, domains)
			});
		}
		return msg(messages.activity.metaWithDetail, {
			date,
			detail: messages.activity.internalTransfer
		});
	}
	const account = findAccountForMock(accounts, item.accountTypeMatch);
	const accountLabel = account
		? accountProductName(account, domains)
		: messages.common.accountLabel;
	return msg(messages.activity.metaDateAccount, { date, accountLabel });
}

function findMockItem(activeUser: string, id: string): MockRecentActivityItem | undefined {
	return (MOCK_RECENT_ACTIVITY_BY_USER[activeUser] ?? []).find((item) => item.id === id);
}

function mockSignedAmountForAccount(
	item: MockRecentActivityItem,
	accounts: AccountSummary[],
	accountId: string
): number {
	if (item.isInternalTransfer && item.transferToAccountTypeMatch) {
		const source = findAccountForMock(accounts, item.accountTypeMatch);
		const destination = findAccountForMock(accounts, item.transferToAccountTypeMatch);
		const amount = Math.abs(item.amount);
		if (destination?.account_id === accountId) return amount;
		if (source?.account_id === accountId) return -amount;
	}
	return item.amount;
}

function applyAccountFilterPerspective(
	item: RecentActivityFeedItem,
	filterAccountId: string,
	activeUser: string,
	accounts: AccountSummary[],
	transfers: TransferSummary[]
): RecentActivityFeedItem {
	let amount: number;
	let currency = accounts.find((account) => account.account_id === filterAccountId)?.currency ?? 'USD';

	if (item.source === 'transfer') {
		const transfer = transfers.find((entry) => entry.transfer_id === item.id);
		if (!transfer) return item;
		amount = transferSignedAmountForAccount(transfer, accounts, filterAccountId);
		currency = transfer.currency ?? currency;
	} else {
		const mock = findMockItem(activeUser, item.id);
		if (!mock) return item;
		amount = mockSignedAmountForAccount(mock, accounts, filterAccountId);
		const matched = findAccountForMock(accounts, mock.accountTypeMatch);
		currency = matched?.currency ?? mock.currency ?? currency;
	}

	return {
		...item,
		amountLabel: formatSignedCurrency(amount, currency),
		isNegative: amount < 0
	};
}

function mockItemsForUser(
	activeUser: string,
	accounts: AccountSummary[],
	domains: DomainsLookup
): RecentActivityFeedItem[] {
	const mocks = MOCK_RECENT_ACTIVITY_BY_USER[activeUser] ?? [];
	return mocks.map((item) => {
		const dateIso = mockActivityDateIso(item.daysAgo);
		const currency =
			findAccountForMock(accounts, item.accountTypeMatch)?.currency ?? item.currency ?? 'USD';
		const isNegative = item.amount < 0;
		const title = mockActivityTitle(item, accounts, domains);
		return {
			id: item.id,
			source: 'mock' as const,
			sortDate: dateIso,
			title,
			meta: mockActivityMeta({ ...item, dateIso }, accounts, domains),
			amountLabel: formatSignedCurrency(item.amount, currency),
			isNegative,
			iconKind: resolveActivityIconKind({
				title,
				source: 'mock',
				isInternalTransfer: item.isInternalTransfer
			}),
			relatedAccountIds: mockRelatedAccountIds(item, accounts)
		};
	});
}

function transferItems(
	transfers: TransferSummary[],
	accounts: AccountSummary[],
	domains: DomainsLookup
): RecentActivityFeedItem[] {
	return transfers.map((transfer) => {
		const title = transferActivityTitle(transfer, accounts, domains);
		return {
			id: transfer.transfer_id,
			source: 'transfer' as const,
			sortDate: transfer.completed_date ?? transfer.initiated_date ?? '',
			title,
			meta: transferActivityMeta(transfer, accounts, domains),
			amountLabel: transferAmountLabel(transfer),
			isNegative: transferActivityAmount(transfer) < 0,
			iconKind: resolveActivityIconKind({ title, source: 'transfer' }),
			relatedAccountIds: transferLinkedAccountIds(transfer, accounts)
		};
	});
}

export function buildRecentActivityFeed(
	activeUser: string,
	accounts: AccountSummary[],
	transfers: TransferSummary[],
	domains: DomainsLookup,
	limit = 8,
	filterAccountId?: string | null
): RecentActivityFeedItem[] {
	const combined = [
		...mockItemsForUser(activeUser, accounts, domains),
		...transferItems(transfers, accounts, domains)
	];

	const cutoff = new Date();
	cutoff.setHours(0, 0, 0, 0);
	cutoff.setDate(cutoff.getDate() - 30);

	return combined
		.filter((item) => {
			if (!item.sortDate) return false;
			return new Date(item.sortDate).getTime() >= cutoff.getTime();
		})
		.filter((item) => {
			if (!filterAccountId) return true;
			return activityItemMatchesAccount(item, filterAccountId);
		})
		.map((item) =>
			filterAccountId
				? applyAccountFilterPerspective(item, filterAccountId, activeUser, accounts, transfers)
				: item
		)
		.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
		.slice(0, limit);
}
