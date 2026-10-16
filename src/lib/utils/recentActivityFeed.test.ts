import { describe, expect, it } from 'vitest';
import { sampleDomainsLookup } from './domainsLookup';
import { buildRecentActivityFeed } from './recentActivityFeed';
import { MOCK_ACTIVITY_MAX_DAYS_AGO, mockActivityDateIso } from '../data/mockRecentActivity';
import { makeAccount, makeTransfer } from '../test/fixtures';

const domains = sampleDomainsLookup();

describe('mockActivityDateIso', () => {
	it('clamps days ago to 0–30', () => {
		const now = new Date('2026-10-14T08:00:00Z');
		const today = mockActivityDateIso(0, now);
		const max = mockActivityDateIso(999, now);
		expect(new Date(today).getDate()).toBe(14);
		const diffMs = now.getTime() - new Date(max).getTime();
		const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
		expect(diffDays).toBe(MOCK_ACTIVITY_MAX_DAYS_AGO);
	});
});

describe('buildRecentActivityFeed', () => {
	const accounts = [
		makeAccount({ account_holder_name: 'John Smith', account_type: 'checking' }),
		makeAccount({
			account_id: '2',
			account_holder_name: 'John Smith',
			account_type: 'savings',
			account_number: '1000000000002'
		})
	];

	it('includes mock rows for known users', () => {
		const feed = buildRecentActivityFeed('John Smith', accounts, [], domains, 8);
		expect(feed.some((item) => item.source === 'mock')).toBe(true);
		expect(feed[0].title).toBeTruthy();
	});

	it('uses friendly names for mock internal transfer titles', () => {
		const feed = buildRecentActivityFeed('John Smith', accounts, [], domains, 8);
		const internal = feed.find((item) => item.id === 'mock-john-5');
		expect(internal?.title).toBe('Transfer to Savings Account');
		expect(internal?.meta).toMatch(/From .*Checking/i);
	});

	it('includes dest-only API transfer on checking when holder has exactly two accounts', () => {
		const checkingId = accounts[0].account_id;
		const transfer = makeTransfer({
			transfer_id: 'dest-only',
			amount: 500,
			completed_date: new Date().toISOString(),
			source_account: { account_holder_name: 'John Smith' },
			destination_account: { account_number: '1000000000002' }
		});
		const checkingOnly = buildRecentActivityFeed('John Smith', accounts, [transfer], domains, 20, checkingId);
		expect(checkingOnly.some((item) => item.id === 'dest-only')).toBe(true);
		const row = checkingOnly.find((item) => item.id === 'dest-only');
		expect(row?.meta).toMatch(/From/i);
	});

	it('includes API transfers on both accounts when source and destination numbers are present', () => {
		const checkingId = accounts[0].account_id;
		const transfer = makeTransfer({
			transfer_id: 'both-sides',
			amount: 500,
			completed_date: new Date().toISOString(),
			source_account: { account_number: '1000000000001' },
			destination_account: { account_number: '1000000000002' }
		});
		const checkingOnly = buildRecentActivityFeed('John Smith', accounts, [transfer], domains, 20, checkingId);
		expect(checkingOnly.some((item) => item.id === 'both-sides')).toBe(true);
	});

	it('shows inbound internal transfers as positive on the destination account', () => {
		const checkingId = accounts[0].account_id;
		const savingsId = accounts[1].account_id;
		const transfer = makeTransfer({
			transfer_id: 'inbound-view',
			amount: 500,
			completed_date: new Date().toISOString(),
			source_account: { account_number: '1000000000001' },
			destination_account: { account_number: '1000000000002' }
		});

		const fromChecking = buildRecentActivityFeed('John Smith', accounts, [transfer], domains, 20, checkingId);
		const fromSavings = buildRecentActivityFeed('John Smith', accounts, [transfer], domains, 20, savingsId);
		const checkingRow = fromChecking.find((item) => item.id === 'inbound-view');
		const savingsRow = fromSavings.find((item) => item.id === 'inbound-view');

		expect(checkingRow?.amountLabel).toBe('-$500.00');
		expect(checkingRow?.isNegative).toBe(true);
		expect(savingsRow?.amountLabel).toBe('+$500.00');
		expect(savingsRow?.isNegative).toBe(false);
	});

	it('filters feed to a selected account', () => {
		const checkingId = accounts[0].account_id;
		const savingsId = accounts[1].account_id;
		const all = buildRecentActivityFeed('John Smith', accounts, [], domains, 20);
		const checkingOnly = buildRecentActivityFeed('John Smith', accounts, [], domains, 20, checkingId);
		expect(checkingOnly.length).toBeLessThan(all.length);
		expect(checkingOnly.every((item) => item.relatedAccountIds.includes(checkingId))).toBe(true);
		expect(checkingOnly.some((item) => item.id === 'mock-john-1')).toBe(true);
		expect(checkingOnly.some((item) => item.id === 'mock-john-4')).toBe(false);

		const savingsOnly = buildRecentActivityFeed('John Smith', accounts, [], domains, 20, savingsId);
		expect(savingsOnly.some((item) => item.id === 'mock-john-4')).toBe(true);
		expect(savingsOnly.some((item) => item.id === 'mock-john-5')).toBe(true);
	});

	it('merges and sorts API transfers with mocks', () => {
		const recentTransfer = makeTransfer({
			transfer_id: 'live-1',
			completed_date: new Date().toISOString(),
			source_account: { account_number: '1000000000001' },
			destination_account: { account_number: '1000000000002' }
		});
		const feed = buildRecentActivityFeed('John Smith', accounts, [recentTransfer], domains, 8);
		expect(feed.some((item) => item.id === 'live-1')).toBe(true);
	});

	it('drops transfers older than 30 days', () => {
		const old = makeTransfer({
			transfer_id: 'old-1',
			completed_date: '2020-01-01T00:00:00Z',
			source_account: { account_number: '1000000000001' },
			destination_account: { account_number: '1000000000002' }
		});
		const feed = buildRecentActivityFeed('John Smith', accounts, [old], domains, 8);
		expect(feed.find((item) => item.id === 'old-1')).toBeUndefined();
	});

	it('returns empty mocks for unknown user but still shows recent transfers', () => {
		const recentTransfer = makeTransfer({
			transfer_id: 'only-api',
			completed_date: new Date().toISOString()
		});
		const feed = buildRecentActivityFeed('Nobody Here', accounts, [recentTransfer], domains, 8);
		expect(feed.some((item) => item.source === 'mock')).toBe(false);
	});
});
