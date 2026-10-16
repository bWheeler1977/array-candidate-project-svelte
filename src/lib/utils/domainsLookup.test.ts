import { describe, expect, it } from 'vitest';
import { createDomainsLookup, sampleNorthwindDomains } from './domainsLookup';

describe('createDomainsLookup', () => {
	const domains = createDomainsLookup(sampleNorthwindDomains());

	it('maps API account types to display names', () => {
		expect(domains.labelAccountType('CHECKING')).toBe('Checking Account');
		expect(domains.compactAccountType('SAVINGS')).toBe('Savings');
		expect(domains.accountTypeDescription('CD')).toContain('interest');
	});

	it('maps uppercase account status codes from /external/accounts', () => {
		expect(domains.labelAccountStatus('ACTIVE')).toBe('Active');
		expect(domains.labelAccountStatus('FROZEN')).toBe('Frozen');
	});

	it('maps account statuses from codes', () => {
		expect(domains.labelAccountStatus('FROZEN')).toBe('Frozen');
		expect(domains.accountStatusDescription('CLOSED')).toContain('closed');
	});

	it('maps transfer statuses and types', () => {
		expect(domains.labelTransferStatus('PROCESSING')).toBe('Processing');
		expect(domains.labelTransferType('ACH')).toBe('ACH Transfer');
	});
});
