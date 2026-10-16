import { describe, expect, it } from 'vitest';
import {
	buildTransferRequest,
	hasTransferFormErrors,
	isSelectableFromAccount,
	isSelectableToAccount,
	validateTransferForm
} from './transfer';
import { makeAccount } from '../test/fixtures';

const checking = makeAccount({
	account_id: 'from',
	account_number: '1000000000001',
	balance: 500,
	account_status: 'active'
});
const savings = makeAccount({
	account_id: 'to',
	account_number: '1000000000002',
	account_type: 'savings',
	balance: 1000
});
const inactive = makeAccount({
	account_id: 'inactive',
	account_number: '1000000000003',
	account_status: 'closed',
	balance: 100
});

const accounts = [checking, savings, inactive];

describe('validateTransferForm — failure cases', () => {
	it('requires from and to accounts', () => {
		const errors = validateTransferForm(
			{ fromAccountId: '', toAccountId: '', amount: '10', reference: '' },
			accounts
		);
		expect(errors.fromAccountId).toBeTruthy();
		expect(errors.toAccountId).toBeTruthy();
	});

	it('rejects inactive from account', () => {
		const errors = validateTransferForm(
			{ fromAccountId: 'inactive', toAccountId: 'to', amount: '10', reference: '' },
			accounts
		);
		expect(errors.fromAccountId).toMatch(/active/i);
	});

	it('rejects inactive to account', () => {
		const errors = validateTransferForm(
			{ fromAccountId: 'from', toAccountId: 'inactive', amount: '10', reference: '' },
			accounts
		);
		expect(errors.toAccountId).toMatch(/active/i);
	});

	it('rejects same from and to', () => {
		const errors = validateTransferForm(
			{ fromAccountId: 'from', toAccountId: 'from', amount: '10', reference: '' },
			accounts
		);
		expect(errors.toAccountId).toMatch(/different/i);
	});

	it('rejects empty, invalid, zero, and over-balance amounts', () => {
		expect(
			validateTransferForm(
				{ fromAccountId: 'from', toAccountId: 'to', amount: '', reference: '' },
				accounts
			).amount
		).toBeTruthy();

		expect(
			validateTransferForm(
				{ fromAccountId: 'from', toAccountId: 'to', amount: 'abc', reference: '' },
				accounts
			).amount
		).toBeTruthy();

		expect(
			validateTransferForm(
				{ fromAccountId: 'from', toAccountId: 'to', amount: '0', reference: '' },
				accounts
			).amount
		).toMatch(/greater than zero/i);

		expect(
			validateTransferForm(
				{ fromAccountId: 'from', toAccountId: 'to', amount: '9999', reference: '' },
				accounts
			).amount
		).toMatch(/exceeds available balance/i);
	});

	it('rejects reference longer than 100 characters', () => {
		const errors = validateTransferForm(
			{
				fromAccountId: 'from',
				toAccountId: 'to',
				amount: '10',
				reference: 'x'.repeat(101)
			},
			accounts
		);
		expect(errors.reference).toMatch(/100 characters/);
	});
});

describe('validateTransferForm — success', () => {
	it('returns no errors for a valid transfer', () => {
		const errors = validateTransferForm(
			{ fromAccountId: 'from', toAccountId: 'to', amount: '100', reference: '' },
			accounts
		);
		expect(hasTransferFormErrors(errors)).toBe(false);
	});
});

describe('selectable accounts', () => {
	it('from account requires active status and positive balance', () => {
		expect(isSelectableFromAccount(checking)).toBe(true);
		expect(isSelectableFromAccount(inactive)).toBe(false);
		expect(isSelectableFromAccount(makeAccount({ balance: 0 }))).toBe(false);
	});

	it('to account requires active status only', () => {
		expect(isSelectableToAccount(savings)).toBe(true);
		expect(isSelectableToAccount(makeAccount({ balance: -50 }))).toBe(true);
		expect(isSelectableToAccount(inactive)).toBe(false);
	});
});

describe('buildTransferRequest', () => {
	it('returns null when validation fails', () => {
		expect(
			buildTransferRequest(
				{ fromAccountId: 'from', toAccountId: 'to', amount: '99999', reference: '' },
				accounts
			)
		).toBeNull();
	});

	it('builds payload for valid input', () => {
		const payload = buildTransferRequest(
			{ fromAccountId: 'from', toAccountId: 'to', amount: '25.50', reference: 'REF-1' },
			accounts
		);
		expect(payload?.amount).toBe(25.5);
		expect(payload?.source_account.account_number).toBe('1000000000001');
		expect(payload?.destination_account.account_number).toBe('1000000000002');
	});
});
