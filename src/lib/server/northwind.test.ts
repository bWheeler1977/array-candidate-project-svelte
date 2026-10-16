import { afterEach, describe, expect, it, vi } from 'vitest';
import { NorthwindApiError, northwindGet, northwindPost } from './northwind';

function mockFetchResponse(body: string, status = 200) {
	return vi.fn().mockResolvedValue(
		new Response(body, {
			status,
			headers: { 'Content-Type': 'application/json' }
		})
	);
}

describe('northwind client', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('throws on network failure', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
		await expect(northwindGet('/external/accounts')).rejects.toThrow(/Unable to reach NorthWind/);
	});

	it('throws on invalid JSON body', async () => {
		vi.stubGlobal('fetch', mockFetchResponse('not-json', 200));
		await expect(northwindGet('/external/accounts')).rejects.toThrow(/invalid JSON/i);
	});

	it('throws NorthwindApiError with API message on 400', async () => {
		vi.stubGlobal(
			'fetch',
			mockFetchResponse(JSON.stringify({ message: 'Transaction limit exceeded' }), 400)
		);
		await expect(northwindPost('/external/transfers/initiate', {})).rejects.toMatchObject({
			name: 'NorthwindApiError',
			message: 'Transaction limit exceeded',
			status: 400
		});
	});

	it('returns parsed JSON on success', async () => {
		vi.stubGlobal('fetch', mockFetchResponse(JSON.stringify({ ok: true }), 200));
		await expect(northwindGet<{ ok: boolean }>('/health')).resolves.toEqual({ ok: true });
	});

	it('extracts validation issue message when present', async () => {
		vi.stubGlobal(
			'fetch',
			mockFetchResponse(
				JSON.stringify({
					validation: { issues: [{ message: 'Amount is invalid' }] }
				}),
				422
			)
		);
		try {
			await northwindPost('/external/transfers/validate', {});
		} catch (err) {
			expect(err).toBeInstanceOf(NorthwindApiError);
			expect((err as NorthwindApiError).message).toBe('Amount is invalid');
			return;
		}
		throw new Error('Expected request to fail');
	});
});
