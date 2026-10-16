import { describe, expect, it } from 'vitest';
import {
	coalesceTransferPayload,
	parseAccountListResponse,
	parseAccountSummary,
	parseTransferListResponse,
	parseTransferSummary
} from './northwind';

describe('parseAccountSummary', () => {
	it('parses a valid account', () => {
		const account = parseAccountSummary({
			account_id: '1',
			account_number: '999',
			account_holder_name: 'Jane',
			account_type: 'checking',
			account_status: 'active',
			balance: 10.5,
			currency: 'USD'
		});
		expect(account?.account_id).toBe('1');
		expect(account?.balance).toBe(10.5);
	});

	it('returns null when required fields are missing', () => {
		expect(parseAccountSummary({ account_id: '1' })).toBeNull();
		expect(parseAccountSummary(null)).toBeNull();
		expect(parseAccountSummary('not-json')).toBeNull();
	});

	it('returns null when balance is not a finite number', () => {
		expect(
			parseAccountSummary({
				account_id: '1',
				account_number: '999',
				account_holder_name: 'Jane',
				account_type: 'checking',
				account_status: 'active',
				balance: '100'
			})
		).toBeNull();
	});
});

describe('parseAccountListResponse', () => {
	it('throws on invalid list shape', () => {
		expect(() => parseAccountListResponse({})).toThrow('Invalid account list response');
		expect(() => parseAccountListResponse({ accounts: 'nope' })).toThrow();
	});

	it('filters invalid account rows', () => {
		const result = parseAccountListResponse({
			accounts: [
				{
					account_id: '1',
					account_number: '1',
					account_holder_name: 'A',
					account_type: 'checking',
					account_status: 'active',
					balance: 1
				},
				{ account_id: 'bad' }
			]
		});
		expect(result.accounts).toHaveLength(1);
	});
});

describe('coalesceTransferPayload', () => {
	it('unwraps nested transfer objects', () => {
		const inner = { transfer_id: 't-1', amount: 1 };
		expect(coalesceTransferPayload({ transfer: inner })).toEqual(inner);
	});
});

describe('parseTransferSummary', () => {
	it('parses transfer with nested accounts', () => {
		const transfer = parseTransferSummary({
			transfer_id: 't-1',
			amount: 50,
			source_account: { account_number: '111', account_holder_name: 'John Smith' },
			destination_account: { account_number: '222' }
		});
		expect(transfer?.transfer_id).toBe('t-1');
		expect(transfer?.source_account?.account_number).toBe('111');
	});

	it('returns null without transfer_id or amount', () => {
		expect(parseTransferSummary({ amount: 1 })).toBeNull();
		expect(parseTransferSummary({ transfer_id: 'x' })).toBeNull();
	});

	it('parses account ref with routing_number only', () => {
		const transfer = parseTransferSummary({
			transfer_id: 'ach-1',
			amount: 500,
			source_account: { account_number: '', routing_number: '002772901' },
			destination_account: { account_number: 'UG0RYK-CH-009', routing_number: '003477805' }
		});
		expect(transfer?.source_account?.routing_number).toBe('002772901');
		expect(transfer?.source_account?.account_number).toBeUndefined();
	});
});

describe('parseTransferListResponse', () => {
	it('returns empty list for invalid payload (non-throwing)', () => {
		expect(parseTransferListResponse({})).toEqual({ transfers: [] });
	});

	it('skips invalid transfer rows', () => {
		const result = parseTransferListResponse({
			transfers: [{ transfer_id: 'ok', amount: 1 }, { transfer_id: 'no-amount' }]
		});
		expect(result.transfers).toHaveLength(1);
	});
});
