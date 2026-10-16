/**
 * NorthWind API types and parsers. Unknown JSON is validated here before reaching components;
 * field names follow Swagger (snake_case). Account type/status values are domain codes (e.g. CHECKING).
 */
export interface AccountSummary {
	account_id: string;
	account_number: string;
	account_holder_name: string;
	account_type: string;
	account_status: string;
	balance: number;
	currency: string;
	opened_date?: string;
	routing_number?: string;
}

export interface PaginationInfo {
	limit?: number;
	offset?: number;
	total?: number;
	page?: number;
	per_page?: number;
}

export interface AccountListResponse {
	accounts: AccountSummary[];
	pagination?: PaginationInfo;
}

export interface TransferAccountRef {
	account_number?: string;
	routing_number?: string;
	account_holder_name?: string;
	account_type?: string;
	institution_name?: string;
}

export interface TransferSummary {
	transfer_id: string;
	amount: number;
	currency: string;
	description?: string;
	status?: string;
	direction?: string;
	initiated_date?: string;
	completed_date?: string;
	reference_number?: string;
	transfer_type?: string;
	source_account?: TransferAccountRef;
	destination_account?: TransferAccountRef;
}

export interface TransferListResponse {
	transfers: TransferSummary[];
	pagination?: PaginationInfo;
}

export interface ApiErrorBody {
	error?: string;
	message?: string;
}

export interface ExternalAccountDetails {
	account_number: string;
	account_holder_name?: string;
	routing_number?: string;
	institution_name?: string;
}

export interface TransferRequest {
	amount: number;
	currency: string;
	description: string;
	direction: 'INBOUND' | 'OUTBOUND';
	reference_number: string;
	transfer_type: string;
	source_account: ExternalAccountDetails;
	destination_account: ExternalAccountDetails;
	scheduled_date?: string;
}

export interface TransferStatusResponse {
	transfer_id?: string;
	amount?: number;
	currency?: string;
	description?: string;
	status?: string;
	reference_number?: string;
	error_message?: string;
	initiated_date?: string;
	completed_date?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
	const v = record[key];
	return typeof v === 'string' ? v : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
	const v = record[key];
	return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function parseAccountSummary(raw: unknown): AccountSummary | null {
	if (!isRecord(raw)) return null;
	const account_id = readString(raw, 'account_id');
	const account_number = readString(raw, 'account_number');
	const account_holder_name = readString(raw, 'account_holder_name');
	const account_type = readString(raw, 'account_type');
	const account_status = readString(raw, 'account_status');
	const balance = readNumber(raw, 'balance');
	const currency = readString(raw, 'currency') ?? 'USD';
	if (!account_id || !account_number || !account_holder_name || !account_type || !account_status) {
		return null;
	}
	if (balance === undefined) return null;
	return {
		account_id,
		account_number,
		account_holder_name,
		account_type,
		account_status,
		balance,
		currency,
		opened_date: readString(raw, 'opened_date'),
		routing_number: readString(raw, 'routing_number')
	};
}

export function parseAccountListResponse(raw: unknown): AccountListResponse {
	if (!isRecord(raw) || !Array.isArray(raw.accounts)) {
		throw new Error('Invalid account list response');
	}
	const accounts = raw.accounts
		.map(parseAccountSummary)
		.filter((a): a is AccountSummary => a !== null);
	return { accounts, pagination: isRecord(raw.pagination) ? (raw.pagination as PaginationInfo) : undefined };
}

/** Normalize list/detail/wrapped transfer JSON before parsing. */
export function coalesceTransferPayload(raw: unknown): unknown {
	if (!isRecord(raw)) return raw;
	if (readString(raw, 'transfer_id')) return raw;
	const nested = raw.transfer;
	if (isRecord(nested) && readString(nested, 'transfer_id')) return nested;
	return raw;
}

export function parseTransferSummary(raw: unknown): TransferSummary | null {
	const payload = coalesceTransferPayload(raw);
	if (!isRecord(payload)) return null;
	const transfer_id = readString(payload, 'transfer_id');
	const amount = readNumber(payload, 'amount');
	const currency = readString(payload, 'currency') ?? 'USD';
	if (!transfer_id || amount === undefined) return null;

	const mapAccount = (key: 'source_account' | 'destination_account') => {
		const acct = payload[key];
		if (!isRecord(acct)) return undefined;
		const account_number =
			readString(acct, 'account_number')?.trim() ||
			readString(acct, 'accountNumber')?.trim() ||
			undefined;
		const routing_number = readString(acct, 'routing_number')?.trim();
		const account_holder_name = readString(acct, 'account_holder_name')?.trim();
		const account_type = readString(acct, 'account_type')?.trim();
		const institution_name = readString(acct, 'institution_name')?.trim();
		if (
			!account_number &&
			!routing_number &&
			!account_holder_name &&
			!account_type &&
			!institution_name
		) {
			return undefined;
		}
		return { account_number, routing_number, account_holder_name, account_type, institution_name };
	};

	return {
		transfer_id,
		amount,
		currency,
		description: readString(payload, 'description'),
		status: readString(payload, 'status'),
		direction: readString(payload, 'direction'),
		initiated_date: readString(payload, 'initiated_date'),
		completed_date: readString(payload, 'completed_date'),
		reference_number: readString(payload, 'reference_number'),
		transfer_type: readString(payload, 'transfer_type'),
		source_account: mapAccount('source_account'),
		destination_account: mapAccount('destination_account')
	};
}

export function parseTransferListResponse(raw: unknown): TransferListResponse {
	if (!isRecord(raw) || !Array.isArray(raw.transfers)) {
		return { transfers: [] };
	}
	const transfers = raw.transfers
		.map(parseTransferSummary)
		.filter((t): t is TransferSummary => t !== null);
	return { transfers, pagination: isRecord(raw.pagination) ? (raw.pagination as PaginationInfo) : undefined };
}
