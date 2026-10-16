import { describe, expect, it } from 'vitest';
import { resolveActivityIconKind } from './activityIcon';

describe('resolveActivityIconKind', () => {
	it('uses bank icon for transfers', () => {
		expect(resolveActivityIconKind({ title: 'Transfer to Savings', source: 'transfer' })).toBe(
			'bank'
		);
		expect(
			resolveActivityIconKind({ title: 'Transfer to Checking', isInternalTransfer: true })
		).toBe('bank');
	});

	it('maps mock titles from Figma examples', () => {
		expect(resolveActivityIconKind({ title: 'Grocery Store' })).toBe('shopping-cart');
		expect(resolveActivityIconKind({ title: 'Salary Deposit' })).toBe('briefcase');
		expect(resolveActivityIconKind({ title: 'Coffee Shop' })).toBe('hot-beverage');
		expect(resolveActivityIconKind({ title: 'Interest Payment' })).toBe('money-bag');
	});

	it('maps other mock users', () => {
		expect(resolveActivityIconKind({ title: 'Dividend' })).toBe('money-bag');
		expect(resolveActivityIconKind({ title: 'Home Supply Store' })).toBe('shopping-cart');
		expect(resolveActivityIconKind({ title: 'Gas Station' })).toBe('shopping-cart');
		expect(resolveActivityIconKind({ title: 'CD Maturity Interest' })).toBe('money-bag');
	});
});
