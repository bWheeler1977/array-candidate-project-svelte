import type { Cookies } from '@sveltejs/kit';

/** httpOnly session for host-provided API bearer token (embedded widget). */
export const EMBED_TOKEN_COOKIE = 'northwind_embed_token';
/** Optional holder scope when the API returns multiple customers. */
export const EMBED_HOLDER_COOKIE = 'northwind_embed_account_holder';
/** Optional per-session API base override (host BFF URL). */
export const EMBED_API_BASE_COOKIE = 'northwind_embed_api_base';

const COOKIE_OPTS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: process.env.NODE_ENV === 'production',
	maxAge: 60 * 60 * 8
};

export function hasEmbedSession(cookies: Cookies): boolean {
	return Boolean(cookies.get(EMBED_TOKEN_COOKIE)?.trim());
}

export function readEmbedAccountHolder(cookies: Cookies): string | undefined {
	const value = cookies.get(EMBED_HOLDER_COOKIE)?.trim();
	return value || undefined;
}

export function persistEmbedSession(
	cookies: Cookies,
	input: {
		accessToken: string;
		accountHolderName?: string;
		apiBaseUrl?: string;
	}
): void {
	cookies.set(EMBED_TOKEN_COOKIE, input.accessToken.trim(), COOKIE_OPTS);

	if (input.accountHolderName?.trim()) {
		cookies.set(EMBED_HOLDER_COOKIE, input.accountHolderName.trim(), COOKIE_OPTS);
	} else {
		cookies.delete(EMBED_HOLDER_COOKIE, { path: '/' });
	}

	if (input.apiBaseUrl?.trim()) {
		cookies.set(EMBED_API_BASE_COOKIE, input.apiBaseUrl.trim(), COOKIE_OPTS);
	} else {
		cookies.delete(EMBED_API_BASE_COOKIE, { path: '/' });
	}
}

export function clearEmbedSession(cookies: Cookies): void {
	cookies.delete(EMBED_TOKEN_COOKIE, { path: '/' });
	cookies.delete(EMBED_HOLDER_COOKIE, { path: '/' });
	cookies.delete(EMBED_API_BASE_COOKIE, { path: '/' });
}
