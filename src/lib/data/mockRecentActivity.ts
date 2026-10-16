/**
 * Mock recent activity — NorthWind has no transactions/activity API.
 *
 * Used ONLY for the Accounts “Recent Activity” panel (Transfers page uses API data only).
 * Rows are keyed by API `account_holder_name`. Internal transfer mocks set
 * `transferToAccountTypeMatch` so titles/meta use the same /domains labels as real transfers.
 * Dates use `daysAgo` (0–30) so mocks stay “recent” on every page load without stale fixed dates.
 */

export const MOCK_ACTIVITY_MAX_DAYS_AGO = 30;

export interface MockRecentActivityItem {
	id: string;
	/** Ignored when {@link isInternalTransfer} and {@link transferToAccountTypeMatch} are set. */
	title: string;
	/** Whole days before today (0 = today, max {@link MOCK_ACTIVITY_MAX_DAYS_AGO}). */
	daysAgo: number;
	/** Matched against account_type on the active user's accounts (substring). */
	accountTypeMatch: string;
	amount: number;
	currency?: string;
	/** When true, row is an internal move; title/meta resolved like API transfer rows. */
	isInternalTransfer?: boolean;
	/** Destination account type substring; paired with domains for “Transfer to …” title. */
	transferToAccountTypeMatch?: string;
}

/** Keyed by account_holder_name exactly as returned from the API. */
export const MOCK_RECENT_ACTIVITY_BY_USER: Record<string, MockRecentActivityItem[]> = {
	'John Smith': [
		{
			id: 'mock-john-1',
			title: 'Grocery Store',
			daysAgo: 2,
			accountTypeMatch: 'checking',
			amount: -82.45
		},
		{
			id: 'mock-john-2',
			title: 'Salary Deposit',
			daysAgo: 5,
			accountTypeMatch: 'checking',
			amount: 2800
		},
		{
			id: 'mock-john-3',
			title: 'Coffee Shop',
			daysAgo: 7,
			accountTypeMatch: 'checking',
			amount: -5.75
		},
		{
			id: 'mock-john-4',
			title: 'Interest Payment',
			daysAgo: 22,
			accountTypeMatch: 'savings',
			amount: 5.24
		},
		{
			id: 'mock-john-5',
			title: '',
			daysAgo: 12,
			accountTypeMatch: 'checking',
			amount: -250,
			isInternalTransfer: true,
			transferToAccountTypeMatch: 'savings'
		}
	],
	'Sarah Johnson': [
		{
			id: 'mock-sarah-1',
			title: 'Online Purchase',
			daysAgo: 3,
			accountTypeMatch: 'checking',
			amount: -124.99
		},
		{
			id: 'mock-sarah-2',
			title: 'Payroll Deposit',
			daysAgo: 6,
			accountTypeMatch: 'checking',
			amount: 3200
		},
		{
			id: 'mock-sarah-3',
			title: 'Savings Auto-Transfer',
			daysAgo: 11,
			accountTypeMatch: 'savings',
			amount: 200
		},
		{
			id: 'mock-sarah-4',
			title: 'Utility Bill',
			daysAgo: 18,
			accountTypeMatch: 'checking',
			amount: -89.5
		}
	],
	'Michael Davis': [
		{
			id: 'mock-michael-1',
			title: 'CD Interest',
			daysAgo: 4,
			accountTypeMatch: 'cd',
			amount: 42.18
		},
		{
			id: 'mock-michael-2',
			title: 'Restaurant',
			daysAgo: 9,
			accountTypeMatch: 'checking',
			amount: -67.2
		},
		{
			id: 'mock-michael-3',
			title: 'ATM Withdrawal',
			daysAgo: 25,
			accountTypeMatch: 'checking',
			amount: -100
		}
	],
	'Emily Wilson': [
		{
			id: 'mock-emily-1',
			title: 'Loan Payment',
			daysAgo: 1,
			accountTypeMatch: 'loan',
			amount: -350
		},
		{
			id: 'mock-emily-2',
			title: 'Paycheck',
			daysAgo: 8,
			accountTypeMatch: 'checking',
			amount: 1950
		},
		{
			id: 'mock-emily-3',
			title: 'Pharmacy',
			daysAgo: 14,
			accountTypeMatch: 'checking',
			amount: -28.4
		},
		{
			id: 'mock-emily-4',
			title: '',
			daysAgo: 16,
			accountTypeMatch: 'checking',
			amount: -250,
			isInternalTransfer: true,
			transferToAccountTypeMatch: 'savings'
		}
	],
	'Robert Thompson': [
		{
			id: 'mock-robert-1',
			title: 'Dividend',
			daysAgo: 2,
			accountTypeMatch: 'savings',
			amount: 18.6
		},
		{
			id: 'mock-robert-2',
			title: 'Home Supply Store',
			daysAgo: 10,
			accountTypeMatch: 'checking',
			amount: -156.32
		},
		{
			id: 'mock-robert-3',
			title: 'CD Maturity Interest',
			daysAgo: 28,
			accountTypeMatch: 'cd',
			amount: 95
		},
		{
			id: 'mock-robert-4',
			title: 'Gas Station',
			daysAgo: 20,
			accountTypeMatch: 'checking',
			amount: -48.17
		}
	]
};

/** Resolve a stable midday UTC timestamp for display/sort (local calendar day). */
export function mockActivityDateIso(daysAgo: number, now: Date = new Date()): string {
	const clamped = Math.min(
		MOCK_ACTIVITY_MAX_DAYS_AGO,
		Math.max(0, Math.floor(daysAgo))
	);
	const date = new Date(now);
	date.setHours(12, 0, 0, 0);
	date.setDate(date.getDate() - clamped);
	return date.toISOString();
}
