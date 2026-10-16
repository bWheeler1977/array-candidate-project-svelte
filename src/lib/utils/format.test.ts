import { describe, expect, it } from 'vitest';
import {
	currencyInputAffix,
	formatAccountTransferLabel,
	formatAmountInputValue,
	maskAccountNumber
} from './format';

describe('maskAccountNumber', () => {
	it('masks before the final hyphen and keeps the suffix as-is', () => {
		expect(maskAccountNumber('UG0RYK-CH-009')).toBe('**** 009');
		expect(maskAccountNumber('UG0RYK-SV-010')).toBe('**** 010');
		expect(maskAccountNumber('UG0RYK-CD-011')).toBe('**** 011');
	});

	it('uses the final space as the delimiter when it is last', () => {
		expect(maskAccountNumber('Everyday Checking 8821')).toBe('**** 8821');
	});

	it('shows at most four unmasked characters from the suffix', () => {
		expect(maskAccountNumber('UG0RYK-CH-123456')).toBe('**** 3456');
		expect(maskAccountNumber('Account 123456789')).toBe('**** 6789');
	});

	it('uses the whole value when no hyphen or space is present', () => {
		expect(maskAccountNumber('8821')).toBe('**** 8821');
		expect(maskAccountNumber('882123456')).toBe('**** 3456');
	});
});

describe('formatAccountTransferLabel', () => {
	it('uses product name and the same visible suffix as maskAccountNumber', () => {
		expect(formatAccountTransferLabel('Everyday Checking', 'Everyday Checking 8821')).toBe(
			'Everyday Checking...8821'
		);
		expect(formatAccountTransferLabel('Everyday Checking', 'UG0RYK-CH-009')).toBe(
			'Everyday Checking...009'
		);
		expect(formatAccountTransferLabel('High-Yield Savings', 'UG0RYK-SV-010')).toBe(
			'High-Yield Savings...010'
		);
	});
});

describe('formatAmountInputValue', () => {
	it('formats with grouping and two decimal places', () => {
		expect(formatAmountInputValue(1000, 'USD', 'en-US')).toBe('1,000.00');
		expect(formatAmountInputValue(1000.5, 'USD', 'en-US')).toBe('1,000.50');
	});

	it('respects locale grouping', () => {
		expect(formatAmountInputValue(1000, 'EUR', 'de-DE')).toBe('1.000,00');
	});
});

describe('currencyInputAffix', () => {
	it('uses prefix symbol for USD in en-US', () => {
		expect(currencyInputAffix('USD', 'en-US')).toEqual({ symbol: '$', position: 'prefix' });
	});

	it('uses suffix symbol for EUR in de-DE', () => {
		const affix = currencyInputAffix('EUR', 'de-DE');
		expect(affix.position).toBe('suffix');
		expect(affix.symbol).toMatch(/€/);
	});
});
