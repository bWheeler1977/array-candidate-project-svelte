/** Parsed shape of GET /domains — codes on account/transfer payloads map to these entries. */
export interface DomainValue {
	code: string;
	display_name: string;
	description?: string;
}

export interface TransferTypeDomainValue extends DomainValue {
	fee?: number;
	processing_days?: number;
	min_amount?: number;
	max_amount?: number;
	is_reversible?: boolean;
}

export interface NorthwindDomainsResponse {
	account_types?: DomainValue[];
	account_statuses?: DomainValue[];
	transfer_types?: TransferTypeDomainValue[];
	transfer_statuses?: DomainValue[];
	external_transfer_statuses?: DomainValue[];
	transaction_types?: DomainValue[];
	transaction_statuses?: DomainValue[];
	directions?: DomainValue[];
	integration_statuses?: DomainValue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
	const v = record[key];
	return typeof v === 'string' ? v.trim() : undefined;
}

function parseDomainValue(raw: unknown): DomainValue | null {
	if (!isRecord(raw)) return null;
	const code = readString(raw, 'code');
	const display_name = readString(raw, 'display_name');
	if (!code || !display_name) return null;
	return {
		code,
		display_name,
		description: readString(raw, 'description')
	};
}

function parseTransferTypeValue(raw: unknown): TransferTypeDomainValue | null {
	const base = parseDomainValue(raw);
	if (!base || !isRecord(raw)) return null;
	const fee = raw.fee;
	return {
		...base,
		fee: typeof fee === 'number' && Number.isFinite(fee) ? fee : undefined,
		processing_days:
			typeof raw.processing_days === 'number' && Number.isFinite(raw.processing_days)
				? raw.processing_days
				: undefined
	};
}

function parseDomainList(raw: unknown): DomainValue[] {
	if (!Array.isArray(raw)) return [];
	return raw.map(parseDomainValue).filter((item): item is DomainValue => item !== null);
}

function parseTransferTypeList(raw: unknown): TransferTypeDomainValue[] {
	if (!Array.isArray(raw)) return [];
	return raw.map(parseTransferTypeValue).filter((item): item is TransferTypeDomainValue => item !== null);
}

export function parseDomainsResponse(raw: unknown): NorthwindDomainsResponse | null {
	if (!isRecord(raw)) return null;
	return {
		account_types: parseDomainList(raw.account_types),
		account_statuses: parseDomainList(raw.account_statuses),
		transfer_types: parseTransferTypeList(raw.transfer_types),
		transfer_statuses: parseDomainList(raw.transfer_statuses),
		external_transfer_statuses: parseDomainList(raw.external_transfer_statuses),
		transaction_types: parseDomainList(raw.transaction_types),
		transaction_statuses: parseDomainList(raw.transaction_statuses),
		directions: parseDomainList(raw.directions),
		integration_statuses: parseDomainList(raw.integration_statuses)
	};
}
