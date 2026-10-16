/**
 * Transfer form validation and initiate payload builder. Shared by client and server action.
 * Only validates what the UI can know (active accounts, balance, amount)—not bank product
 * rules (e.g. CD outbound transfers); those come from the API and are shown via error modal.
 */
import { isAccountActive } from './account';
import type { AccountSummary, TransferRequest } from '$lib/types/northwind';
import { msg, messages } from '$lib/i18n';

const v = messages.transfers.validation;

export interface TransferFormValues {
	fromAccountId: string;
	toAccountId: string;
	amount: string;
	reference: string;
}

export interface TransferFormErrors {
	fromAccountId?: string;
	toAccountId?: string;
	amount?: string;
	reference?: string;
	form?: string;
}

export function findAccount(accounts: AccountSummary[], accountId: string): AccountSummary | undefined {
	return accounts.find((a) => a.account_id === accountId);
}

/** Active accounts with balance available to send from. */
export function isEligibleFromAccount(account: AccountSummary): boolean {
	return isAccountActive(account) && account.balance > 0;
}

/** Active accounts that can receive transfers (balance may be negative). */
export function isEligibleToAccount(account: AccountSummary): boolean {
	return isAccountActive(account);
}

/** All accounts for dropdown display (inactive included); caller excludes the other field. */
export function accountsForFromDropdown(
	accounts: AccountSummary[],
	excludeAccountId: string
): AccountSummary[] {
	return accounts.filter((account) => account.account_id !== excludeAccountId);
}

export function accountsForToDropdown(
	accounts: AccountSummary[],
	excludeAccountId: string
): AccountSummary[] {
	return accounts.filter((account) => account.account_id !== excludeAccountId);
}

export function isSelectableFromAccount(account: AccountSummary): boolean {
	return isEligibleFromAccount(account);
}

export function isSelectableToAccount(account: AccountSummary): boolean {
	return isEligibleToAccount(account);
}

export function validateTransferForm(
	values: TransferFormValues,
	accounts: AccountSummary[]
): TransferFormErrors {
	const errors: TransferFormErrors = {};
	const from = findAccount(accounts, values.fromAccountId);
	const to = findAccount(accounts, values.toAccountId);

	if (!values.fromAccountId) {
		errors.fromAccountId = v.fromRequired;
	} else if (from && !isEligibleFromAccount(from)) {
		errors.fromAccountId = v.fromInactive;
	}

	if (!values.toAccountId) {
		errors.toAccountId = v.toRequired;
	} else if (to && !isEligibleToAccount(to)) {
		errors.toAccountId = v.toInactive;
	}

	if (values.fromAccountId && values.toAccountId && values.fromAccountId === values.toAccountId) {
		errors.toAccountId = v.sameAccount;
	}

	const amount = parseAmount(values.amount);
	if (values.amount.trim() === '') {
		errors.amount = v.amountRequired;
	} else if (amount === null) {
		errors.amount = v.amountInvalid;
	} else if (amount <= 0) {
		errors.amount = v.amountZero;
	} else if (from && amount > from.balance) {
		errors.amount = v.amountOverBalance;
	}

	const reference = values.reference.trim();
	if (reference.length > 100) {
		errors.reference = v.referenceTooLong;
	}

	return errors;
}

export function hasTransferFormErrors(errors: TransferFormErrors): boolean {
	return Object.keys(errors).length > 0;
}

export function parseAmount(raw: string): number | null {
	const normalized = raw.replace(/,/g, '').trim();
	if (!normalized) return null;
	const value = Number(normalized);
	return Number.isFinite(value) ? value : null;
}

export function buildTransferRequest(
	values: TransferFormValues,
	accounts: AccountSummary[]
): TransferRequest | null {
	const errors = validateTransferForm(values, accounts);
	if (hasTransferFormErrors(errors)) return null;

	const from = findAccount(accounts, values.fromAccountId);
	const to = findAccount(accounts, values.toAccountId);
	const amount = parseAmount(values.amount);
	if (!from || !to || amount === null) return null;

	const reference = values.reference.trim() || generateReferenceNumber();
	const description = reference
		? msg(messages.transfers.descriptionWithReference, { reference })
		: messages.common.accountTransferFallback;

	return {
		amount,
		currency: from.currency || 'USD',
		description,
		direction: 'OUTBOUND',
		reference_number: reference,
		transfer_type: 'ACH',
		source_account: toExternalAccount(from),
		destination_account: toExternalAccount(to)
	};
}

function toExternalAccount(account: AccountSummary) {
	return {
		account_number: account.account_number,
		account_holder_name: account.account_holder_name,
		routing_number: account.routing_number ?? '',
		institution_name: messages.brand.institutionName
	};
}

function generateReferenceNumber(): string {
	const stamp = Date.now().toString(36).toUpperCase();
	return `NW-${stamp}`;
}

export function isTransferPreviewReady(values: TransferFormValues): boolean {
	return Boolean(values.fromAccountId && values.toAccountId && values.amount.trim());
}
