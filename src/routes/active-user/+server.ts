/**
 * Updates the active sandbox user (cookie). Implemented as POST /active-user instead of a
 * form action on the home page so user switching works reliably across routes and avoids
 * method/routing edge cases when invalidating data after a switch.
 */
import { error, json } from '@sveltejs/kit';
import { loadUserSession, persistActiveUser } from '$lib/server/userSession';
import type { RequestHandler } from './$types';
import { messages } from '$lib/i18n';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const formData = await request.formData();
	const requested = String(formData.get('user') ?? '').trim();
	if (!requested) {
		throw error(400, messages.userSwitcher.selectUser);
	}

	let users: string[] = [];
	try {
		const session = await loadUserSession(cookies);
		users = session.users;
	} catch {
		throw error(500, messages.errors.verifyAccountHolders);
	}

	if (!users.includes(requested)) {
		throw error(400, messages.userSwitcher.unknownUser);
	}

	persistActiveUser(cookies, requested);
	return json({ success: true, activeUser: requested });
};
