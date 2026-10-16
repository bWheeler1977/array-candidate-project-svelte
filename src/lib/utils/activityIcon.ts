/**
 * Maps activity row titles to Figma asset icons under `src/lib/assets/`.
 * Transfers always use `bank`; mock merchant rows use cart / briefcase / etc.
 */
export const ACTIVITY_ICON_KINDS = [
	'bank',
	'money-bag',
	'briefcase',
	'hot-beverage',
	'shopping-cart'
] as const;

export type ActivityIconKind = (typeof ACTIVITY_ICON_KINDS)[number];

function normalizedTitle(title: string): string {
	return title.trim().toLowerCase();
}

export function resolveActivityIconKind(options: {
	title: string;
	source?: 'mock' | 'transfer';
	isInternalTransfer?: boolean;
}): ActivityIconKind {
	const { title, source, isInternalTransfer } = options;
	const t = normalizedTitle(title);

	if (source === 'transfer' || isInternalTransfer || /\btransfer\b/.test(t)) {
		return 'bank';
	}

	if (/\b(interest|dividend|maturity|cd interest)\b/.test(t)) {
		return 'money-bag';
	}

	if (/\b(salary|payroll|paycheck)\b/.test(t)) {
		return 'briefcase';
	}

	if (/\bcoffee\b/.test(t)) {
		return 'hot-beverage';
	}

	return 'shopping-cart';
}
