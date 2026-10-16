import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestAuthContext {
	accessToken?: string;
	apiBaseUrl?: string;
}

const requestAuth = new AsyncLocalStorage<RequestAuthContext>();

export function runWithRequestAuth<T>(
	context: RequestAuthContext,
	fn: () => T | Promise<T>
): Promise<T> {
	return Promise.resolve(requestAuth.run(context, fn));
}

export function getRequestAccessToken(): string | undefined {
	return requestAuth.getStore()?.accessToken?.trim() || undefined;
}

export function getRequestApiBaseUrl(): string | undefined {
	return requestAuth.getStore()?.apiBaseUrl?.trim() || undefined;
}
