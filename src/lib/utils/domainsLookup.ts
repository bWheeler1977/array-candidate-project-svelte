import type { DomainValue, NorthwindDomainsResponse } from '$lib/types/domains';
import { messages } from '$lib/i18n';

/**
 * NorthWind returns domain **codes** on resource payloads (e.g. `account_type: "CHECKING"`,
 * `account_status: "ACTIVE"` from `/external/accounts`) and human copy on `/domains`
 * (`code`, `display_name`, `description`). We normalize API values and look up by `code`.
 */

export interface DomainsLookup {
	labelAccountType(type: string | undefined): string;
	compactAccountType(type: string | undefined): string;
	accountTypeDescription(type: string | undefined): string | undefined;
	labelAccountStatus(status: string | undefined): string;
	accountStatusDescription(status: string | undefined): string | undefined;
	labelTransferStatus(status: string | undefined): string;
	labelTransferType(code: string | undefined): string;
	transferTypeDescription(code: string | undefined): string | undefined;
	labelDirection(code: string | undefined): string;
}

function titleCaseFallback(value: string): string {
	return value
		.split(/[\s_-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');
}

export function normalizeDomainCode(value: string): string {
	return value.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function buildIndex(values: DomainValue[]): Map<string, DomainValue> {
	const map = new Map<string, DomainValue>();
	for (const entry of values) {
		map.set(normalizeDomainCode(entry.code), entry);
	}
	return map;
}

function resolveDomainCode(
	apiValue: string | undefined,
	index: Map<string, DomainValue>
): string | undefined {
	if (!apiValue?.trim()) return undefined;
	const normalized = normalizeDomainCode(apiValue);
	if (index.has(normalized)) return normalized;

	const needle = apiValue.trim().toLowerCase().replace(/[\s_-]+/g, '');
	for (const [code, entry] of index) {
		const codeNeedle = code.toLowerCase().replace(/_/g, '');
		const displayNeedle = entry.display_name.toLowerCase().replace(/[\s_-]+/g, '');
		if (
			codeNeedle === needle ||
			codeNeedle.includes(needle) ||
			needle.includes(codeNeedle) ||
			displayNeedle.includes(needle)
		) {
			return code;
		}
	}
	return undefined;
}

function labelFromIndex(
	apiValue: string | undefined,
	index: Map<string, DomainValue>,
	fallbackPrefix: string
): string {
	if (!apiValue?.trim()) return fallbackPrefix;
	const code = resolveDomainCode(apiValue, index);
	if (code) return index.get(code)!.display_name;
	return titleCaseFallback(apiValue);
}

function descriptionFromIndex(
	apiValue: string | undefined,
	index: Map<string, DomainValue>
): string | undefined {
	const code = resolveDomainCode(apiValue, index);
	return code ? index.get(code)?.description : undefined;
}

function compactTypeLabel(displayName: string): string {
	const compact = displayName.replace(/\s+Account$/i, '').trim();
	return compact || displayName;
}

export function createDomainsLookup(response: NorthwindDomainsResponse | null): DomainsLookup {
	const accountTypes = buildIndex(response?.account_types ?? []);
	const accountStatuses = buildIndex(response?.account_statuses ?? []);
	const transferStatuses = buildIndex([
		...(response?.external_transfer_statuses ?? []),
		...(response?.transfer_statuses ?? [])
	]);
	const transferTypes = buildIndex(response?.transfer_types ?? []);
	const directions = buildIndex(response?.directions ?? []);

	return {
		labelAccountType: (type) =>
			labelFromIndex(type, accountTypes, messages.common.accountLabel),
		compactAccountType: (type) =>
			compactTypeLabel(labelFromIndex(type, accountTypes, messages.common.accountLabel)),
		accountTypeDescription: (type) => descriptionFromIndex(type, accountTypes),
		labelAccountStatus: (status) => labelFromIndex(status, accountStatuses, 'Unknown'),
		accountStatusDescription: (status) => descriptionFromIndex(status, accountStatuses),
		labelTransferStatus: (status) => labelFromIndex(status, transferStatuses, 'Unknown'),
		labelTransferType: (code) => labelFromIndex(code, transferTypes, 'Transfer'),
		transferTypeDescription: (code) => descriptionFromIndex(code, transferTypes),
		labelDirection: (code) => labelFromIndex(code, directions, titleCaseFallback(code ?? ''))
	};
}

/** Shared domains payload for tests (matches NorthWind sandbox `/domains`). */
export function sampleNorthwindDomains(): NorthwindDomainsResponse {
	return {
		account_types: [
			{ code: 'CHECKING', display_name: 'Checking Account', description: 'Basic checking account with debit card access' },
			{ code: 'SAVINGS', display_name: 'Savings Account', description: 'Interest-bearing savings account' },
			{ code: 'CD', display_name: 'Certificate of Deposit', description: 'Time-locked account with higher interest rates' },
			{ code: 'LOAN', display_name: 'Loan Account', description: 'Credit account with negative balance' }
		],
		account_statuses: [
			{ code: 'ACTIVE', display_name: 'Active', description: 'Account is open and operational' },
			{ code: 'FROZEN', display_name: 'Frozen', description: 'Account is temporarily suspended' },
			{ code: 'CLOSED', display_name: 'Closed', description: 'Account has been closed' }
		],
		transfer_types: [
			{
				code: 'ACH',
				display_name: 'ACH Transfer',
				description: 'Automated Clearing House transfer (1-3 business days)',
				fee: 0.25,
				processing_days: 3
			}
		],
		external_transfer_statuses: [
			{ code: 'PENDING', display_name: 'Pending', description: 'Transfer initiated, waiting for processing' },
			{ code: 'PROCESSING', display_name: 'Processing', description: 'Transfer is being processed by external system' },
			{ code: 'COMPLETED', display_name: 'Completed', description: 'Transfer completed successfully' },
			{ code: 'FAILED', display_name: 'Failed', description: 'Transfer failed with error' }
		],
		directions: [
			{ code: 'INBOUND', display_name: 'Inbound' },
			{ code: 'OUTBOUND', display_name: 'Outbound' }
		]
	};
}

export function sampleDomainsLookup(): DomainsLookup {
	return createDomainsLookup(sampleNorthwindDomains());
}
