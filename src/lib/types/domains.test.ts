import { describe, expect, it } from 'vitest';
import { parseDomainsResponse } from './domains';

describe('parseDomainsResponse', () => {
	it('parses domain lists from API payload', () => {
		const parsed = parseDomainsResponse({
			account_types: [{ code: 'CHECKING', display_name: 'Checking Account' }],
			account_statuses: [{ code: 'ACTIVE', display_name: 'Active' }]
		});
		expect(parsed?.account_types).toHaveLength(1);
		expect(parsed?.account_statuses?.[0].display_name).toBe('Active');
	});

	it('returns null for invalid payload', () => {
		expect(parseDomainsResponse(null)).toBeNull();
	});
});
