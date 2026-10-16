import { describe, expect, it } from 'vitest';
import { sampleDomainsLookup } from './domainsLookup';
import {
	findAccountByNumber,
	findAccountByRoutingNumber,
	transferActivityMeta,
	transferLinkedAccountIds,
	transferListTitle,
	transferRecentListMeta
} from './transferDisplay';
import { makeAccount, makeTransfer } from '../test/fixtures';

const domains = sampleDomainsLookup();

describe('findAccountByNumber', () => {
	const accounts = [
		makeAccount({
			account_id: 'ch',
			account_number: 'UG0RYK-CH-009',
			account_type: 'CHECKING',
			routing_number: '003477805'
		}),
		makeAccount({
			account_id: 'sv',
			account_number: 'UG0RYK-SV-010',
			account_type: 'SAVINGS',
			routing_number: '002772901'
		})
	];

	it('matches holder accounts by routing when account_number is empty', () => {
		expect(findAccountByRoutingNumber(accounts, '002772901')?.account_id).toBe('sv');
		expect(findAccountByRoutingNumber(accounts, '003477805')?.account_id).toBe('ch');
	});

	it('does not match routing when duplicate on multiple holder accounts', () => {
		const duplicateRouting = [
			makeAccount({
				account_id: 'ch',
				account_number: 'UG0RYK-CH-009',
				routing_number: '003477805'
			}),
			makeAccount({
				account_id: 'sv',
				account_number: 'UG0RYK-SV-010',
				account_type: 'SAVINGS',
				routing_number: '003477805'
			})
		];
		expect(findAccountByRoutingNumber(duplicateRouting, '003477805')).toBeUndefined();
	});

	it('matches sandbox numbers by visible suffix when API sends short refs', () => {
		expect(findAccountByNumber(accounts, '009')?.account_id).toBe('ch');
		expect(findAccountByNumber(accounts, '010')?.account_id).toBe('sv');
	});
});

describe('transferRecentListMeta', () => {
	const accounts = [
		makeAccount({
			account_id: 'ch',
			account_number: 'UG0RYK-CH-009',
			account_type: 'CHECKING',
			routing_number: '003477805'
		}),
		makeAccount({
			account_id: 'sv',
			account_number: 'UG0RYK-SV-010',
			account_type: 'SAVINGS',
			balance: 12_500,
			routing_number: '003477805'
		})
	];

	it('shows From source, not destination, when list payload omits source number', () => {
		const transfer = makeTransfer({
			amount: 152.25,
			completed_date: '2026-10-15T12:00:00Z',
			source_account: { account_holder_name: 'Robert Thompson' },
			destination_account: { account_number: 'UG0RYK-SV-010' }
		});

		expect(transferListTitle(transfer, accounts, domains)).toContain('Savings');
		expect(transferRecentListMeta(transfer, accounts, domains)).toBe(
			'Oct 15 · From Checking Account'
		);
	});

	it('links both accounts when API omits source number (two-account holder)', () => {
		const transfer = makeTransfer({
			source_account: { account_holder_name: 'Robert Thompson' },
			destination_account: { account_number: 'UG0RYK-SV-010' }
		});
		const ids = transferLinkedAccountIds(transfer, accounts);
		expect(ids).toHaveLength(2);
		expect(ids).toContain('ch');
		expect(ids).toContain('sv');
	});

	it('Recent Activity meta resolves source from routing_number when unique on holder accounts', () => {
		const accountsWithDistinctRouting = [
			accounts[0],
			makeAccount({
				account_id: 'sv',
				account_number: 'UG0RYK-SV-010',
				account_type: 'SAVINGS',
				routing_number: '002772901'
			})
		];
		const transfer = makeTransfer({
			completed_date: '2026-10-14T12:00:00Z',
			source_account: { account_number: '', routing_number: '002772901' },
			destination_account: { account_number: 'UG0RYK-CH-009', routing_number: '003477805' }
		});
		const meta = transferActivityMeta(transfer, accountsWithDistinctRouting, domains);
		expect(meta).toMatch(/From .*Savings/i);
		expect(meta).not.toMatch(/From .*Checking/i);
	});

	it('Recent Activity meta uses From source when known', () => {
		const transfer = makeTransfer({
			completed_date: '2026-10-14T12:00:00Z',
			source_account: { account_number: 'UG0RYK-CH-009' },
			destination_account: { account_number: 'UG0RYK-SV-010' }
		});
		expect(transferActivityMeta(transfer, accounts, domains)).toContain('From');
		expect(transferActivityMeta(transfer, accounts, domains)).toMatch(/Checking/i);
	});

	it('meta avoids repeating destination when API omits source and routing is unusable', () => {
		const robertAccounts = [
			...accounts,
			makeAccount({
				account_id: 'cd',
				account_number: 'UG0RYK-CD-011',
				account_type: 'CD',
				routing_number: '008787806'
			})
		];
		const transfer = makeTransfer({
			completed_date: '2026-10-14T12:00:00Z',
			direction: 'OUTBOUND',
			source_account: { routing_number: '002772901' },
			destination_account: { account_number: 'UG0RYK-CH-009', routing_number: '003477805' }
		});
		const meta = transferActivityMeta(transfer, robertAccounts, domains);
		expect(meta).toContain('Oct 14');
		expect(meta).toContain('Source unavailable');
		expect(meta).not.toMatch(/Checking/i);
	});

	it('includes From when both account numbers are present', () => {
		const transfer = makeTransfer({
			completed_date: '2026-10-14T12:00:00Z',
			source_account: { account_number: 'UG0RYK-CH-009' },
			destination_account: { account_number: 'UG0RYK-SV-010' }
		});

		const meta = transferRecentListMeta(transfer, accounts, domains);
		expect(meta).toContain('From');
		expect(meta).toMatch(/Checking/i);
		expect(meta).not.toMatch(/From .*Savings.*Savings/i);
	});
});
