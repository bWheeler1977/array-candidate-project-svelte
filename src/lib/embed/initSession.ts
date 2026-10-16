import type { EmbedInitResponse, HostWidgetConfig } from '$lib/types/embed';

export interface InitSessionOptions {
	/** Widget app origin (SvelteKit deploy URL). Defaults to current origin. */
	widgetOrigin?: string;
	fetch?: typeof fetch;
}

/**
 * Host-side helper: POST access token (+ optional account holder / account snapshot)
 * to the widget origin so subsequent navigations use httpOnly cookies.
 */
export async function initNorthwindEmbedSession(
	config: HostWidgetConfig,
	options: InitSessionOptions = {}
): Promise<EmbedInitResponse> {
	const origin =
		options.widgetOrigin?.replace(/\/$/, '') ??
		(typeof window !== 'undefined' ? window.location.origin : '');
	const fetchFn = options.fetch ?? fetch;

	const response = await fetchFn(`${origin}/embed/init`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(config)
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `Embed init failed (${response.status})`);
	}

	return (await response.json()) as EmbedInitResponse;
}
