/** Accounts page: user-scoped transfer history for Recent Activity (hydrated for full account refs). */
import { northwindGet } from '$lib/server/northwind';
import { hydrateTransfersForDisplay } from '$lib/server/transfers';
import { parseTransferListResponse, type TransferSummary } from '$lib/types/northwind';
import { filterTransfersForUser } from '$lib/utils/userContext';
import type { PageServerLoad } from './$types';
import { messages } from '$lib/i18n';

export interface AccountsPageData {
	transfers: TransferSummary[];
	error: string | null;
}

export const load: PageServerLoad = async ({ parent }): Promise<AccountsPageData> => {
	const { accounts, userLoadError } = await parent();

	if (userLoadError) {
		return { transfers: [], error: userLoadError };
	}

	try {
		const transfersRaw = await northwindGet<unknown>('/external/transfers?per_page=50&page=1').catch(
			() => null
		);
		const allTransfers = transfersRaw ? parseTransferListResponse(transfersRaw).transfers : [];
		const scoped = filterTransfersForUser(allTransfers, accounts);
		const transfers = await hydrateTransfersForDisplay(scoped);

		return { transfers, error: null };
	} catch (err) {
		const message = err instanceof Error ? err.message : messages.accounts.loadActivityError;
		return { transfers: [], error: message };
	}
};
