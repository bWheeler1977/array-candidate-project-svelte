import type { Cookies } from '@sveltejs/kit';

export function mockCookies(): Cookies {
	const store = new Map<string, string>();
	return {
		get: (name: string) => store.get(name),
		set: (name: string, value: string) => {
			store.set(name, value);
		},
		delete: (name: string) => {
			store.delete(name);
		},
		getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
		serialize: () => ''
	} as unknown as Cookies;
}
