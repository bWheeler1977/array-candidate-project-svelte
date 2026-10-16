/**
 * Server-only NorthWind HTTP client. Keeps the API key in `$env/dynamic/private` and maps
 * error bodies to `NorthwindApiError` so actions can show API validation messages in the UI.
 */
import { env } from '$env/dynamic/private';
import { getRequestAccessToken, getRequestApiBaseUrl } from '$lib/server/requestAuth';
import type { ApiErrorBody } from '$lib/types/northwind';
import { messages } from '$lib/i18n';

const DEFAULT_BASE = 'https://northwind.dev.array.io';

export class NorthwindApiError extends Error {
	status: number;
	body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.name = 'NorthwindApiError';
		this.status = status;
		this.body = body;
	}
}

function baseUrl(): string {
	return getRequestApiBaseUrl() || env.NORTHWIND_API_BASE_URL?.trim() || DEFAULT_BASE;
}

function bearerToken(): string {
	const embedToken = getRequestAccessToken();
	if (embedToken) return embedToken;

	const key = env.NORTHWIND_API_KEY?.trim();
	if (!key) {
		throw new Error(
			'NORTHWIND_API_KEY is not set. Copy .env.example to .env and add your interview API key, or initialize the embedded widget with an access token.'
		);
	}
	return key;
}

async function northwindRequest<T>(
	path: string,
	init: RequestInit & { method: 'GET' | 'POST' }
): Promise<T> {
	const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
	let response: Response;
	try {
		response = await fetch(url, {
			...init,
			headers: {
				Authorization: `Bearer ${bearerToken()}`,
				Accept: 'application/json',
				...(init.body ? { 'Content-Type': 'application/json' } : {}),
				...init.headers
			}
		});
	} catch {
		throw new Error(messages.errors.apiUnreachable);
	}

	let payload: unknown = null;
	const text = await response.text();
	if (text) {
		try {
			payload = JSON.parse(text);
		} catch {
			throw new Error('NorthWind API returned invalid JSON.');
		}
	}

	if (!response.ok) {
		const body = payload ?? null;
		const errBody = body as ApiErrorBody | null;
		const message =
			errBody?.message ??
			errBody?.error ??
			extractValidationMessage(body) ??
			`NorthWind API error (${response.status})`;
		throw new NorthwindApiError(message, response.status, body);
	}

	return payload as T;
}

function extractValidationMessage(body: unknown): string | undefined {
	if (typeof body !== 'object' || body === null) return undefined;
	const record = body as Record<string, unknown>;
	const validation = record.validation;
	if (typeof validation !== 'object' || validation === null) return undefined;
	const issues = (validation as Record<string, unknown>).issues;
	if (!Array.isArray(issues) || issues.length === 0) return undefined;
	const first = issues[0];
	if (typeof first !== 'object' || first === null) return undefined;
	const message = (first as Record<string, unknown>).message;
	return typeof message === 'string' ? message : undefined;
}

export async function northwindGet<T>(path: string): Promise<T> {
	return northwindRequest<T>(path, { method: 'GET' });
}

export async function northwindPost<T>(path: string, body: unknown): Promise<T> {
	return northwindRequest<T>(path, {
		method: 'POST',
		body: JSON.stringify(body)
	});
}
