/**
 * Account display helpers. Customer-facing type/status strings come from DomainsLookup
 * (API codes on the account row → /domains display_name). Active vs inactive is based on
 * the ACTIVE status code only—other statuses disable transfers but show their domain label.
 */
import type { DomainsLookup } from './domainsLookup';
import { normalizeDomainCode } from './domainsLookup';
import { formatAccountTransferLabel, maskAccountNumber } from './format';
import type { AccountSummary } from '$lib/types/northwind';
import { msg, messages } from '$lib/i18n';

export function normalizeAccountStatus(status: string): string {
	return status.trim().toLowerCase();
}

/** True when status code resolves to `ACTIVE` (see `/domains` → `account_statuses`). */
export function isAccountActive(account: AccountSummary): boolean {
	return normalizeAccountStatus(account.account_status) === 'active';
}

export function accountDisplayName(account: AccountSummary, domains: DomainsLookup): string {
	return account.account_holder_name.trim() || domains.labelAccountType(account.account_type);
}

/** Primary account title from `/domains` account_types.display_name. */
export function accountProductName(account: AccountSummary, domains: DomainsLookup): string {
	return domains.labelAccountType(account.account_type);
}

/** Short type pill (e.g. "Savings" from "Savings Account"). */
export function accountTypeBadge(account: AccountSummary, domains: DomainsLookup): string {
	return domains.compactAccountType(account.account_type);
}

export function accountStatusLabel(account: AccountSummary, domains: DomainsLookup): string {
	return domains.labelAccountStatus(account.account_status);
}

/** Primary label for transfers UI (account type from domains). */
export function accountTransferTitle(account: AccountSummary, domains: DomainsLookup): string {
	return domains.labelAccountType(account.account_type);
}

/** Figma transfer picker title (e.g. Everyday Checking...8821). */
export function accountTransferPickerProductName(
	account: AccountSummary,
	domains: DomainsLookup
): string {
	const code = normalizeDomainCode(account.account_type);
	const byCode: Record<string, string> = {
		CHECKING: messages.transfers.accountSelect.productChecking,
		SAVINGS: messages.transfers.accountSelect.productSavings,
		CD: messages.transfers.accountSelect.productCd,
		LOAN: messages.transfers.accountSelect.productLoan
	};
	return byCode[code] ?? domains.compactAccountType(account.account_type);
}

/** Dropdown / picker primary line — product name and last four digits. */
export function accountTransferPickerLabel(account: AccountSummary, domains: DomainsLookup): string {
	return formatAccountTransferLabel(
		accountTransferPickerProductName(account, domains),
		account.account_number
	);
}

export function inactiveAccountTransferHint(account: AccountSummary, domains: DomainsLookup): string {
	return msg(messages.accounts.inactiveTransferHint, {
		status: accountStatusLabel(account, domains)
	});
}

export function sumAccountBalances(accounts: AccountSummary[]): number {
	return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function balanceTone(balance: number, accountType: string): 'negative' | 'default' {
	const type = accountType.toLowerCase();
	if (balance < 0) return 'negative';
	if (type.includes('credit') || type.includes('loan')) return 'negative';
	return 'default';
}
