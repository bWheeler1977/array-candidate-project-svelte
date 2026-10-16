import type { Handle } from '@sveltejs/kit';
import {
	EMBED_API_BASE_COOKIE,
	EMBED_HOLDER_COOKIE,
	EMBED_TOKEN_COOKIE,
	hasEmbedSession
} from '$lib/server/embedCookies';
import { runWithRequestAuth } from '$lib/server/requestAuth';

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get(EMBED_TOKEN_COOKIE)?.trim();
	const apiBaseUrl = event.cookies.get(EMBED_API_BASE_COOKIE)?.trim();

	event.locals.isEmbedMode = hasEmbedSession(event.cookies);
	event.locals.embedAccountHolder = event.cookies.get(EMBED_HOLDER_COOKIE)?.trim() ?? null;

	return runWithRequestAuth(
		{
			accessToken: accessToken || undefined,
			apiBaseUrl: apiBaseUrl || undefined
		},
		() => resolve(event)
	);
};
