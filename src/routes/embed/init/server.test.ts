import { describe, expect, it } from 'vitest';
import { POST } from './+server';
import { EMBED_HOLDER_COOKIE, EMBED_TOKEN_COOKIE } from '../../../lib/server/embedCookies';
import { mockCookies } from '../../../lib/test/mockCookies';

describe('POST /embed/init', () => {
	it('rejects missing access token', async () => {
		await expect(
			POST({
				request: new Request('http://localhost/embed/init', {
					method: 'POST',
					body: JSON.stringify({})
				}),
				cookies: mockCookies()
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 400 });
	});

	it('sets embed cookies when accounts snapshot is provided', async () => {
		const cookies = mockCookies();
		const response = await POST({
			request: new Request('http://localhost/embed/init', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					accessToken: 'host-token-abc',
					accountHolderName: 'Robert Thompson',
					accounts: [
						{
							account_id: '1',
							account_number: '1000000000001',
							account_holder_name: 'Robert Thompson',
							account_type: 'CHECKING',
							account_status: 'ACTIVE',
							balance: 100,
							currency: 'USD',
							routing_number: '021000021'
						}
					]
				})
			}),
			cookies
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.ok).toBe(true);
		expect(body.accountHolderName).toBe('Robert Thompson');
		expect(cookies.get(EMBED_TOKEN_COOKIE)).toBe('host-token-abc');
		expect(cookies.get(EMBED_HOLDER_COOKIE)).toBe('Robert Thompson');
	});
});
