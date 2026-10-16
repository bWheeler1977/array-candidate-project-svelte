const DEFAULT_LOCALE =
	typeof Intl !== 'undefined' ? Intl.NumberFormat().resolvedOptions().locale : 'en-US';

const moneyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD'
});

function resolveLocale(locale?: string): string {
	return locale?.trim() || DEFAULT_LOCALE;
}

export function formatCurrency(amount: number, currency = 'USD', locale?: string): string {
	const loc = resolveLocale(locale);
	try {
		return new Intl.NumberFormat(loc, { style: 'currency', currency }).format(amount);
	} catch {
		return moneyFormatter.format(amount);
	}
}

/** Decimal string for amount inputs after blur (grouping + two fraction digits, no symbol). */
export function formatAmountInputValue(
	amount: number,
	currency: string,
	locale?: string
): string {
	const loc = resolveLocale(locale);
	try {
		return new Intl.NumberFormat(loc, {
			style: 'decimal',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	} catch {
		return amount.toFixed(2);
	}
}

export interface CurrencyInputAffix {
	symbol: string;
	position: 'prefix' | 'suffix';
}

/** Symbol and placement for currency inputs (follows user locale + ISO currency code). */
export function currencyInputAffix(currency: string, locale?: string): CurrencyInputAffix {
	const loc = resolveLocale(locale);
	try {
		const parts = new Intl.NumberFormat(loc, {
			style: 'currency',
			currency
		}).formatToParts(12);
		const currencyIndex = parts.findIndex((part) => part.type === 'currency');
		const integerIndex = parts.findIndex((part) => part.type === 'integer');
		const symbol = parts[currencyIndex]?.value?.trim() || currency;
		const position: 'prefix' | 'suffix' =
			currencyIndex >= 0 && integerIndex >= 0 && currencyIndex < integerIndex ? 'prefix' : 'suffix';
		return { symbol, position };
	} catch {
		return { symbol: currency, position: 'prefix' };
	}
}

/** Figma success modal: whole dollars omit cents when .00 */
export function formatTransferModalAmount(amount: number, currency = 'USD'): string {
	if (currency !== 'USD') return formatCurrency(amount, currency);
	if (Number.isFinite(amount) && Math.round(amount * 100) % 100 === 0) {
		return `$${Math.round(amount).toLocaleString('en-US')}`;
	}
	return formatCurrency(amount, currency);
}

export function formatSignedCurrency(amount: number, currency = 'USD'): string {
	const formatted = formatCurrency(Math.abs(amount), currency);
	if (amount > 0) return `+${formatted}`;
	if (amount < 0) return `-${formatted}`;
	return formatted;
}

/** Unmasked tail of the account number (same rules as account cards). */
export function accountNumberVisibleSuffix(accountNumber: string): string {
	const trimmed = accountNumber.trim();
	const lastDash = trimmed.lastIndexOf('-');
	const lastSpace = trimmed.lastIndexOf(' ');
	const splitAt = Math.max(lastDash, lastSpace);

	let suffix = splitAt === -1 ? trimmed : trimmed.slice(splitAt + 1);
	suffix = suffix.trim();
	if (suffix.length > 4) {
		suffix = suffix.slice(-4);
	}

	return suffix;
}

export function maskAccountNumber(accountNumber: string): string {
	return `**** ${accountNumberVisibleSuffix(accountNumber)}`;
}

/** Figma transfer picker: Everyday Checking...8821 (suffix matches Accounts masking). */
export function formatAccountTransferLabel(displayName: string, accountNumber: string): string {
	const suffix = accountNumberVisibleSuffix(accountNumber);
	return suffix ? `${displayName}...${suffix}` : displayName;
}

export function formatShortDate(iso: string | undefined): string {
	if (!iso) return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatLongDate(iso: string | undefined): string {
	if (!iso) return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
