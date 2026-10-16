/**
 * Candidate API returns multiple account holders in one list. This module loads the full
 * account list once per layout request and derives the active holder from an httpOnly cookie
 * so each page can treat `accounts` as “this customer’s accounts” only.
 */
import type { Cookies } from '@sveltejs/kit';
import { hasEmbedSession, readEmbedAccountHolder } from '$lib/server/embedCookies';
import { northwindGet } from '$lib/server/northwind';
import { parseAccountListResponse, type AccountSummary } from '$lib/types/northwind';
import {
	ACTIVE_USER_COOKIE,
	accountsForUser,
	listAccountHolders,
	normalizeHolderName,
	resolveActiveUser
} from '$lib/utils/userContext';

export interface UserSession {
	users: string[];
	activeUser: string;
	allAccounts: AccountSummary[];
	accounts: AccountSummary[];
}

export async function loadUserSession(cookies: Cookies): Promise<UserSession> {
	const raw = await northwindGet<unknown>('/external/accounts?limit=100');
	const { accounts: allAccounts } = parseAccountListResponse(raw);

	if (hasEmbedSession(cookies)) {
		const embedHolder = readEmbedAccountHolder(cookies);
		const users = embedHolder ? [embedHolder] : listAccountHolders(allAccounts);
		const activeUser = embedHolder
			? normalizeHolderName(embedHolder)
			: resolveActiveUser(users, undefined);
		const accounts = accountsForUser(allAccounts, activeUser);
		return { users, activeUser, allAccounts, accounts };
	}

	const users = listAccountHolders(allAccounts);
	const activeUser = resolveActiveUser(users, cookies.get(ACTIVE_USER_COOKIE));
	const accounts = accountsForUser(allAccounts, activeUser);

	if (activeUser && cookies.get(ACTIVE_USER_COOKIE) !== activeUser) {
		persistActiveUser(cookies, activeUser);
	}

	return { users, activeUser, allAccounts, accounts };
}

export function persistActiveUser(cookies: Cookies, activeUser: string): void {
	cookies.set(ACTIVE_USER_COOKIE, activeUser, {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		sameSite: 'lax',
		httpOnly: true
	});
}
