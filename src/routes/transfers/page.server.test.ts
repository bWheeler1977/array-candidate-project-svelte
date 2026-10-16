import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isActionFailure } from '@sveltejs/kit';
import { NorthwindApiError } from '../../lib/server/northwind';
import { makeAccount } from '../../lib/test/fixtures';
import { mockCookies } from '../../lib/test/mockCookies';

vi.mock('$lib/server/userSession', () => ({
	loadUserSession: vi.fn()
}));

vi.mock('$lib/server/northwind', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/northwind')>();
	return {
		...actual,
		northwindPost: vi.fn()
	};
});

import { loadUserSession } from '../../lib/server/userSession';
import { northwindPost } from '../../lib/server/northwind';
import { actions } from './+page.server';

const checking = makeAccount({ account_id: 'from', balance: 500 });
const savings = makeAccount({
	account_id: 'to',
	account_type: 'savings',
	account_number: '1000000000002'
});

function formRequest(fields: Record<string, string>) {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		body.set(key, value);
	}
	return new Request('http://localhost/transfers', { method: 'POST', body });
}

function actionEvent(fields: Record<string, string>): Parameters<typeof actions.default>[0] {
	return {
		request: formRequest(fields),
		cookies: mockCookies()
	} as Parameters<typeof actions.default>[0];
}

describe('transfers page action (integration)', () => {
	beforeEach(() => {
		vi.mocked(loadUserSession).mockResolvedValue({
			users: ['John Smith'],
			activeUser: 'John Smith',
			allAccounts: [checking, savings],
			accounts: [checking, savings]
		});
		vi.mocked(northwindPost).mockReset();
	});

	it('fails validation when amount exceeds balance (no API call)', async () => {
		const result = await actions.default(
			actionEvent({ fromAccountId: 'from', toAccountId: 'to', amount: '9999', reference: '' })
		);

		expect(isActionFailure(result)).toBe(true);
		if (!isActionFailure(result)) throw new Error('expected validation failure');
		expect(result.status).toBe(400);
		expect(result.data?.fieldErrors?.amount).toMatch(/exceeds available balance/i);
		expect(northwindPost).not.toHaveBeenCalled();
	});

	it('returns success and clears form on API success', async () => {
		vi.mocked(northwindPost).mockResolvedValue({
			amount: 50,
			currency: 'USD',
			reference_number: 'CONF-123',
			completed_date: '2026-10-14T12:00:00Z'
		});

		const result = await actions.default(
			actionEvent({ fromAccountId: 'from', toAccountId: 'to', amount: '50', reference: '' })
		);

		if (isActionFailure(result)) throw new Error('expected success');
		expect(result).toMatchObject({
			outcome: 'success',
			successAmount: 50,
			successConfirmation: 'CONF-123'
		});
		expect(result.values?.amount).toBe('');
		expect(northwindPost).toHaveBeenCalledOnce();
		const [, body] = vi.mocked(northwindPost).mock.calls[0] as [string, Record<string, unknown>];
		expect(body.source_account).toMatchObject({ account_number: checking.account_number });
		expect(body.destination_account).toMatchObject({ account_number: savings.account_number });
		expect(body.amount).toBe(50);
	});

	it('maps form from/to account ids to source/destination on initiate payload', async () => {
		const savingsFrom = makeAccount({
			account_id: 'sv',
			account_number: 'UG0RYK-SV-010',
			account_type: 'SAVINGS',
			account_holder_name: 'Robert Thompson',
			balance: 12_500
		});
		const checkingTo = makeAccount({
			account_id: 'ch',
			account_number: 'UG0RYK-CH-009',
			account_type: 'CHECKING',
			account_holder_name: 'Robert Thompson',
			balance: 3_247.56
		});
		vi.mocked(loadUserSession).mockResolvedValue({
			users: ['Robert Thompson'],
			activeUser: 'Robert Thompson',
			allAccounts: [checkingTo, savingsFrom],
			accounts: [checkingTo, savingsFrom]
		});
		vi.mocked(northwindPost).mockResolvedValue({
			transfer_id: 'new-id',
			amount: 325.44,
			reference_number: 'NW-TEST'
		});

		await actions.default(
			actionEvent({
				fromAccountId: 'sv',
				toAccountId: 'ch',
				amount: '325.44',
				reference: ''
			})
		);

		const [, body] = vi.mocked(northwindPost).mock.calls[0] as [string, Record<string, { account_number: string }>];
		expect(body.source_account.account_number).toBe('UG0RYK-SV-010');
		expect(body.destination_account.account_number).toBe('UG0RYK-CH-009');
	});

	it('returns error outcome when API rejects transfer', async () => {
		vi.mocked(northwindPost).mockRejectedValue(
			new NorthwindApiError('Transaction limit exceeded', 400, {})
		);

		const result = await actions.default(
			actionEvent({ fromAccountId: 'from', toAccountId: 'to', amount: '10', reference: '' })
		);

		if (!isActionFailure(result)) throw new Error('expected API failure');
		expect(result.status).toBe(400);
		expect(result.data?.outcome).toBe('error');
		expect(result.data?.outcomeMessage).toMatch(/Transaction limit exceeded/);
	});

	it('fails when session cannot load accounts', async () => {
		vi.mocked(loadUserSession).mockRejectedValue(new Error('API down'));

		const result = await actions.default(
			actionEvent({ fromAccountId: 'from', toAccountId: 'to', amount: '10', reference: '' })
		);

		if (!isActionFailure(result)) throw new Error('expected session failure');
		expect(result.status).toBe(500);
		expect(result.data?.outcome).toBe('error');
	});
});
