import { describe, expect, it } from 'vitest';
import { sampleDomainsLookup } from './domainsLookup';
import { transferListTitle } from './transferDisplay';
import {
	applyTransferEndpointHint,
	findHintForTransfer,
	normalizeMisfiledOutboundTransfer,
	type TransferEndpointHint
} from './transferEndpointHints';
import { makeAccount, makeTransfer } from '../test/fixtures';

describe('transferEndpointHints', () => {
	const savings = makeAccount({
		account_id: 'sv',
		account_number: 'UG0RYK-SV-010',
		account_type: 'SAVINGS'
	});
	const checking = makeAccount({
		account_id: 'ch',
		account_number: 'UG0RYK-CH-009',
		account_type: 'CHECKING'
	});
	const accounts = [checking, savings];

	const hint: TransferEndpointHint = {
		transferId: 'tid-1',
		referenceNumber: 'NW-ABC',
		fromAccountId: 'sv',
		toAccountId: 'ch',
		amount: 325.44,
		recordedAt: '2026-10-15T14:51:00.000Z'
	};

	it('matches hint by transfer_id', () => {
		const transfer = makeTransfer({ transfer_id: 'tid-1', amount: 325.44 });
		expect(findHintForTransfer(transfer, [hint])).toEqual(hint);
	});

	it('moves misfiled destination account to source for outbound sandbox rows', () => {
		const transfer = makeTransfer({
			transfer_id: 'bad-1',
			direction: 'OUTBOUND',
			amount: 325.44,
			source_account: { routing_number: '002772901', institution_name: 'Northwind Bank' },
			destination_account: {
				account_number: 'UG0RYK-SV-010',
				routing_number: '003477805',
				account_holder_name: 'Robert Thompson'
			}
		});
		const normalized = normalizeMisfiledOutboundTransfer(transfer, accounts);
		expect(normalized.source_account?.account_number).toBe('UG0RYK-SV-010');
		expect(normalized.destination_account?.account_number).toBeUndefined();
		expect(transferListTitle(normalized, accounts, sampleDomainsLookup())).toMatch(/From .*Savings/i);
	});

	it('overrides swapped API account refs for display', () => {
		const transfer = makeTransfer({
			transfer_id: 'tid-1',
			amount: 325.44,
			initiated_date: '2026-10-15T18:00:00Z',
			source_account: { account_number: 'UG0RYK-CH-009' },
			destination_account: { account_number: 'UG0RYK-SV-010' }
		});
		const fixed = applyTransferEndpointHint(transfer, accounts, hint);
		expect(fixed.source_account?.account_number).toBe('UG0RYK-SV-010');
		expect(fixed.destination_account?.account_number).toBe('UG0RYK-CH-009');
	});
});
