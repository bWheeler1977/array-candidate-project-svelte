import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCookies } from '../../lib/test/mockCookies';

vi.mock('$lib/server/userSession', () => ({
	loadUserSession: vi.fn(),
	persistActiveUser: vi.fn()
}));

import { loadUserSession, persistActiveUser } from '../../lib/server/userSession';
import { POST } from './+server';

describe('POST /active-user', () => {
	beforeEach(() => {
		vi.mocked(loadUserSession).mockResolvedValue({
			users: ['Amy', 'John Smith'],
			activeUser: 'Amy',
			allAccounts: [],
			accounts: []
		});
	});

	it('returns 400 when user is missing', async () => {
		const request = new Request('http://localhost/active-user', {
			method: 'POST',
			body: new FormData()
		});
		await expect(POST({ request, cookies: mockCookies() } as Parameters<typeof POST>[0])).rejects.toMatchObject({
			status: 400
		});
	});

	it('returns 400 for unknown user', async () => {
		const body = new FormData();
		body.set('user', 'Not A Real User');
		const request = new Request('http://localhost/active-user', { method: 'POST', body });
		await expect(POST({ request, cookies: mockCookies() } as Parameters<typeof POST>[0])).rejects.toMatchObject({
			status: 400
		});
	});

	it('persists cookie and returns success for valid user', async () => {
		const body = new FormData();
		body.set('user', 'John Smith');
		const cookies = mockCookies();
		const request = new Request('http://localhost/active-user', { method: 'POST', body });
		const response = await POST({ request, cookies } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(200);
		expect(persistActiveUser).toHaveBeenCalledWith(cookies, 'John Smith');
		const json = await response.json();
		expect(json.activeUser).toBe('John Smith');
	});

	it('returns 500 when session load fails', async () => {
		vi.mocked(loadUserSession).mockRejectedValue(new Error('fail'));
		const body = new FormData();
		body.set('user', 'John Smith');
		const request = new Request('http://localhost/active-user', { method: 'POST', body });
		await expect(POST({ request, cookies: mockCookies() } as Parameters<typeof POST>[0])).rejects.toMatchObject({
			status: 500
		});
	});
});
