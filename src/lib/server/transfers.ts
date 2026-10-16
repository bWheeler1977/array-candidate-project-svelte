/**
 * Transfer list entries may omit source or destination account numbers. We hydrate from
 * GET /external/transfers/{id} (full account objects in Swagger) rather than guessing
 * the other account when filtering activity—important if a holder has more than two accounts.
 */
import { northwindGet } from '$lib/server/northwind';
import {
	coalesceTransferPayload,
	parseTransferSummary,
	type TransferAccountRef,
	type TransferSummary
} from '$lib/types/northwind';

function mergeAccountRef(
	existing: TransferAccountRef | undefined,
	incoming: TransferAccountRef | undefined
): TransferAccountRef | undefined {
	if (!existing && !incoming) return undefined;
	return {
		account_number: existing?.account_number?.trim() || incoming?.account_number?.trim(),
		routing_number: existing?.routing_number?.trim() || incoming?.routing_number?.trim(),
		account_holder_name:
			existing?.account_holder_name?.trim() || incoming?.account_holder_name?.trim(),
		account_type: existing?.account_type?.trim() || incoming?.account_type?.trim(),
		institution_name: existing?.institution_name?.trim() || incoming?.institution_name?.trim()
	};
}

function needsAccountHydration(transfer: TransferSummary): boolean {
	const source = transfer.source_account?.account_number?.trim();
	const destination = transfer.destination_account?.account_number?.trim();
	return !source || !destination;
}

async function hydrateTransfer(transfer: TransferSummary): Promise<TransferSummary> {
	if (!needsAccountHydration(transfer)) return transfer;

	try {
		const detail = await northwindGet<unknown>(`/external/transfers/${transfer.transfer_id}`);
		const payload = coalesceTransferPayload(detail);
		const parsed = parseTransferSummary(payload);
		const detailRecord =
			typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : null;
		const detailSource = parsed?.source_account ?? readAccountRef(detailRecord, 'source_account');
		const detailDestination =
			parsed?.destination_account ?? readAccountRef(detailRecord, 'destination_account');

		return {
			...transfer,
			source_account: mergeAccountRef(transfer.source_account, detailSource),
			destination_account: mergeAccountRef(transfer.destination_account, detailDestination)
		};
	} catch {
		return transfer;
	}
}

function readAccountRef(
	record: Record<string, unknown> | null,
	key: string
): TransferAccountRef | undefined {
	if (!record) return undefined;
	const acct = record[key];
	if (typeof acct !== 'object' || acct === null) return undefined;
	const obj = acct as Record<string, unknown>;
	const account_number =
		(typeof obj.account_number === 'string' && obj.account_number.trim()) ||
		(typeof obj.accountNumber === 'string' && obj.accountNumber.trim()) ||
		undefined;
	const routing_number =
		typeof obj.routing_number === 'string' ? obj.routing_number.trim() : undefined;
	const account_holder_name =
		typeof obj.account_holder_name === 'string' ? obj.account_holder_name.trim() : undefined;
	const account_type = typeof obj.account_type === 'string' ? obj.account_type.trim() : undefined;
	const institution_name =
		typeof obj.institution_name === 'string' ? obj.institution_name.trim() : undefined;
	if (!account_number && !routing_number && !account_holder_name && !account_type && !institution_name) {
		return undefined;
	}
	return { account_number, routing_number, account_holder_name, account_type, institution_name };
}

/** Fill missing source/destination account numbers from GET /external/transfers/{id}. */
export async function hydrateTransfersForDisplay(
	transfers: TransferSummary[]
): Promise<TransferSummary[]> {
	if (transfers.length === 0) return transfers;
	return Promise.all(transfers.map((transfer) => hydrateTransfer(transfer)));
}
