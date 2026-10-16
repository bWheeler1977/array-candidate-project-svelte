import { writable } from 'svelte/store';

/** True while switching active user and reloading layout/page data. */
export const isSessionRefreshing = writable(false);
