/**
 * Root server load for every page.
 *
 * - Session: all accounts from the API, scoped to the active holder (cookie).
 * - Domains: bank label catalog fetched once per navigation; UI copy comes from here
 *   instead of hard-coded strings (see README “Design decisions”).
 *
 * Both requests run in parallel so accounts and labels are ready together.
 */
import { loadNorthwindDomains } from '$lib/server/loadDomains';
import { loadUserSession } from '$lib/server/userSession';
import type { NorthwindDomainsResponse } from '$lib/types/domains';
import type { LayoutServerLoad } from './$types';
import { messages } from '$lib/i18n';

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
	const domainsPromise = loadNorthwindDomains();

	try {
		const [session, domains] = await Promise.all([loadUserSession(cookies), domainsPromise]);
		return {
			users: session.users,
			activeUser: session.activeUser,
			accounts: session.accounts,
			userLoadError: null as string | null,
			domains,
			isEmbedMode: locals.isEmbedMode,
			embedAccountHolder: locals.embedAccountHolder
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : messages.errors.loadAccountHolders;
		const domains = await domainsPromise.catch(() => null);
		return {
			users: [] as string[],
			activeUser: '',
			accounts: [],
			userLoadError: message,
			domains: domains as NorthwindDomainsResponse | null,
			isEmbedMode: locals.isEmbedMode,
			embedAccountHolder: locals.embedAccountHolder
		};
	}
};
