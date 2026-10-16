import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
	applyPendingBalanceAdjustments,
	clearPendingBalances,
	hasPendingBalanceAdjustments,
	pendingBalanceState,
	recordPendingTransfer
} from './pendingBalances';
import { makeAccount } from '../test/fixtures';

describe('pendingBalances', () => {
	beforeEach(() => {
		clearPendingBalances();
	});

	it('records debit and credit for a transfer', () => {
		recordPendingTransfer({
			activeUser: 'Robert Thompson',
			fromAccountId: 'sv',
			toAccountId: 'ch',
			amount: 100
		});
		const state = get(pendingBalanceState);
		expect(state.deltasByAccountId.sv).toBe(-100);
		expect(state.deltasByAccountId.ch).toBe(100);
	});

	it('applies deltas to account rows for the same holder', () => {
		recordPendingTransfer({
			activeUser: 'Robert Thompson',
			fromAccountId: 'sv',
			toAccountId: 'ch',
			amount: 124.94
		});
		const accounts = [
			makeAccount({ account_id: 'ch', balance: 3000 }),
			makeAccount({ account_id: 'sv', balance: 12_500 })
		];
		const adjusted = applyPendingBalanceAdjustments(
			accounts,
			'Robert Thompson',
			get(pendingBalanceState)
		);
		expect(adjusted[0].balance).toBeCloseTo(3124.94);
		expect(adjusted[1].balance).toBeCloseTo(12_375.06);
	});

	it('does not apply when active user differs', () => {
		recordPendingTransfer({
			activeUser: 'Robert Thompson',
			fromAccountId: 'sv',
			toAccountId: 'ch',
			amount: 50
		});
		const accounts = [makeAccount({ account_id: 'ch', balance: 100 })];
		const adjusted = applyPendingBalanceAdjustments(accounts, 'John Smith', get(pendingBalanceState));
		expect(adjusted[0].balance).toBe(100);
	});

	it('clears all pending state', () => {
		recordPendingTransfer({
			activeUser: 'Robert Thompson',
			fromAccountId: 'sv',
			toAccountId: 'ch',
			amount: 10
		});
		clearPendingBalances();
		expect(hasPendingBalanceAdjustments(get(pendingBalanceState))).toBe(false);
	});
});
