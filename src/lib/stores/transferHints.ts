import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
	TRANSFER_HINTS_STORAGE_KEY,
	type TransferEndpointHint
} from '$lib/utils/transferEndpointHints';

function readHints(): TransferEndpointHint[] {
	if (!browser) return [];
	try {
		const raw = sessionStorage.getItem(TRANSFER_HINTS_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? (parsed as TransferEndpointHint[]) : [];
	} catch {
		return [];
	}
}

function writeHints(hints: TransferEndpointHint[]): void {
	if (!browser) return;
	sessionStorage.setItem(TRANSFER_HINTS_STORAGE_KEY, JSON.stringify(hints.slice(0, 30)));
}

export const transferEndpointHints = writable<TransferEndpointHint[]>(readHints());

export function recordTransferEndpointHint(hint: TransferEndpointHint): void {
	if (!browser) return;
	const existing = readHints().filter(
		(entry) =>
			!(hint.transferId && entry.transferId === hint.transferId) &&
			!(hint.referenceNumber && entry.referenceNumber === hint.referenceNumber)
	);
	writeHints([hint, ...existing]);
	transferEndpointHints.set(readHints());
}
