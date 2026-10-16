import { writable } from 'svelte/store';

/** Id of the account picker listbox that is open (`from-account`, `to-account`, …). */
export const openAccountSelectId = writable<string | null>(null);

export function setOpenAccountSelectId(id: string | null): void {
	openAccountSelectId.set(id);
}
