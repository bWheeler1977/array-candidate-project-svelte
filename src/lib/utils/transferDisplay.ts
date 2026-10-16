/**
 * Human-readable transfer and account labels for activity lists. Uses `/domains` for names
 * when an account row is matched by account_number; never invents a counterparty account.
 */
import { accountProductName } from './account';
import type { DomainsLookup } from './domainsLookup';
import { accountNumberVisibleSuffix, formatShortDate, formatSignedCurrency } from './format';
import type { AccountSummary, TransferAccountRef, TransferSummary } from '$lib/types/northwind';
import { msg, messages } from '$lib/i18n';

const accountFallback = () => messages.common.accountLabel;
const transferFallback = () => messages.common.accountTransferFallback;

function digitsOnly(value: string): string {
	return value.replace(/\D/g, '');
}

export function findAccountByNumber(
	accounts: AccountSummary[],
	accountNumber: string | undefined
): AccountSummary | undefined {
	const raw = accountNumber?.trim();
	if (!raw) return undefined;

	const exact = accounts.find((a) => a.account_number === raw);
	if (exact) return exact;

	const digits = digitsOnly(raw);
	if (!digits) return undefined;

	const digitMatch = accounts.find((a) => {
		const accountDigits = digitsOnly(a.account_number);
		if (!accountDigits) return false;
		return (
			accountDigits === digits ||
			accountDigits.endsWith(digits) ||
			digits.endsWith(accountDigits)
		);
	});
	if (digitMatch) return digitMatch;

	const suffix = accountNumberVisibleSuffix(raw);
	if (!suffix) return undefined;

	const suffixMatches = accounts.filter(
		(a) => accountNumberVisibleSuffix(a.account_number) === suffix
	);
	return suffixMatches.length === 1 ? suffixMatches[0] : undefined;
}

function normalizeRoutingNumber(value: string): string {
	return value.replace(/\D/g, '') || value.trim();
}

/** Match holder account when list/detail transfers omit account_number but include routing_number. */
export function findAccountByRoutingNumber(
	accounts: AccountSummary[],
	routingNumber: string | undefined
): AccountSummary | undefined {
	const raw = routingNumber?.trim();
	if (!raw) return undefined;

	const normalized = normalizeRoutingNumber(raw);
	const matches = accounts.filter((account) => {
		const accountRouting = account.routing_number?.trim();
		if (!accountRouting) return false;
		return (
			accountRouting === raw ||
			normalizeRoutingNumber(accountRouting) === normalized
		);
	});

	return matches.length === 1 ? matches[0] : undefined;
}

export function findAccountForTransferSide(
	accounts: AccountSummary[],
	side: TransferAccountRef | undefined
): AccountSummary | undefined {
	if (!side) return undefined;
	return (
		findAccountByNumber(accounts, side.account_number) ??
		findAccountByRoutingNumber(accounts, side.routing_number)
	);
}

function accountLabelFromSide(
	accounts: AccountSummary[],
	side: TransferAccountRef | undefined,
	domains: DomainsLookup
): string {
	const match = findAccountForTransferSide(accounts, side);
	if (match) return accountProductName(match, domains);

	const accountNumber = side?.account_number?.trim();

	const typeLabel = side?.account_type ? domains.labelAccountType(side.account_type) : undefined;
	if (typeLabel && typeLabel !== accountFallback()) return typeLabel;

	if (accountNumber) {
		const last4 = digitsOnly(accountNumber).slice(-4) || accountNumber.slice(-4);
		return last4 ? msg(messages.formats.maskedAccountSuffix, { last4 }) : accountFallback();
	}

	return '';
}

export function accountLabelForNumber(
	accounts: AccountSummary[],
	accountNumber: string | undefined,
	domains: DomainsLookup
): string {
	return accountLabelFromSide(accounts, { account_number: accountNumber }, domains) || accountFallback();
}

export function transferSourceLabel(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	const label = accountLabelFromSide(accounts, transfer.source_account, domains);
	return label || accountFallback();
}

export function transferDestinationLabel(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	return accountLabelFromSide(accounts, transfer.destination_account, domains) || accountFallback();
}

export function transferActivityAmount(transfer: TransferSummary): number {
	const direction = (transfer.direction ?? '').toUpperCase();
	if (direction === 'OUTBOUND') return -Math.abs(transfer.amount);
	if (direction === 'INBOUND') return Math.abs(transfer.amount);
	return transfer.amount;
}

/** Match transfer endpoints to holder accounts (account_number, else routing_number). */
export function matchTransferUserAccounts(
	transfer: TransferSummary,
	accounts: AccountSummary[]
): { source?: AccountSummary; destination?: AccountSummary } {
	return {
		source: findAccountForTransferSide(accounts, transfer.source_account),
		destination: findAccountForTransferSide(accounts, transfer.destination_account)
	};
}

/** Signed amount for Recent Activity when filtered to a single account. */
export function transferSignedAmountForAccount(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	accountId: string
): number {
	const amount = Math.abs(transfer.amount);
	const { source, destination } = matchTransferUserAccounts(transfer, accounts);

	if (destination?.account_id === accountId && source?.account_id !== accountId) {
		return amount;
	}
	if (source?.account_id === accountId && destination?.account_id !== accountId) {
		return -amount;
	}

	return transferActivityAmount(transfer);
}

export function transferActivityDate(transfer: TransferSummary): string {
	return formatShortDate(transfer.completed_date ?? transfer.initiated_date);
}

export function transferRouteLabel(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	const from = transferSourceLabel(transfer, accounts, domains);
	const to = transferDestinationLabel(transfer, accounts, domains);
	return `${from} → ${to}`;
}

export function transferListTitle(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	const toName = transferDestinationLabel(transfer, accounts, domains);
	if (toName && toName !== accountFallback()) {
		return msg(messages.transfers.recent.listTitleTo, { destination: toName });
	}
	const fromName = transferSourceLabel(transfer, accounts, domains);
	if (
		fromName &&
		fromName !== accountFallback() &&
		(transfer.direction ?? '').toUpperCase() === 'OUTBOUND'
	) {
		return msg(messages.transfers.recent.listTitleFrom, { source: fromName });
	}
	const description = transfer.description?.trim();
	if (description) return description;
	return transferFallback();
}

export function transferAmountLabel(transfer: TransferSummary): string {
	return formatSignedCurrency(transferActivityAmount(transfer), transfer.currency);
}

export function isInternalTransferBetweenUserAccounts(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): boolean {
	const source = findAccountForTransferSide(accounts, transfer.source_account);
	const destination = findAccountForTransferSide(accounts, transfer.destination_account);
	if (source && destination) return true;

	const fallback = accountFallback();
	return (
		transferSourceLabel(transfer, accounts, domains) !== fallback &&
		transferDestinationLabel(transfer, accounts, domains) !== fallback
	);
}

/** Recent Activity title for outbound transfers to another of the user's accounts. */
export function transferToAccountTitle(account: AccountSummary, domains: DomainsLookup): string {
	return msg(messages.activity.transferTo, {
		destination: accountProductName(account, domains)
	});
}

/** Accounts page Recent Activity row title (account types from `/domains`). */
export function transferActivityTitle(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	const destination = transferDestinationLabel(transfer, accounts, domains);
	if (destination !== accountFallback()) {
		return msg(messages.activity.transferTo, { destination });
	}

	const description = transfer.description?.trim();
	const prefix = messages.formats.transferDescriptionPrefix;
	if (description && !new RegExp(`^${prefix}\\s`, 'i').test(description)) {
		return description;
	}

	return domains.labelTransferType(transfer.transfer_type) || transferFallback();
}

/** Accounts page meta suffix after date (non-internal / unknown source). */
export function transferActivityMetaDetail(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	const direction = (transfer.direction ?? '').toUpperCase();
	const fallback = accountFallback();
	if (direction === 'INBOUND') {
		const inbound = transferDestinationLabel(transfer, accounts, domains);
		if (inbound !== fallback) return inbound;
	}

	const outbound = transferSourceLabel(transfer, accounts, domains);
	if (outbound !== fallback) return outbound;

	const institution = transfer.source_account?.institution_name?.trim();
	if (institution) return institution;

	// Title already names the destination; avoid repeating it in meta (misreads as same-account transfer).
	return messages.activity.sourceUnavailable;
}

/** Recent Activity + Recent Transfers meta: “From …” when source is known, else Figma “Internal transfer”. */
export function transferActivityMeta(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	const date = transferActivityDate(transfer);
	const source = transferSourceDisplayName(transfer, accounts, domains);
	if (source) {
		return msg(messages.activity.metaFromAccount, { date, source });
	}

	if (isInternalTransferBetweenUserAccounts(transfer, accounts, domains)) {
		const detail =
			domains.labelTransferType(transfer.transfer_type) || messages.activity.internalTransfer;
		return msg(messages.activity.metaWithDetail, { date, detail });
	}

	return msg(messages.activity.metaWithDetail, {
		date,
		detail: transferActivityMetaDetail(transfer, accounts, domains)
	});
}

/**
 * Account ids this transfer should appear under when filtering Recent Activity
 * (both endpoints when matched; infers the other account when API omits one number).
 */
export function transferLinkedAccountIds(
	transfer: TransferSummary,
	accounts: AccountSummary[]
): string[] {
	const matched = matchTransferUserAccounts(transfer, accounts);
	const ids: string[] = [];
	if (matched.source) ids.push(matched.source.account_id);
	if (matched.destination && !ids.includes(matched.destination.account_id)) {
		ids.push(matched.destination.account_id);
	}
	if (matched.source && matched.destination) return ids;

	if (matched.destination && !matched.source) {
		const sourceRouting = transfer.source_account?.routing_number?.trim();
		if (!sourceRouting) {
			const others = accounts.filter(
				(account) => account.account_id !== matched.destination!.account_id
			);
			if (others.length === 1) ids.push(others[0].account_id);
		}
	} else if (matched.source && !matched.destination) {
		const others = accounts.filter((account) => account.account_id !== matched.source!.account_id);
		if (others.length === 1) ids.push(others[0].account_id);
	}

	return ids;
}

/** Display name for transfer source (Recent Activity / Recent Transfers meta). */
export function transferSourceDisplayName(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	const fallback = accountFallback();
	const matched = matchTransferUserAccounts(transfer, accounts);
	if (matched.source) return accountProductName(matched.source, domains);

	if (matched.destination) {
		const sourceRouting = transfer.source_account?.routing_number?.trim();
		// Sandbox list rows sometimes include a routing that does not match any holder account;
		// do not guess the other account in that case (Robert has 3 accounts + mismatched routing).
		if (!sourceRouting) {
			const otherAccounts = accounts.filter(
				(account) => account.account_id !== matched.destination!.account_id
			);
			if (otherAccounts.length === 1) {
				return accountProductName(otherAccounts[0], domains);
			}
		}
	}

	const destinationLabel = transferDestinationLabel(transfer, accounts, domains);
	const sideLabel = accountLabelFromSide(accounts, transfer.source_account, domains);
	if (sideLabel && sideLabel !== fallback && sideLabel !== destinationLabel) {
		return sideLabel;
	}

	return '';
}

export function transferRecentListMeta(
	transfer: TransferSummary,
	accounts: AccountSummary[],
	domains: DomainsLookup
): string {
	const date = transferActivityDate(transfer);
	const source = transferSourceDisplayName(transfer, accounts, domains);
	if (source) {
		return msg(messages.activity.metaFromAccount, { date, source });
	}
	const detail =
		isInternalTransferBetweenUserAccounts(transfer, accounts, domains)
			? domains.labelTransferType(transfer.transfer_type) || messages.activity.internalTransfer
			: transferActivityMetaDetail(transfer, accounts, domains);
	return msg(messages.activity.metaWithDetail, { date, detail });
}
