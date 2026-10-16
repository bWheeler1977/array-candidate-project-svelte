import type { AccountSummary, TransferSummary } from '$lib/types/northwind';

export function makeAccount(overrides: Partial<AccountSummary> = {}): AccountSummary {
	return {
		account_id: 'acct-checking-1',
		account_number: '1000000000001',
		account_holder_name: 'John Smith',
		account_type: 'CHECKING',
		account_status: 'ACTIVE',
		balance: 2500,
		currency: 'USD',
		...overrides
	};
}

export function makeTransfer(overrides: Partial<TransferSummary> = {}): TransferSummary {
	return {
		transfer_id: 'transfer-1',
		amount: 100,
		currency: 'USD',
		source_account: { account_number: '1000000000001' },
		destination_account: { account_number: '1000000000002' },
		initiated_date: new Date().toISOString(),
		...overrides
	};
}
