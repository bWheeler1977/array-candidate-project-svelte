/**
 * When the sandbox list/detail APIs return incomplete or swapped account refs, remember
 * the from/to account ids from a successful initiate (same browser session) and merge them
 * into transfer rows for display only.
 */
import { findAccountForTransferSide } from './transferDisplay';
import type { AccountSummary, TransferAccountRef, TransferSummary } from '$lib/types/northwind';

export interface TransferEndpointHint {
	transferId?: string;
	referenceNumber?: string;
	fromAccountId: string;
	toAccountId: string;
	amount: number;
	recordedAt: string;
}

export const TRANSFER_HINTS_STORAGE_KEY = 'northwind_transfer_endpoint_hints';

function mergeSide(
	existing: TransferAccountRef | undefined,
	fromAccount: AccountSummary
): TransferAccountRef {
	return {
		account_number: fromAccount.account_number,
		routing_number: existing?.routing_number?.trim() || fromAccount.routing_number,
		account_holder_name: fromAccount.account_holder_name,
		account_type: fromAccount.account_type,
		institution_name: existing?.institution_name
	};
}

export function findHintForTransfer(
	transfer: TransferSummary,
	hints: TransferEndpointHint[]
): TransferEndpointHint | undefined {
	const id = transfer.transfer_id?.trim();
	const ref = transfer.reference_number?.trim();
	const amount = Math.abs(transfer.amount);

	for (const hint of hints) {
		if (hint.transferId && id && hint.transferId === id) return hint;
		if (hint.referenceNumber && ref && hint.referenceNumber === ref) return hint;
	}

	const transferDay = (transfer.initiated_date ?? transfer.completed_date ?? '').slice(0, 10);
	for (const hint of hints) {
		if (Math.abs(hint.amount - amount) > 0.001) continue;
		const hintDay = hint.recordedAt.slice(0, 10);
		if (transferDay && hintDay && transferDay === hintDay) return hint;
	}

	return undefined;
}

export function applyTransferEndpointHint(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	hint: TransferEndpointHint | undefined
): TransferSummary {
	if (!hint) return transfer;

	const from = accounts.find((a) => a.account_id === hint.fromAccountId);
	const to = accounts.find((a) => a.account_id === hint.toAccountId);
	if (!from || !to) return transfer;

	return {
		...transfer,
		source_account: mergeSide(transfer.source_account, from),
		destination_account: mergeSide(transfer.destination_account, to)
	};
}

export function applyTransferEndpointHints(
	transfers: TransferSummary[],
	accounts: AccountSummary[],
	hints: TransferEndpointHint[]
): TransferSummary[] {
	if (hints.length === 0) return transfers;
	return transfers.map((transfer) => {
		const hint = findHintForTransfer(transfer, hints);
		return applyTransferEndpointHint(transfer, accounts, hint);
	});
}

/**
 * Sandbox list rows sometimes put the only known account on destination_account for OUTBOUND
 * transfers while source_account has no account_number (see Robert’s $325 / $500 rows).
 */
export function isOutboundSourceMisfiledAsDestination(
	transfer: TransferSummary,
	accounts: AccountSummary[]
): boolean {
	if ((transfer.direction ?? '').toUpperCase() !== 'OUTBOUND') return false;
	if (transfer.source_account?.account_number?.trim()) return false;
	if (!transfer.destination_account?.account_number?.trim()) return false;
	return Boolean(findAccountForTransferSide(accounts, transfer.destination_account));
}

export function normalizeMisfiledOutboundTransfer(
	transfer: TransferSummary,
	accounts: AccountSummary[]
): TransferSummary {
	if (!isOutboundSourceMisfiledAsDestination(transfer, accounts)) return transfer;

	const misfiledSource = transfer.destination_account;
	const matched = findAccountForTransferSide(accounts, misfiledSource);
	if (!matched) return transfer;

	return {
		...transfer,
		source_account: mergeSide(transfer.source_account, matched),
		destination_account: {
			institution_name: misfiledSource?.institution_name,
			routing_number: misfiledSource?.routing_number
		}
	};
}

export function sortTransfersNewestFirst(transfers: TransferSummary[]): TransferSummary[] {
	return transfers.slice().sort((a, b) => {
		const ta = new Date(a.initiated_date ?? a.completed_date ?? 0).getTime();
		const tb = new Date(b.initiated_date ?? b.completed_date ?? 0).getTime();
		return tb - ta;
	});
}

/** Hints (session) override API; normalize misfiled rows; newest first. */
export function prepareTransfersForDisplay(
	transfers: TransferSummary[],
	accounts: AccountSummary[],
	hints: TransferEndpointHint[]
): TransferSummary[] {
	const normalized = transfers.map((t) => normalizeMisfiledOutboundTransfer(t, accounts));
	const hinted = applyTransferEndpointHints(normalized, accounts, hints);
	return sortTransfersNewestFirst(hinted);
}
