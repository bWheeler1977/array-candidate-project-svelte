/**
 * In-memory optimistic balance adjustments after successful transfers in this tab.
 *
 * The sandbox API often does not update GET /external/accounts after initiate; pending
 * deltas keep Accounts card/total balances aligned with transfer activity until:
 * - full page refresh (store re-inits), or
 * - Viewing as switches holder (UserSwitcher calls clearPendingBalances).
 *
 * When the backend returns updated balances, refresh or user switch drops pending state
 * and the UI shows API numbers again.
 */
import { writable } from 'svelte/store';
import type { AccountSummary } from '$lib/types/northwind';

export interface PendingBalanceState {
	activeUser: string;
	deltasByAccountId: Record<string, number>;
}

const emptyState = (): PendingBalanceState => ({
	activeUser: '',
	deltasByAccountId: {}
});

export const pendingBalanceState = writable<PendingBalanceState>(emptyState());

export function clearPendingBalances(): void {
	pendingBalanceState.set(emptyState());
}

export function recordPendingTransfer(params: {
	activeUser: string;
	fromAccountId: string;
	toAccountId: string;
	amount: number;
}): void {
	const { activeUser, fromAccountId, toAccountId, amount } = params;
	if (!activeUser || !fromAccountId || !toAccountId || amount <= 0) return;

	pendingBalanceState.update((state) => {
		const base =
			state.activeUser && state.activeUser !== activeUser
				? emptyState()
				: { ...state, activeUser, deltasByAccountId: { ...state.deltasByAccountId } };

		base.deltasByAccountId[fromAccountId] = (base.deltasByAccountId[fromAccountId] ?? 0) - amount;
		base.deltasByAccountId[toAccountId] = (base.deltasByAccountId[toAccountId] ?? 0) + amount;
		return base;
	});
}

export function hasPendingBalanceAdjustments(state: PendingBalanceState): boolean {
	return Object.values(state.deltasByAccountId).some((delta) => Math.abs(delta) > 0.000_001);
}

export function applyPendingBalanceAdjustments(
	accounts: AccountSummary[],
	activeUser: string,
	state: PendingBalanceState
): AccountSummary[] {
	if (state.activeUser !== activeUser || !hasPendingBalanceAdjustments(state)) {
		return accounts;
	}

	return accounts.map((account) => {
		const delta = state.deltasByAccountId[account.account_id] ?? 0;
		if (Math.abs(delta) < 0.000_001) return account;
		return { ...account, balance: account.balance + delta };
	});
}
