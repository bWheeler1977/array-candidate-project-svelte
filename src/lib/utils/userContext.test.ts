import { describe, expect, it } from 'vitest';
import {
	accountBelongsToUser,
	accountsForUser,
	filterTransfersForUser,
	listAccountHolders,
	resolveActiveUser
} from './userContext';
import { makeAccount, makeTransfer } from '../test/fixtures';

describe('listAccountHolders', () => {
	it('returns sorted unique holder names', () => {
		const names = listAccountHolders([
			makeAccount({ account_holder_name: 'Zoe' }),
			makeAccount({ account_holder_name: 'Amy', account_id: '2' }),
			makeAccount({ account_holder_name: 'Zoe', account_id: '3' })
		]);
		expect(names).toEqual(['Amy', 'Zoe']);
	});
});

describe('resolveActiveUser', () => {
	it('uses cookie when valid', () => {
		expect(resolveActiveUser(['Amy', 'Zoe'], 'Zoe')).toBe('Zoe');
	});

	it('falls back to first candidate when cookie missing or invalid', () => {
		expect(resolveActiveUser(['Amy', 'Zoe'], undefined)).toBe('Amy');
		expect(resolveActiveUser(['Amy', 'Zoe'], 'Unknown')).toBe('Amy');
	});
});

describe('accountsForUser', () => {
	it('filters by holder name', () => {
		const all = [
			makeAccount({ account_holder_name: 'John Smith', account_id: '1' }),
			makeAccount({ account_holder_name: 'Other Person', account_id: '2' })
		];
		const john = accountsForUser(all, 'John Smith');
		expect(john).toHaveLength(1);
		expect(john[0].account_id).toBe('1');
	});

	it('returns empty for blank user', () => {
		expect(accountsForUser([makeAccount()], '')).toEqual([]);
	});
});

describe('filterTransfersForUser', () => {
	const johnChecking = makeAccount({
		account_id: '1',
		account_number: '1000000000001',
		account_holder_name: 'John Smith'
	});
	const johnSavings = makeAccount({
		account_id: '2',
		account_number: '1000000000002',
		account_type: 'savings',
		account_holder_name: 'John Smith'
	});
	const johnAccounts = [johnChecking, johnSavings];

	it('includes internal transfers between user accounts', () => {
		const transfers = filterTransfersForUser(
			[
				makeTransfer({
					source_account: { account_number: '1000000000001' },
					destination_account: { account_number: '1000000000002' }
				})
			],
			johnAccounts
		);
		expect(transfers).toHaveLength(1);
	});

	it('excludes transfers involving another user accounts', () => {
		const transfers = filterTransfersForUser(
			[
				makeTransfer({
					source_account: { account_number: '1000000000001' },
					destination_account: { account_number: '9999999999999' }
				})
			],
			johnAccounts
		);
		expect(transfers).toHaveLength(0);
	});

	it('returns empty when user has no accounts', () => {
		expect(filterTransfersForUser([makeTransfer()], [])).toEqual([]);
	});
});

describe('accountBelongsToUser', () => {
	it('matches holder name case-insensitively after trim', () => {
		const account = makeAccount({ account_holder_name: 'John Smith' });
		expect(accountBelongsToUser(account, '  john smith  ')).toBe(true);
		expect(accountBelongsToUser(account, 'Other')).toBe(false);
	});
});
