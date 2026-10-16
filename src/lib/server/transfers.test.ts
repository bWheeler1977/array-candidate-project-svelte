import { afterEach, describe, expect, it, vi } from 'vitest';
import * as northwind from './northwind';
import { hydrateTransfersForDisplay } from './transfers';
import { makeTransfer } from '../test/fixtures';

describe('hydrateTransfersForDisplay', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('fills missing source account numbers from transfer detail', async () => {
		const sparse = makeTransfer({
			transfer_id: 'uuid-1',
			source_account: { account_holder_name: 'John Smith' },
			destination_account: { account_number: '1000000000002' }
		});

		vi.spyOn(northwind, 'northwindGet').mockResolvedValue({
			transfer_id: 'uuid-1',
			amount: 500,
			source_account: { account_number: '1000000000001', account_holder_name: 'John Smith' },
			destination_account: { account_number: '1000000000002' }
		});

		const [hydrated] = await hydrateTransfersForDisplay([sparse]);
		expect(hydrated.source_account?.account_number).toBe('1000000000001');
		expect(hydrated.destination_account?.account_number).toBe('1000000000002');
	});

	it('hydrates every transfer in the list', async () => {
		const transfers = [
			makeTransfer({
				transfer_id: 'a',
				source_account: { account_number: '1' },
				destination_account: undefined
			}),
			makeTransfer({
				transfer_id: 'b',
				source_account: undefined,
				destination_account: { account_number: '2' }
			})
		];
		const get = vi.spyOn(northwind, 'northwindGet').mockImplementation(async (path: string) => {
			if (path.endsWith('/b')) {
				return {
					transfer_id: 'b',
					amount: 1,
					source_account: { account_number: '2' },
					destination_account: { account_number: '9' }
				};
			}
			return {
				transfer_id: 'a',
				amount: 1,
				source_account: { account_number: '1' },
				destination_account: { account_number: '8' }
			};
		});

		await hydrateTransfersForDisplay(transfers);
		expect(get).toHaveBeenCalledTimes(2);
	});
});
