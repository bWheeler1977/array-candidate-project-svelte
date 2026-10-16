/**
 * Transfers route: loads hydrated transfer history; default action validates on the server
 * (mirrors client rules) before calling initiate, so tampered requests cannot bypass checks.
 */
import { fail } from '@sveltejs/kit';
import { northwindGet, northwindPost, NorthwindApiError } from '$lib/server/northwind';
import { hydrateTransfersForDisplay } from '$lib/server/transfers';
import { loadUserSession } from '$lib/server/userSession';
import {
	parseTransferListResponse,
	type AccountSummary,
	type TransferStatusResponse,
	type TransferSummary
} from '$lib/types/northwind';
import {
	buildTransferRequest,
	hasTransferFormErrors,
	validateTransferForm,
	type TransferFormValues
} from '$lib/utils/transfer';
import { accountBelongsToUser, filterTransfersForUser } from '$lib/utils/userContext';
import type { Actions, PageServerLoad } from './$types';
import { messages } from '$lib/i18n';

export interface TransfersPageData {
	transfers: TransferSummary[];
	loadError: string | null;
}

export const load: PageServerLoad = async ({ parent }): Promise<TransfersPageData> => {
	const { accounts, userLoadError } = await parent();

	if (userLoadError) {
		return { transfers: [], loadError: userLoadError };
	}

	try {
		const transfersRaw = await northwindGet<unknown>('/external/transfers?per_page=50&page=1').catch(
			() => null
		);
		const allTransfers = transfersRaw ? parseTransferListResponse(transfersRaw).transfers : [];
		const scoped = filterTransfersForUser(allTransfers, accounts);
		const transfers = await hydrateTransfersForDisplay(scoped);
		return { transfers, loadError: null };
	} catch (err) {
		const message = err instanceof Error ? err.message : messages.transfers.page.loadTransfersError;
		return { transfers: [], loadError: message };
	}
};

function readFormValues(formData: FormData): TransferFormValues {
	return {
		fromAccountId: String(formData.get('fromAccountId') ?? ''),
		toAccountId: String(formData.get('toAccountId') ?? ''),
		amount: String(formData.get('amount') ?? ''),
		reference: String(formData.get('reference') ?? '')
	};
}

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const values = readFormValues(formData);

		let accounts: AccountSummary[] = [];
		let activeUser = '';
		try {
			const session = await loadUserSession(cookies);
			accounts = session.accounts;
			activeUser = session.activeUser;
		} catch (err) {
			const message = err instanceof Error ? err.message : messages.transfers.page.loadAccountsError;
			return fail(500, {
				values,
				fieldErrors: { form: message },
				outcome: 'error' as const,
				outcomeMessage: message
			});
		}

		if (!activeUser || accounts.length === 0) {
			return fail(400, {
				values,
				fieldErrors: { form: messages.transfers.page.noUserAccounts },
				outcome: 'idle' as const,
				outcomeMessage: ''
			});
		}

		const fieldErrors = validateTransferForm(values, accounts);
		if (hasTransferFormErrors(fieldErrors)) {
			return fail(400, {
				values,
				fieldErrors,
				outcome: 'idle' as const,
				outcomeMessage: ''
			});
		}

		const from = accounts.find((a) => a.account_id === values.fromAccountId);
		const to = accounts.find((a) => a.account_id === values.toAccountId);
		if (
			!from ||
			!to ||
			!accountBelongsToUser(from, activeUser) ||
			!accountBelongsToUser(to, activeUser)
		) {
			return fail(400, {
				values,
				fieldErrors: { form: messages.transfers.page.accountsMustBelongToUser },
				outcome: 'idle' as const,
				outcomeMessage: ''
			});
		}

		const payload = buildTransferRequest(values, accounts);
		if (!payload) {
			return fail(400, {
				values,
				fieldErrors: { form: messages.transfers.page.buildRequestFailed },
				outcome: 'idle' as const,
				outcomeMessage: ''
			});
		}

		try {
			const response = await northwindPost<TransferStatusResponse>(
				'/external/transfers/initiate',
				payload
			);
			const confirmation =
				response.reference_number?.trim() ||
				response.transfer_id?.trim() ||
				payload.reference_number;
			const transferDate =
				response.completed_date ?? response.initiated_date ?? new Date().toISOString();

			return {
				values: {
					fromAccountId: '',
					toAccountId: '',
					amount: '',
					reference: ''
				},
				fieldErrors: {},
				outcome: 'success' as const,
				outcomeMessage: '',
				successAmount: response.amount ?? payload.amount,
				successCurrency: response.currency ?? payload.currency,
				successFromAccountId: values.fromAccountId,
				successToAccountId: values.toAccountId,
				successTransferId: response.transfer_id?.trim() ?? '',
				successConfirmation: confirmation,
				successTransferDate: transferDate
			};
		} catch (err) {
			const message =
				err instanceof NorthwindApiError
					? err.message
					: err instanceof Error
						? err.message
						: messages.transfers.page.unexpectedError;
			return fail(400, {
				values,
				fieldErrors: {},
				outcome: 'error' as const,
				outcomeMessage: message
			});
		}
	}
};
