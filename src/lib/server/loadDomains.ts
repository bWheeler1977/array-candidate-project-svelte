import { northwindGet } from '$lib/server/northwind';
import { parseDomainsResponse, type NorthwindDomainsResponse } from '$lib/types/domains';

/**
 * Load bank domain labels once per layout request.
 * Failures return null; UI falls back to title-cased codes (see domainsLookup.ts).
 */
export async function loadNorthwindDomains(): Promise<NorthwindDomainsResponse | null> {
	try {
		const raw = await northwindGet<unknown>('/domains');
		return parseDomainsResponse(raw);
	} catch {
		return null;
	}
}
