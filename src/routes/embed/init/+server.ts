/**
 * Host bootstrap: exchange a customer access token for an httpOnly embed session cookie.
 * The token never touches client-side JS in the banking app beyond this POST body.
 */
import { error, json } from '@sveltejs/kit';
import { persistEmbedSession } from '$lib/server/embedCookies';
import { northwindGet } from '$lib/server/northwind';
import { runWithRequestAuth } from '$lib/server/requestAuth';
import type { HostWidgetConfig } from '$lib/types/embed';
import { parseAccountListResponse } from '$lib/types/northwind';
import { listAccountHolders, normalizeHolderName } from '$lib/utils/userContext';
import type { RequestHandler } from './$types';

function resolveHolderName(
	body: HostWidgetConfig,
	parsedAccounts: ReturnType<typeof parseAccountListResponse>['accounts']
): string {
	const explicit = body.accountHolderName?.trim();
	if (explicit) return normalizeHolderName(explicit);

	if (body.accounts?.length) {
		const fromPayload = normalizeHolderName(body.accounts[0].account_holder_name);
		if (fromPayload) return fromPayload;
	}

	const holders = listAccountHolders(parsedAccounts);
	return holders[0] ?? '';
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: HostWidgetConfig;
	try {
		body = (await request.json()) as HostWidgetConfig;
	} catch {
		throw error(400, 'Invalid JSON body.');
	}

	const accessToken = body.accessToken?.trim();
	if (!accessToken) {
		throw error(400, 'accessToken is required.');
	}

	let accountCount = 0;
	let holderName = body.accountHolderName?.trim() ?? '';

	if (body.accounts?.length) {
		const parsed = parseAccountListResponse({ accounts: body.accounts });
		accountCount = parsed.accounts.length;
		holderName = resolveHolderName(body, parsed.accounts);
	} else {
		try {
			const listed = await runWithRequestAuth(
				{
					accessToken,
					apiBaseUrl: body.apiBaseUrl?.trim()
				},
				() => northwindGet<unknown>('/external/accounts?limit=100')
			);
			const parsed = parseAccountListResponse(listed);
			accountCount = parsed.accounts.length;
			holderName = resolveHolderName(body, parsed.accounts);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to verify access token.';
			throw error(401, message);
		}
	}

	persistEmbedSession(cookies, {
		accessToken,
		accountHolderName: holderName || undefined,
		apiBaseUrl: body.apiBaseUrl
	});

	return json({
		ok: true,
		accountHolderName: holderName,
		accountCount
	});
};
