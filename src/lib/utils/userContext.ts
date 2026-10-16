/**
 * Helpers for the multi-holder sandbox: cookie name, holder list, filtering accounts and
 * transfers to the active user. Holder names must match API `account_holder_name` exactly
 * (after trim) for mocks and scoping to stay aligned.
 */
import type { AccountSummary, TransferSummary } from '$lib/types/northwind';

export const ACTIVE_USER_COOKIE = 'northwind_active_user';

export function normalizeHolderName(name: string): string {
	return name.trim();
}

/** Distinct account holders, sorted for stable UI. */
export function listAccountHolders(accounts: AccountSummary[]): string[] {
	const seen = new Set<string>();
	for (const account of accounts) {
		const name = normalizeHolderName(account.account_holder_name);
		if (name) seen.add(name);
	}
	return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function resolveActiveUser(candidates: string[], cookieValue: string | undefined): string {
	const trimmed = cookieValue?.trim();
	if (trimmed && candidates.includes(trimmed)) {
		return trimmed;
	}
	return candidates[0] ?? '';
}

export function accountsForUser(
	allAccounts: AccountSummary[],
	activeUser: string
): AccountSummary[] {
	const user = normalizeHolderName(activeUser);
	if (!user) return [];
	return allAccounts.filter(
		(account) => normalizeHolderName(account.account_holder_name) === user
	);
}

export function accountNumbersForUser(accounts: AccountSummary[]): Set<string> {
	return new Set(accounts.map((a) => a.account_number));
}

/** Internal transfers where both sides belong to the active user's accounts. */
export function filterTransfersForUser(
	transfers: TransferSummary[],
	userAccounts: AccountSummary[]
): TransferSummary[] {
	if (userAccounts.length === 0) return [];

	const numbers = accountNumbersForUser(userAccounts);
	const holder = normalizeHolderName(userAccounts[0]?.account_holder_name ?? '');

	return transfers.filter((transfer) => {
		const src = transfer.source_account?.account_number;
		const dest = transfer.destination_account?.account_number;

		if (src && dest) {
			return numbers.has(src) && numbers.has(dest);
		}

		const srcHolder = normalizeHolderName(transfer.source_account?.account_holder_name ?? '');
		const destHolder = normalizeHolderName(transfer.destination_account?.account_holder_name ?? '');
		if (srcHolder && destHolder) {
			return srcHolder === holder && destHolder === holder;
		}

		if (src && numbers.has(src)) return dest ? numbers.has(dest) : true;
		if (dest && numbers.has(dest)) return src ? numbers.has(src) : true;

		return false;
	});
}

export function accountBelongsToUser(account: AccountSummary, activeUser: string): boolean {
	return (
		normalizeHolderName(account.account_holder_name).toLowerCase() ===
		normalizeHolderName(activeUser).toLowerCase()
	);
}
