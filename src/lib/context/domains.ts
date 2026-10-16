/**
 * Makes `/domains` lookup available to any descendant component without prop drilling.
 * Populated from layout data in `+layout.svelte` after `+layout.server.ts` loads domains once.
 */
import { getContext, setContext } from 'svelte';
import type { NorthwindDomainsResponse } from '$lib/types/domains';
import { createDomainsLookup, type DomainsLookup } from '$lib/utils/domainsLookup';

const DOMAINS_CONTEXT_KEY = Symbol('northwind-domains');

export function setDomainsContext(domains: NorthwindDomainsResponse | null): DomainsLookup {
	const lookup = createDomainsLookup(domains);
	setContext(DOMAINS_CONTEXT_KEY, lookup);
	return lookup;
}

export function getDomainsLookup(): DomainsLookup {
	return getContext<DomainsLookup>(DOMAINS_CONTEXT_KEY) ?? createDomainsLookup(null);
}
